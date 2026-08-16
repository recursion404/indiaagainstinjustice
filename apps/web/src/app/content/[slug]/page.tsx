import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedContentBySlug } from "@/lib/data";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPublishedContentBySlug(params.slug);
  if (!post) return {};
  return { title: post.seo_title || post.title, description: post.meta_description || post.excerpt || undefined, alternates: { canonical: post.canonical_url || `/content/${post.slug}` }, robots: post.indexable ? undefined : { index: false, follow: true } };
}

export default async function ContentPage({ params }: { params: { slug: string } }) {
  const post = await getPublishedContentBySlug(params.slug);
  if (!post) notFound();
  const jsonLd = { "@context": "https://schema.org", "@type": post.schema_type || "Article", headline: post.title, description: post.excerpt, datePublished: post.published_at, mainEntityOfPage: `/content/${post.slug}` };
  return <main className="container band"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /><span className="status">{post.content_type.replaceAll("_", " ")}</span><h1>{post.title}</h1>{post.excerpt ? <p className="lead">{post.excerpt}</p> : null}<article className="card contentBody">{post.body.split("\n").map((paragraph: string, index: number) => <p key={index}>{paragraph}</p>)}</article></main>;
}
