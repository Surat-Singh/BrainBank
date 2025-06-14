// src/scraper/extractor.ts
import * as cheerio from "cheerio";
/**
 * Extracts visible text from HTML, concatenates paragraphs, then chunks.
 */
export function extractText(html, chunkSize = 1000) {
    const $ = cheerio.load(html);
    // Collect all <p> text
    const paragraphs = $("p")
        .map((_, el) => $(el).text().trim())
        .get()
        .filter((txt) => txt.length > 0);
    // Join into one big string, then split into chunks
    const fullText = paragraphs.join("\n\n");
    const chunks = [];
    for (let start = 0; start < fullText.length; start += chunkSize) {
        chunks.push(fullText.slice(start, start + chunkSize));
    }
    return chunks;
}
