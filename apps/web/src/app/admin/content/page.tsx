"use client";

import { useEffect, useState } from "react";
import { getContentPosts, saveContentPost } from "@/lib/data";
import { supabase } from "@/lib/supabase";

const contentTypes = ["daily_highest_reported", "weekly_report", "most_supported_issue", "unresolved_issue", "authority_update", "public_transport_observation", "solution_proposal", "citizen_story", "poll_result", "pledge_milestone"];

export default function AdminContentPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [message, setMessage] = useState("Sign in as an admin to manage SEO content.");

  async function load() {
    try { const next = await getContentPosts(); setPosts(next); setMessage(`${next.length} content posts loaded.`); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load content."); }
  }
  useEffect(() => { supabase.auth.getSession().then(({ data }) => { if (data.session) void load(); }); }, []);

  return <main className="container band"><div className="sectionHeader"><div><span className="status">Admin content</span><h1>SEO publishing desk</h1></div><a className="button secondary" href="/admin">Moderation queue</a></div><p className="notice">{message}</p><div className="adminGrid"><section className="card queue"><button className="button" type="button" onClick={() => setSelected({})}>New post</button>{posts.map((post) => <button className="queueItem" type="button" key={post.id} onClick={() => setSelected(post)}><span className="status">{post.published_at ? "published" : "draft"}</span><strong>{post.title}</strong><small>{post.content_type}</small></button>)}</section>{selected ? <ContentForm post={selected} onSaved={async () => { await load(); setSelected(null); }} /> : <section className="card"><h2>Content posts</h2><p className="muted">Create public-interest reports, authority updates, citizen stories and pledge milestones with their SEO metadata.</p></section>}</div></main>;
}

function ContentForm({ post, onSaved }: { post: any; onSaved: () => Promise<void> }) {
  const [values, setValues] = useState({ title: post.title ?? "", slug: post.slug ?? "", excerpt: post.excerpt ?? "", body: post.body ?? "", content_type: post.content_type ?? contentTypes[0], seo_title: post.seo_title ?? "", meta_description: post.meta_description ?? "", primary_keyword: post.primary_keyword ?? "", secondary_keywords: (post.secondary_keywords ?? []).join(", "), featured_image_path: post.featured_image_path ?? "", social_title: post.social_title ?? "", social_description: post.social_description ?? "", social_image_path: post.social_image_path ?? "", canonical_url: post.canonical_url ?? "", schema_type: post.schema_type ?? "Article", indexable: Boolean(post.indexable), published: Boolean(post.published_at) });
  const [message, setMessage] = useState("");
  function update(name: string, value: string | boolean) { setValues((current) => ({ ...current, [name]: value })); }
  async function save() {
    try { await saveContentPost({ ...values, secondary_keywords: values.secondary_keywords.split(",").map((item: string) => item.trim()).filter(Boolean) }, post.id); setMessage("Content saved."); await onSaved(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save content."); }
  }
  return <section className="card form"><h2>{post.id ? "Edit content post" : "New content post"}</h2><label className="field">Title<input value={values.title} onChange={(event) => update("title", event.target.value)} /></label><label className="field">URL slug<input value={values.slug} onChange={(event) => update("slug", event.target.value)} /></label><label className="field">Content type<select value={values.content_type} onChange={(event) => update("content_type", event.target.value)}>{contentTypes.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</select></label><label className="field">Excerpt<textarea rows={2} value={values.excerpt} onChange={(event) => update("excerpt", event.target.value)} /></label><label className="field">Body<textarea rows={8} value={values.body} onChange={(event) => update("body", event.target.value)} /></label><div className="grid"><label className="field">SEO title<input value={values.seo_title} onChange={(event) => update("seo_title", event.target.value)} /></label><label className="field">Meta description<input value={values.meta_description} onChange={(event) => update("meta_description", event.target.value)} /></label><label className="field">Primary keyword<input value={values.primary_keyword} onChange={(event) => update("primary_keyword", event.target.value)} /></label><label className="field">Secondary keywords<input value={values.secondary_keywords} onChange={(event) => update("secondary_keywords", event.target.value)} /></label><label className="field">Featured image path<input value={values.featured_image_path} onChange={(event) => update("featured_image_path", event.target.value)} /></label><label className="field">Canonical URL<input value={values.canonical_url} onChange={(event) => update("canonical_url", event.target.value)} /></label><label className="field">Social title<input value={values.social_title} onChange={(event) => update("social_title", event.target.value)} /></label><label className="field">Social description<input value={values.social_description} onChange={(event) => update("social_description", event.target.value)} /></label><label className="field">Social image path<input value={values.social_image_path} onChange={(event) => update("social_image_path", event.target.value)} /></label><label className="field">Schema type<input value={values.schema_type} onChange={(event) => update("schema_type", event.target.value)} /></label></div><div className="checkList"><label><input type="checkbox" checked={values.published} onChange={(event) => update("published", event.target.checked)} /> Published</label><label><input type="checkbox" checked={values.indexable} onChange={(event) => update("indexable", event.target.checked)} /> Indexable</label></div><button className="button" type="button" onClick={save}>Save content</button>{message ? <p className="notice">{message}</p> : null}</section>;
}
