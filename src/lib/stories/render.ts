/** Minimal markdown-ish renderer for story bodies (## headings + paragraphs). */
export function renderStoryBody(content: string) {
  const blocks = content
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    if (block.startsWith("## ")) {
      return { type: "h2" as const, key: `h-${index}`, text: block.slice(3).trim() };
    }
    return { type: "p" as const, key: `p-${index}`, text: block.replace(/\n/g, " ") };
  });
}
