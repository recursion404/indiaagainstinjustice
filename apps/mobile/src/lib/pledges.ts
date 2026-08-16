import { supabase } from "./supabase";

export async function submitPledge(publicName: string) {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Please sign in before taking the pledge.");
  }

  const { data, error } = await supabase
    .from("pledges")
    .insert({
      user_id: user.id,
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
