import { getOpenAI, getSearch } from "../../lib/azure";

export default async function handler(req, res) {
  if (process.env.AUTH_REQUIRED === "true") {
    // Add your auth check here (e.g., verify cookie/header set by Entra middleware)
  }
  if (req.method !== "POST") return res.status(405).end();
  const { prompt } = JSON.parse(req.body || "{}");
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  try {
    const { client: search } = getSearch();
    const aoai = getOpenAI();
    const chatDeployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt4o-chat";
    const embedDeployment = process.env.AZURE_EMBED_DEPLOYMENT || "embed-large";

    // 1) Embed the query for vector search
    const emb = await aoai.getEmbeddings(embedDeployment, [prompt]);
    const vector = emb.data[0].embedding;

    // 2) Hybrid search: free text + vector
    const results = await search.search(prompt, {
      vector: { value: vector, kNearestNeighborsCount: 5, fields: "embedding" },
      top: 5
    });

    const docs = [];
    for await (const r of results.results) {
      docs.push({ content: r.document.content, source: r.document.source });
      if (docs.length >= 5) break;
    }
    const context = docs.map((d, i) => `[${i + 1}] ${d.content}`).join("\n\n");

    // 3) Chat completion with grounded context
    const system = "You are the private assistant for Demo Firm. Use ONLY the provided context and be concise. If unsure, say you don't know.";
    const user = `Context:\n${context}\n\nQuestion: ${prompt}\n\nCite sources by [number].`;

    const completion = await aoai.getChatCompletions(chatDeployment, [
      { role: "system", content: system },
      { role: "user", content: user }
    ]);

    const answer = completion.choices?.[0]?.message?.content ?? "(no answer)";
    const citations = docs.map((d, i) => ({ n: i + 1, source: d.source }));
    res.json({ answer, citations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
}
