import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="container band">
      <h1>Page not found</h1>
      <p className="muted">
        This public page may not exist yet, or it may have been removed because it
        contained incomplete or sensitive information.
      </p>
      <Link className="button" href="/">
        Back to home
      </Link>
    </main>
  );
}
