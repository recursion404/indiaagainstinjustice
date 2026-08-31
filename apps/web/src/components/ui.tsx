import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Tone = "default" | "orange" | "urgent" | "success" | "green" | "muted" | "slate" | "dark";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cn("mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8", className)}>{children}</main>;
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
    <div className={cn("mb-8 flex flex-col justify-between gap-5 border-b border-border pb-6 md:flex-row md:items-end", className)}>
      <div className="max-w-3xl">
        {eyebrow ? <div className="mb-3">{typeof eyebrow === "string" ? <Badge>{eyebrow}</Badge> : eyebrow}</div> : null}
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm", className)}>{children}</section>;
}

export function Badge({ children, tone = "default", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  const tones: Record<Tone, string> = {
    default: "border-primary/20 bg-primary/10 text-primary",
    orange: "border-primary/20 bg-primary/10 text-primary",
    urgent: "border-destructive/20 bg-destructive/10 text-destructive",
    success: "border-secondary/20 bg-secondary/10 text-secondary",
    green: "border-secondary/20 bg-secondary/10 text-secondary",
    muted: "border-border bg-muted text-muted-foreground",
    slate: "border-border bg-muted text-muted-foreground",
    dark: "border-foreground bg-foreground text-background"
  };

  return <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium", tones[tone], className)}>{children}</span>;
}

export function ButtonLink({
  children,
  href,
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: "primary" | "secondary" | "dark" | "ghost" }) {
  const variants = {
    primary: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
    secondary: "border border-input bg-background text-foreground shadow-sm hover:bg-muted",
    dark: "bg-foreground text-background shadow-sm hover:bg-foreground/90",
    ghost: "text-foreground hover:bg-muted"
  };

  return (
    <Link className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", variants[variant], className)} href={href} {...props}>
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
    primary: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
    secondary: "border border-input bg-background text-foreground shadow-sm hover:bg-muted",
    dark: "bg-foreground text-background shadow-sm hover:bg-foreground/90",
    ghost: "text-foreground hover:bg-muted"
  };

  return (
    <button className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", variants[variant], className)} type="button" {...props}>
      {children}
    </button>
  );
}

export function Field({ label, error, children, className }: { label: ReactNode; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-2 text-sm font-medium text-foreground", className)}>
      <span>{label}</span>
      {children}
      {error ? <span className="text-xs font-medium text-destructive">{error}</span> : null}
    </label>
  );
}

export const inputClassName =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function EmptyState({ title, description, action }: { title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <Card className="mx-auto max-w-xl py-16 text-center">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </Card>
  );
}

export function Notice({ children, tone = "default", className }: { children: ReactNode; tone?: Exclude<Tone, "dark">; className?: string }) {
  const tones: Record<Exclude<Tone, "dark">, string> = {
    default: "border-primary/20 bg-primary/10 text-primary",
    orange: "border-primary/20 bg-primary/10 text-primary",
    urgent: "border-destructive/20 bg-destructive/10 text-destructive",
    success: "border-secondary/20 bg-secondary/10 text-secondary",
    green: "border-secondary/20 bg-secondary/10 text-secondary",
    muted: "border-border bg-muted text-muted-foreground",
    slate: "border-border bg-muted text-muted-foreground"
  };

  return <div className={cn("rounded-md border p-4 text-sm font-medium", tones[tone], className)}>{children}</div>;
}

export function StatCard({ label, value, tone = "muted", className }: { label: ReactNode; value: ReactNode; tone?: "muted" | "urgent" | "success"; className?: string }) {
  const tones = {
    muted: "text-foreground",
    urgent: "text-destructive",
    success: "text-secondary"
  };

  return (
    <Card className={cn("flex min-h-28 flex-col justify-between p-5", className)}>
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <strong className={cn("mt-4 text-3xl font-semibold", tones[tone])}>{value}</strong>
    </Card>
  );
}
