import { supabase } from "./supabase";

export async function submitPledge(publicName: string, userId: string | null) {
  if (!userId) {
    throw new Error("Please sign in before taking the pledge.");
  }

  const { data, error } = await supabase
    .from("pledges")
    .insert({
      user_id: userId,
      public_name: publicName.trim() || null,
      city: "Pune"
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchPledgeCount() {
  const { count, error } = await supabase
    .from("pledges")
    .select("id", { count: "exact", head: true });

  if (error) {
    throw error;
  }

  return count ?? 0;
}
