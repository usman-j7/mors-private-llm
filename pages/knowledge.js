import { useState } from "react";

export default function Knowledge() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  async function upload() {
    if (!file) return;
    setStatus("Uploading…");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) setStatus(`Indexed ${data.chunks} chunks from ${data.source}`);
    else setStatus(`Error: ${data.error || "upload failed"}`);
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 p-4 flex items-center justify-between">
        <a href="/" className="text-sm underline opacity-80 hover:opacity-100">← Chat</a>
        <h1 className="text-lg font-semibold">Knowledge Hub</h1>
        <div />
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="border border-neutral-800 rounded-2xl p-6 bg-neutral-900/50">
          <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} className="block mb-4" />
          <button onClick={upload} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg">Upload & Index</button>
          <div className="text-sm opacity-80 mt-3">{status}</div>
        </div>

        <p className="text-xs opacity-70">
          Files are stored privately in your Azure Storage account and indexed into your Azure AI Search index. Your data isn’t used to train models.
        </p>
      </main>
    </div>
  );
}
