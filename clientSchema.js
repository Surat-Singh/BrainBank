import { client } from "./clientInstance.js";
export async function creatingCollection(collectionName) {
    try {
        await client.createCollection(collectionName, {
            vectors: {
                size: 384,
                distance: "Cosine",
            },
            optimizers_config: {
                default_segment_number: 2,
            },
            replication_factor: 1,
        });
        console.log(`Collection '${collectionName}' created successfully.`);
    }
    catch (error) {
        console.error("Error creating collection:", error);
    }
}
export async function checkCollectionExists(collectionName) {
    try {
        const collections = await client.getCollections();
        const exists = collections.collections.some(col => col.name === collectionName);
        if (exists) {
            console.log(` Collection '${collectionName}' exists.`);
            return true;
        }
        else {
            console.log(` Collection '${collectionName}' NOT found.`);
            return false;
        }
    }
    catch (error) {
        console.error(" Error checking collections:", error);
    }
}
