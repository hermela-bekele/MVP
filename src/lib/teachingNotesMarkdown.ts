/** True when intro is a truncated / duplicated prefix of the full markdown body. */
export function isTruncatedMarkdownPrefix(intro: string, body: string): boolean {
  const a = intro.replace(/\s+\.\.\.\s*$/, '').trim();
  const b = body.trim();
  if (!a || !b) return false;
  if (b.startsWith(a)) return true;
  const sample = a.slice(0, Math.min(120, a.length));
  return sample.length >= 24 && b.startsWith(sample);
}

/** Drop a truncated leading copy when the same ## heading restarts the full note. */
export function stripDuplicatedMarkdownPrefix(text: string): string {
  const trimmed = text.trim();
  const headingMatch = trimmed.match(/^##\s+[^\n]+/m);
  if (!headingMatch) return trimmed;
  const firstHeading = headingMatch[0];
  const secondIdx = trimmed.indexOf(firstHeading, firstHeading.length);
  if (secondIdx <= 0 || secondIdx > trimmed.length / 2) return trimmed;
  const prefix = trimmed.slice(0, secondIdx).trim();
  const rest = trimmed.slice(secondIdx).trim();
  // Prefix is a short/truncated restart of the same document
  if (prefix.length < 800 || isTruncatedMarkdownPrefix(prefix, rest)) {
    return rest;
  }
  return trimmed;
}
