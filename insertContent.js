import { pipeline } from "@xenova/transformers";
//import {collectionName} from "./clientSchema";
import { client } from "./clientInstance.js";
export async function getEmbedding(text) {
    const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    const embedding = await embedder(text, { pooling: "mean", normalize: true });
    return Array.from(embedding.data);
}
export async function addDocument(id, collectionName, text) {
    const embedding = await getEmbedding(text); // Convert text to embedding
    await client.upsert(collectionName, {
        points: [
            {
                id, // Unique document ID
                vector: embedding, // 384-dimensional vector
                payload: { text }, // Store original text as metadata
            },
        ],
    });
    console.log(`Document ${id} added to Qdrant.`);
}
