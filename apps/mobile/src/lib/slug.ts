export function makeSlug(parts: string[]) {
  return parts
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export function makePublicId() {
  const suffix = Math.floor(100000 + Math.random() * 900000);
  return `PUN-${suffix}`;
}
