import { supabase } from "./supabase";

export type PollOption = {
  id: string;
  label: string;
  voteCount: number;
};

export type PublicPoll = {
  id: string;
  question: string;
  slug: string;
  options: PollOption[];
  selectedOptionId: string | null;
};

type PollRow = {
  id: string;
  question: string;
  slug: string;
  poll_options: Array<{
    id: string;
    label: string;
    vote_count: number;
  }>;
};

export async function fetchPublicPolls(userId: string | null): Promise<PublicPoll[]> {
  const { data: polls, error } = await supabase
    .from("polls")
    .select("id, question, slug, poll_options(id, label, vote_count)")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const pollRows = (polls ?? []) as PollRow[];
  const pollIds = pollRows.map((poll) => poll.id);
  const selectedByPollId = await fetchCurrentUserVotes(pollIds, userId);

  return pollRows.map((poll) => ({
    id: poll.id,
    question: poll.question,
    slug: poll.slug,
    selectedOptionId: selectedByPollId[poll.id] ?? null,
    options: poll.poll_options
      .map((option) => ({
        id: option.id,
        label: option.label,
        voteCount: option.vote_count
      }))
      .sort((a, b) => b.voteCount - a.voteCount || a.label.localeCompare(b.label))
  }));
}

async function fetchCurrentUserVotes(pollIds: string[], userId: string | null) {
  if (!userId || pollIds.length === 0) {
    return {} as Record<string, string>;
  }

  const { data, error } = await supabase
    .from("poll_votes")
    .select("poll_id, option_id")
    .in("poll_id", pollIds)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return Object.fromEntries((data ?? []).map((vote) => [vote.poll_id, vote.option_id]));
}

export async function voteInPoll(pollId: string, optionId: string, userId: string | null) {
  if (!userId) {
    throw new Error("Please sign in before voting in polls.");
  }

  const { error } = await supabase.from("poll_votes").upsert(
    {
      poll_id: pollId,
      option_id: optionId,
      user_id: userId
    },
    {
      onConflict: "poll_id,user_id"
    }
  );

  if (error) {
    throw error;
  }
}
