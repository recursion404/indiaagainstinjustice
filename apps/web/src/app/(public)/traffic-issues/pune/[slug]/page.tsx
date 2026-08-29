import { redirect } from "next/navigation";

export default function LegacyTrafficIssuePage({
  params,
}: {
  params: { slug: string };
}) {
  redirect(`/issues/${params.slug}`);
}
