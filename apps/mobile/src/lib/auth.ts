import { supabase } from "./supabase";

export type AuthDraft = {
  email: string;
  password: string;
  fullName: string;
};

export async function signUpCitizen({ email, password, fullName }: AuthDraft) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        full_name: fullName.trim()
      }
    }
  });

  if (error) {
    throw error;
  }

  if (data.session) {
    await upsertCurrentProfile(data.user?.id ?? null, fullName, data.user?.email ?? null);
  }

  return data;
}

export async function signInCitizen(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password
  });

  if (error) {
    throw error;
  }

  await upsertCurrentProfile(
    data.user.id,
    data.user.user_metadata.full_name ?? "",
    data.user.email ?? null
  );
  return data;
}

export async function signOutCitizen() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function upsertCurrentProfile(
  userId: string | null,
  fullName: string,
  email: string | null
) {
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      full_name: fullName.trim() || email,
      role: "citizen"
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
