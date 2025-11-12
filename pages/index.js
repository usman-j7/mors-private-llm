import { useState } from "react";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!prompt.trim()) return;
    setLoading(true);
    const me = { role: "user", content: prompt };
    setMessages(m => [...m, me]);
    setPrompt("");
    const res = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ prompt }) });
    const data = await res.json();
    const bot = { role: "assistant", content: data.answer, citations: data.citations || [] };
    setMessages(m => [...m, bot]);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 p-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">MORS Private AI</h1>
        <a href="/knowledge" className="text-sm underline opacity-80 hover:opacity-100">Knowledge Hub</a>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-4">
        <div className="space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : ""}>
              <div className={m.role === "user" ? "inline-block bg-blue-600/20 border border-blue-600/30 rounded-xl px-3 py-2" : "inline-block bg-neutral-800/60 border border-neutral-700 rounded-xl px-3 py-2"}>
                <div className="whitespace-pre-wrap">{m.content}</div>
                {m.citations?.length ? (
                  <div className="text-xs mt-2 opacity-70">
                    Sources: {m.citations.map(c => `[${c.n} ${c.source}]`).join("  ")}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 bg-neutral-950 pt-4">
          <div className="flex gap-2">
            <textarea
              className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-600"
              rows={3}
              placeholder="Ask about your uploaded documents…"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
            />
            <button
              onClick={send}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg disabled:opacity-50"
            >
              {loading ? "Thinking…" : "Send"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
