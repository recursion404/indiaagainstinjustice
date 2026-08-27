"use client";

import { useEffect, useState } from "react";
import { getContentPosts, saveContentPost } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { ShieldAlert, FileText, ChevronRight, PenTool, LayoutGrid, CheckCircle2, ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

const contentTypes = [
  "daily_highest_reported",
  "weekly_report",
  "most_supported_issue",
  "unresolved_issue",
  "authority_update",
  "public_transport_observation",
  "solution_proposal",
  "citizen_story",
  "poll_result",
  "pledge_milestone"
];

export default function AdminContentPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [message, setMessage] = useState("Sign in as an admin to manage SEO content.");
  const [role, setRole] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);

  async function load() {
    try {
      const next = await getContentPosts();
      setPosts(next);
      setMessage(`${next.length} SEO content posts loaded.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load content.");
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        // Verify role
        supabase.from("profiles")
          .select("role")
          .eq("id", data.session.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile) {
              setRole(profile.role);
              if (profile.role === "admin" || profile.role === "superadmin") {
                void load();
              }
            }
          });
      }
    });
  }, []);

  if (!session || (role !== "admin" && role !== "superadmin")) {
    return (
      <main className="container max-w-xl mx-auto py-20 px-4 text-center">
        <ShieldAlert className="mx-auto text-orange-600 mb-3" size={40} />
        <h1 className="text-3xl font-black text-slate-950">Unauthorized</h1>
        <p className="text-slate-500 font-semibold mt-1">
          You must be signed in as an administrator to access the SEO publishing desk.
        </p>
        <Link href="/admin" className="inline-flex items-center gap-2 mt-6 px-6 py-3 text-sm font-black text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all">
          <ArrowLeft size={16} /> Go to Admin Sign In
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-orange-50 text-orange-700 border border-orange-100 uppercase tracking-widest mb-3">
            SEO Publishing Desk
          </span>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">
            Manage Public Articles & SEO Content
          </h1>
          <p className="text-slate-500 font-semibold mt-1">
            Publish citizen stories, weekly highlights, resolving milestones, and analytical reports.
          </p>
        </div>
        <Link 
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-black text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          href="/admin"
        >
          <ArrowLeft size={14} /> Back to Moderation Queue
        </Link>
      </div>

      <p className="p-4 rounded-xl border border-amber-100 bg-amber-50 text-amber-900 text-xs font-extrabold w-fit">{message}</p>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Post Queue */}
        <section className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 flex flex-col gap-4 lg:col-span-1 h-fit">
          <button 
            className="w-full px-5 py-3 text-sm font-black text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 rounded-xl shadow-md transition-all inline-flex items-center justify-center gap-2"
            type="button" 
            onClick={() => setSelected({})}
          >
            <Plus size={16} /> Write New Article
          </button>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {posts.map((post) => (
              <button 
                className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-2 ${
                  selected?.id === post.id 
                    ? "border-orange-500 bg-orange-50/10 shadow-md shadow-orange-950/2" 
                    : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200"
                }`} 
                type="button" 
                key={post.id} 
                onClick={() => setSelected(post)}
              >
                <div className="flex justify-between items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                    post.published_at 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}>
                    {post.published_at ? "published" : "draft"}
                  </span>
                  <small className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    {post.content_type.replaceAll("_", " ")}
                  </small>
                </div>
                <strong className="text-sm font-bold text-slate-900 line-clamp-1">
                  {post.title}
                </strong>
                {post.slug && (
                  <small className="text-xs font-semibold text-slate-400">
                    /{post.slug}
                  </small>
                )}
              </button>
            ))}

            {posts.length === 0 && (
              <p className="text-sm font-semibold text-slate-400 text-center py-8">
                No articles found in this desk.
              </p>
            )}
          </div>
        </section>

        {/* Right Side: Form Editor */}
        <div className="lg:col-span-2">
          {selected ? (
            <ContentForm post={selected} onSaved={async () => { await load(); setSelected(null); }} />
          ) : (
            <section className="bg-white rounded-3xl border border-slate-100 shadow-xl p-10 text-center flex flex-col items-center justify-center min-h-[300px]">
              <FileText className="text-slate-300 mb-3" size={32} />
              <h2 className="text-lg font-bold text-slate-800">SEO Article Desk</h2>
              <p className="text-sm font-semibold text-slate-400 mt-1 max-w-sm">
                Create search-optimized civic summaries, traffic insights, poll outcomes, or team notes to index across Google Search.
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function ContentForm({ post, onSaved }: { post: any; onSaved: () => Promise<void> }) {
  const [values, setValues] = useState({ 
    title: post.title ?? "", 
    slug: post.slug ?? "", 
    excerpt: post.excerpt ?? "", 
    body: post.body ?? "", 
    content_type: post.content_type ?? contentTypes[0], 
    seo_title: post.seo_title ?? "", 
    meta_description: post.meta_description ?? "", 
    primary_keyword: post.primary_keyword ?? "", 
    secondary_keywords: (post.secondary_keywords ?? []).join(", "), 
    featured_image_path: post.featured_image_path ?? "", 
    social_title: post.social_title ?? "", 
    social_description: post.social_description ?? "", 
    social_image_path: post.social_image_path ?? "", 
    canonical_url: post.canonical_url ?? "", 
    schema_type: post.schema_type ?? "Article", 
    indexable: Boolean(post.indexable), 
    published: Boolean(post.published_at) 
  });
  
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function update(name: string, value: string | boolean) { 
    setValues((current) => ({ ...current, [name]: value })); 
  }

  async function save() {
    if (!values.title.trim()) return setMessage("Please enter a title.");
    setSaving(true);
    setMessage("");
    try { 
      await saveContentPost({ 
        ...values, 
        secondary_keywords: values.secondary_keywords.split(",").map((item: string) => item.trim()).filter(Boolean) 
      }, post.id); 
      setMessage("Content saved successfully."); 
      await onSaved(); 
    } catch (error) { 
      setMessage(error instanceof Error ? error.message : "Unable to save content."); 
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-xl font-extrabold text-slate-950 tracking-tight leading-snug flex items-center gap-2">
          <PenTool size={18} className="text-orange-600" /> {post.id ? "Edit content post" : "New content post"}
        </h2>
        <p className="text-xs font-semibold text-slate-500 mt-1">
          Complete the article body and SEO meta tags to structure rich schema-ready output.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-extrabold text-slate-700 uppercase">Article Title</label>
            <input 
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold text-sm transition-all"
              value={values.title} 
              onChange={(event) => update("title", event.target.value)} 
              placeholder="e.g. Baner High Street Action Report"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-extrabold text-slate-700 uppercase">URL Slug</label>
            <input 
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold text-sm transition-all"
              value={values.slug} 
              onChange={(event) => update("slug", event.target.value)} 
              placeholder="e.g. baner-street-report"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-extrabold text-slate-700 uppercase">Content Type</label>
          <select 
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold text-sm bg-white"
            value={values.content_type} 
            onChange={(event) => update("content_type", event.target.value)}
          >
            {contentTypes.map((type) => (
              <option key={type} value={type}>{type.replaceAll("_", " ")}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-extrabold text-slate-700 uppercase">Excerpt / Summary Description</label>
          <textarea 
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold text-sm transition-all"
            rows={2} 
            value={values.excerpt} 
            onChange={(event) => update("excerpt", event.target.value)} 
            placeholder="Short introductory summary for listings..."
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-extrabold text-slate-700 uppercase">Article Body (Markdown Supported)</label>
          <textarea 
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold text-sm font-mono transition-all"
            rows={10} 
            value={values.body} 
            onChange={(event) => update("body", event.target.value)} 
            placeholder="Write full body article content here..."
          />
        </div>

        {/* SEO and Schema Fields Section */}
        <div className="border-t border-slate-100 pt-6 space-y-4">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-2">
            <LayoutGrid size={16} className="text-orange-600" /> Search Optimization & Metadata
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase">SEO Page Title</label>
              <input 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold text-sm"
                value={values.seo_title} 
                onChange={(event) => update("seo_title", event.target.value)} 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase">Meta Description</label>
              <input 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold text-sm"
                value={values.meta_description} 
                onChange={(event) => update("meta_description", event.target.value)} 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase">Primary Keyword</label>
              <input 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold text-sm"
                value={values.primary_keyword} 
                onChange={(event) => update("primary_keyword", event.target.value)} 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase">Secondary Keywords (comma separated)</label>
              <input 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold text-sm"
                value={values.secondary_keywords} 
                onChange={(event) => update("secondary_keywords", event.target.value)} 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase">Featured Image Path</label>
              <input 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold text-sm"
                value={values.featured_image_path} 
                onChange={(event) => update("featured_image_path", event.target.value)} 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase">Canonical URL Override</label>
              <input 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold text-sm"
                value={values.canonical_url} 
                onChange={(event) => update("canonical_url", event.target.value)} 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase">Social Title (OpenGraph)</label>
              <input 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold text-sm"
                value={values.social_title} 
                onChange={(event) => update("social_title", event.target.value)} 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase">Social Description (OpenGraph)</label>
              <input 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold text-sm"
                value={values.social_description} 
                onChange={(event) => update("social_description", event.target.value)} 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase">Social Image Path</label>
              <input 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold text-sm"
                value={values.social_image_path} 
                onChange={(event) => update("social_image_path", event.target.value)} 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase">Schema Structured Markup Type</label>
              <input 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold text-sm"
                value={values.schema_type} 
                onChange={(event) => update("schema_type", event.target.value)} 
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 py-3 bg-slate-50/50 rounded-2xl px-4 border border-slate-100 text-xs font-bold text-slate-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={values.published} onChange={(event) => update("published", event.target.checked)} /> 
            <span>Published Immediately</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={values.indexable} onChange={(event) => update("indexable", event.target.checked)} /> 
            <span>Allow Search Engines Indexing</span>
          </label>
        </div>

        <button 
          className="w-full px-6 py-3.5 text-sm font-black text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 rounded-xl shadow-lg transition-all cursor-pointer"
          type="button" 
          disabled={saving}
          onClick={save}
        >
          {saving ? "Saving content..." : "Save SEO Article"}
        </button>

        {message && (
          <p className="text-xs font-black text-orange-600 bg-orange-50/50 px-4 py-2 rounded-lg border border-orange-100 w-fit">{message}</p>
        )}
      </div>
    </section>
  );
}
