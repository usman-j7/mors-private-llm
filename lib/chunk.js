export function chunkText(text, chunkSize = 1500, overlap = 200) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length);
    const piece = text.slice(i, end);
    chunks.push(piece);
    i += chunkSize - overlap;
  }
  return chunks;
}
