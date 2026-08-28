import Link from "next/link";

const links = [
  { href: "/issues", label: "Issues" },
  { href: "/report", label: "Report" },
  { href: "/records", label: "Records" },
  { href: "/polls", label: "Polls" },
  { href: "/pledge", label: "Pledge" },
  { href: "/volunteer", label: "Volunteer" },
] as const;

export default function Navigation() {
  return (
    <nav className="flex min-w-0 flex-1 items-center justify-end gap-3">
      <div className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm shadow-slate-200/60 lg:flex">
        {links.map((link) => (
          <Link
            className="rounded-full px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-orange-100 hover:text-orange-800"
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="grid max-w-sm flex-1 grid-cols-3 gap-1 lg:hidden">
        {links.slice(0, 3).map((link) => (
          <Link
            className="rounded-2xl px-2 py-2 text-center text-[10px] font-black uppercase tracking-[0.08em] text-slate-600 hover:bg-orange-100 hover:text-orange-800 sm:text-xs"
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <Link
        className="hidden shrink-0 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-200 transition hover:bg-orange-700 md:inline-flex"
        href="/report"
      >
        Report issue
      </Link>
    </nav>
  );
}
