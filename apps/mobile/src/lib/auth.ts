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
    await upsertCurrentProfile(fullName);
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

  await upsertCurrentProfile(data.user.user_metadata.full_name ?? "");
  return data;
}

export async function signOutCitizen() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function upsertCurrentProfile(fullName: string) {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      full_name: fullName.trim() || user.email,
      role: "citizen"
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
