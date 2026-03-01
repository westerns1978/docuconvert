export function chunkText(text: string, sentencesPerChunk: number = 5): string[] {
  // A basic sentence tokenizer for the browser
  // Matches sequences of characters ending in ., !, ?, or newlines
  const sentences = text.match(/[^.!?\n]+[.!?\n]+(?:\s|$)/g) || [text];
  
  const chunks: string[] = [];
  for (let i = 0; i < sentences.length; i += sentencesPerChunk) {
    // Join sentences, normalize whitespace, and trim
    const chunk = sentences.slice(i, i + sentencesPerChunk).join('').replace(/\s+/g, ' ').trim();
    
    // Skip empty or very short chunks (matching the Python script's > 20 chars rule)
    if (chunk.length > 20) {
      chunks.push(chunk);
    }
  }
  return chunks;
}

export function createEmbeddingsJsonl(chunks: string[]): string {
  return chunks.map(chunk => JSON.stringify({ text: chunk })).join('\n');
}
