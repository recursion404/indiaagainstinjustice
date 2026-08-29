import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_REQUEST_TIMEOUT_MS = 15000;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase public environment variables.");
}

const fetchWithTimeout: typeof fetch = async (input, init) => {
  if (init?.signal) return fetch(input, init);

  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), SUPABASE_REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Supabase request timed out. Please check the Supabase Auth service and try again.");
    }

    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: fetchWithTimeout,
  },
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
  },
});
