// src/scraper/fetcher.ts
import mql from '@microlink/mql';
/**
 * Fetches the main text content of a page via Microlink's zero‑config SDK call.
 * Falls back to description or title if no content blocks are found.
 *
 * @param url – the URL to scrape
 * @returns – an array of text blocks
 */
export async function fetchContent(url) {
    // NOTE: mql() has no proper TS types, so we cast to any
    const { status, data, error } = await mql(url);
    if (status !== 'success' || !data) {
        const msg = error?.message || 'Microlink returned no data';
        throw new Error(msg);
    }
    // 1) try the high‑recall field
    // Microlink often returns data.content.text as a big string
    let textBlocks = [];
    if (data.content?.text) {
        textBlocks = data.content.text
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 30);
    }
    // 2) fallback to description (short summary)
    if (!textBlocks.length && data.description) {
        textBlocks = [data.description.trim()];
    }
    // 3) fallback to the page title
    if (!textBlocks.length && data.title) {
        textBlocks = [data.title.trim()];
    }
    if (!textBlocks.length) {
        throw new Error('No content returned');
    }
    return textBlocks;
}
