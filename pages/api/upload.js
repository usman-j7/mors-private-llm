import { getOpenAI, getSearch, getBlob } from "../../lib/azure";
import { chunkText } from "../../lib/chunk";
import formidable from "formidable";
import pdfParse from "pdf-parse";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (process.env.AUTH_REQUIRED === "true") {
    // Add your auth check here (e.g., header from your Entra middleware)
  }
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { container } = getBlob();
    const { client: search } = getSearch();
    const aoai = getOpenAI();
    const embedDeployment = process.env.AZURE_EMBED_DEPLOYMENT || "embed-large";

    const form = formidable({ multiples: false });
    const { files } = await new Promise((resolve, reject) =>
      form.parse(req, (err, fields, files) => (err ? reject(err) : resolve({ fields, files })))
    );

    const file = files?.file;
    if (!file) return res.status(400).json({ error: "file required" });

    // 1) Upload to Blob
    const data = await fsRead(file.filepath);
    const blobName = `demo/${Date.now()}_${file.originalFilename}`;
    await container.getBlockBlobClient(blobName).uploadData(data, { blobHTTPHeaders: { blobContentType: file.mimetype } });

    // 2) Extract text (PDF-only for demo; extend for DOCX later)
    let text = "";
    if (file.mimetype === "application/pdf") {
      const parsed = await pdfParse(data);
      text = parsed.text || "";
    } else {
      text = data.toString("utf8");
    }
    if (!text.trim()) return res.status(400).json({ error: "No text extracted" });

    // 3) Chunk
    const chunks = chunkText(text, 2000, 250);

    // 4) Embed + upsert to Azure AI Search
    const batch = [];
    for (const chunk of chunks) {
      const emb = await aoai.getEmbeddings(embedDeployment, [chunk]);
      const vector = emb.data[0].embedding;
      batch.push({
        id: cryptoRandomId(),
        content: chunk,
        source: file.originalFilename,
        tenant_id: "demo",
        embedding: vector
      });
      // upload in small batches to keep memory down
      if (batch.length >= 16) {
        await search.uploadDocuments(batch);
        batch.length = 0;
      }
    }
    if (batch.length) await search.uploadDocuments(batch);

    res.json({ status: "indexed", chunks: chunks.length, source: file.originalFilename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
}

import { readFile } from "fs/promises";
import crypto from "crypto";
function cryptoRandomId() { return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex"); }
async function fsRead(p) { return await readFile(p); }
