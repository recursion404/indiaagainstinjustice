import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Tone = "default" | "orange" | "urgent" | "success" | "green" | "muted" | "slate" | "dark";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cn("mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8", className)}>{children}</main>;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-10 flex flex-col justify-between gap-5 border-b border-slate-100 pb-7 md:flex-row md:items-end", className)}>
      <div className="max-w-3xl">
        {eyebrow ? <div className="mb-3">{typeof eyebrow === "string" ? <Badge>{eyebrow}</Badge> : eyebrow}</div> : null}
        <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
        {description ? <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-500 sm:text-base">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-900/5", className)}>{children}</section>;
}

export function Badge({ children, tone = "default", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  const tones: Record<Tone, string> = {
    default: "border-orange-100 bg-orange-50 text-orange-700",
    orange: "border-orange-100 bg-orange-50 text-orange-700",
    urgent: "border-rose-100 bg-rose-50 text-rose-700",
    success: "border-emerald-100 bg-emerald-50 text-emerald-700",
    green: "border-emerald-100 bg-emerald-50 text-emerald-700",
    muted: "border-slate-200 bg-slate-100 text-slate-700",
    slate: "border-slate-200 bg-slate-100 text-slate-700",
    dark: "border-slate-800 bg-slate-900 text-white"
  };

  return <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-widest", tones[tone], className)}>{children}</span>;
}

export function ButtonLink({
  children,
  href,
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: "primary" | "secondary" | "dark" | "ghost" }) {
  const variants = {
    primary: "bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-100 hover:from-orange-700 hover:to-amber-600",
    secondary: "border border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700",
    dark: "bg-slate-900 text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800",
    ghost: "bg-slate-100 text-slate-700 hover:bg-slate-200"
  };

  return (
    <Link className={cn("inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black transition-all hover:-translate-y-0.5", variants[variant], className)} href={href} {...props}>
      {children}
    </Link>
  );
}

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: "primary" | "secondary" | "dark" | "ghost" }) {
  const variants = {
    primary: "bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-100 hover:from-orange-700 hover:to-amber-600",
    secondary: "border border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700",
    dark: "bg-slate-900 text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800",
    ghost: "bg-slate-100 text-slate-700 hover:bg-slate-200"
  };

  return (
    <button className={cn("inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black transition-all disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:-translate-y-0.5", variants[variant], className)} type="button" {...props}>
      {children}
    </button>
  );
}

export function Field({ label, error, children, className }: { label: ReactNode; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-2 text-sm font-extrabold text-slate-700", className)}>
      <span>{label}</span>
      {children}
      {error ? <span className="text-xs font-bold text-rose-600">{error}</span> : null}
    </label>
  );
}

export const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20";

export function EmptyState({ title, description, action }: { title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <Card className="mx-auto max-w-xl py-16 text-center">
      <h2 className="text-xl font-black text-slate-900">{title}</h2>
      {description ? <p className="mt-2 text-sm font-semibold text-slate-500">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </Card>
  );
}

export function Notice({ children, tone = "default", className }: { children: ReactNode; tone?: Exclude<Tone, "dark">; className?: string }) {
  const tones: Record<Exclude<Tone, "dark">, string> = {
    default: "border-orange-100 bg-orange-50 text-orange-800",
    orange: "border-orange-100 bg-orange-50 text-orange-800",
    urgent: "border-rose-100 bg-rose-50 text-rose-800",
    success: "border-emerald-100 bg-emerald-50 text-emerald-800",
    green: "border-emerald-100 bg-emerald-50 text-emerald-800",
    muted: "border-slate-200 bg-slate-50 text-slate-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700"
  };

  return <div className={cn("rounded-xl border p-4 text-sm font-extrabold", tones[tone], className)}>{children}</div>;
}

export function StatCard({ label, value, tone = "muted", className }: { label: ReactNode; value: ReactNode; tone?: "muted" | "urgent" | "success"; className?: string }) {
  const tones = {
    muted: "text-slate-900",
    urgent: "text-rose-600",
    success: "text-emerald-600"
  };

  return (
    <Card className={cn("flex min-h-32 flex-col justify-between p-6", className)}>
      <span className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</span>
      <strong className={cn("mt-4 text-4xl font-black", tones[tone])}>{value}</strong>
    </Card>
  );
}
