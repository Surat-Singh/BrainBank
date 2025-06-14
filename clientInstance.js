import { QdrantClient } from "@qdrant/js-client-rest";
import { config } from "../config.js";
export let client;
export async function qdrantInit() {
    client = new QdrantClient({
        url: config.connectionURL,
        apiKey: config.connectionKey,
        timeout: 10000,
        checkCompatibility: false,
    });
}
qdrantInit();
