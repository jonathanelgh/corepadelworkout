/** Renders plain-text post bodies (paragraphs separated by blank lines). */
export function PostBody({ text }: { text: string }) {
  const blocks = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className="space-y-4 text-zinc-700 leading-relaxed">
      {blocks.map((para, i) => (
        <p key={i}>{para}</p>
      ))}
    </div>
  );
}
