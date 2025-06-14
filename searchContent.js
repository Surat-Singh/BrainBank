// src/weaviate/searchContent.ts
import { getEmbedding } from "./insertContent.js";
import { client } from "./clientInstance.js";
export async function searchSimilarTexts(query, collectionName, limit = 5) {
    const embedding = await getEmbedding(query);
    const results = await client.search(collectionName, {
        vector: embedding,
        limit,
        with_payload: true,
    });
    return results; // Type is inferred as `any[]`
}
