export function CoachChatMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g).map((chunk, j) => {
          if (chunk.startsWith("**") && chunk.endsWith("**")) {
            return (
              <strong key={j} className="font-semibold text-zinc-900">
                {chunk.slice(2, -2)}
              </strong>
            );
          }
          return <span key={j}>{chunk}</span>;
        });
        return (
          <span key={i}>
            {parts}
            {i < lines.length - 1 ? <br /> : null}
          </span>
        );
      })}
    </>
  );
}
