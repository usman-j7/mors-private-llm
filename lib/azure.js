import { OpenAIClient, AzureKeyCredential } from "@azure/openai";
import { SearchClient, AzureKeyCredential as SearchKey } from "@azure/search-documents";
import { BlobServiceClient } from "@azure/storage-blob";

export function getOpenAI() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const key = process.env.AZURE_OPENAI_KEY;
  if (!endpoint || !key) throw new Error("Missing AZURE_OPENAI_* env");
  return new OpenAIClient(endpoint, new AzureKeyCredential(key));
}

export function getSearch() {
  const endpoint = process.env.AZURE_SEARCH_ENDPOINT;
  const key = process.env.AZURE_SEARCH_KEY;
  const index = process.env.AZURE_SEARCH_INDEX || "idx-demo";
  if (!endpoint || !key) throw new Error("Missing AZURE_SEARCH_* env");
  const client = new SearchClient(endpoint, index, new SearchKey(key));
  return { client, index };
}

export function getBlob() {
  const conn = process.env.STORAGE_CONNECTION_STRING;
  const containerName = process.env.STORAGE_CONTAINER || "docs-demo";
  if (!conn) throw new Error("Missing STORAGE_CONNECTION_STRING");
  const svc = BlobServiceClient.fromConnectionString(conn);
  const container = svc.getContainerClient(containerName);
  return { svc, container };
}
