/** Unescape doubled backslashes so KaTeX sees real TeX commands. */
function unescapeLatex(src: string): string {
  return src
    .replace(/\\\\([a-zA-Z]+)/g, '\\$1')
    .replace(/\\\\([{}])/g, '\\$1')
    .replace(/\\\\([,;! ])/g, '\\$1');
}

/** Replace bare | with \mid so GFM tables do not split set-builder math. */
function neutralizePipes(inner: string): string {
  return unescapeLatex(inner)
    .replace(/\\\|/g, ' \\mid ')
    .replace(/(^|[^\\])\|/g, '$1\\mid ');
}

/**
 * Normalize AI / cached markdown so math renders cleanly in KaTeX.
 * - \(...\) / \[...\] → $...$ / $$...$$
 * - Collapse double-escaped TeX (\\frac → \frac)
 * - Do not rewrite ^ into unicode superscripts (breaks KaTeX)
 */
export function normalizeMarkdownMath(content: string): string {
  if (!content) return '';

  let s = content
    // Common AI noise: literal "\(" written as "\\(" in stored text
    .replace(/\\\\\[/g, '\\[')
    .replace(/\\\\\]/g, '\\]')
    .replace(/\\\\\(/g, '\\(')
    .replace(/\\\\\)/g, '\\)');

  // Display math \[ ... \]
  s = s.replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner: string) => `$$${unescapeLatex(inner.trim())}$$`);

  // Inline math \( ... \)
  s = s.replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner: string) => `$${unescapeLatex(inner.trim())}$`);

  // Protect $$ blocks first so the inline $ pass cannot split them
  const displayBlocks: string[] = [];
  s = s.replace(/\$\$([\s\S]+?)\$\$/g, (_m, inner: string) => {
    displayBlocks.push(`$$${neutralizePipes(inner)}$$`);
    return `\u0000DISPLAY${displayBlocks.length - 1}\u0000`;
  });

  // Unescape inside inline $...$ and neutralize | for GFM
  s = s.replace(/\$([^$\n]+?)\$/g, (_m, inner: string) => `$${neutralizePipes(inner)}$`);

  s = s.replace(/\u0000DISPLAY(\d+)\u0000/g, (_m, idx: string) => displayBlocks[Number(idx)] ?? '');

  // Wrap common bare TeX commands that were left outside delimiters
  s = s.replace(
    /(^|[^$\\])(\\(?:frac|sqrt|sum|int|prod|lim|sin|cos|tan|log|ln|cdot|times|div|pm|mp|leq|geq|neq|approx|infty|alpha|beta|gamma|delta|theta|pi|sigma|omega|text|mathbb|mathcal)(?:\{[^{}]*\})+)/g,
    (_m, before: string, tex: string) => `${before}$${tex}$`,
  );

  return s;
}
