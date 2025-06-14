// at top of index.ts
import { fetchContent } from "./scraper/fetcher.js";
import { addDocument } from "./weaviate/insertContent.js";
import { Collection } from "./db.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { config } from "./config.js";
import { Content, User, Tag, SharedContent } from './db.js';
import { nanoid } from "nanoid";
import "dotenv/config";
import { verifyToken } from "./middleware.js";
import cors from "cors";
const app = express();
app.use(cors({
    origin: "http://127.0.0.1:5173", // or "http://localhost:5173"
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.options("*", cors({
    origin: "http://127.0.0.1:5173",
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());
app.post("/api/v1/signup", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    try {
        if (!username || !password) {
            res.status(400).json("Input is not Valid");
            return;
        }
        const exists = await User.findOne({ username: username });
        if (exists) {
            res.status(403).json("User already exists with this username");
            return;
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = await User.create({
            username: username,
            password: hashedPassword
        });
        const id = newUser._id;
        const token = jwt.sign({ id }, config.jwtSecret, { expiresIn: "2d" });
        res.status(200).json({
            message: "Signed up"
        });
    }
    catch (error) {
        //console.error("Internal Server Error: ",error);
        res.status(500).json({
            status: "500 Internal Server Error",
            message: "500 Internal Server Error, User not created",
        });
    }
});
app.post("/api/v1/signin", async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            res.status(404).json("User not found");
            return;
        }
        if (typeof user.password === "string") {
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                res.status(401).json({ message: "Invalid password" });
                return;
            }
        }
        const id = user._id;
        // ✅ Ensure "pdf" collection exists
        const pdfExists = await Collection.findOne({ userId: id, name: "pdf" });
        if (!pdfExists) {
            await Collection.create({ userId: id, name: "pdf" });
            console.log(`Created default "pdf" collection for user ${id}`);
        }
        const token = jwt.sign({ id }, config.jwtSecret, { expiresIn: "2d" });
        res.status(200).json({ token });
        return;
    }
    catch (error) {
        console.error("Signin Error:", error);
        res.status(500).json({ error: "Login failed" });
        return;
    }
});
app.post("/api/v1/content", verifyToken, async (req, res) => {
    try {
        const { link, contentType, title, tags, collectionName } = req.body;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized: no user ID" });
            return;
        }
        // 4. Find existing tags
        const existingTags = await Tag.find({ title: { $in: tags } }).exec();
        // 5. Determine new tags to insert
        const existingTagTitles = existingTags.map((t) => t.title);
        const newTagTitles = tags.filter((t) => !existingTagTitles.includes(t));
        let newTags = [];
        if (newTagTitles.length > 0) {
            newTags = await Tag.insertMany(newTagTitles.map((t) => ({ title: t })), { ordered: false });
        }
        // 6. Combine tag IDs
        const allTagDocs = [...existingTags, ...newTags];
        const tagIds = allTagDocs.map((tagDoc) => tagDoc._id);
        // 6.5 Add collection if collectionName is provided
        if (collectionName && typeof collectionName === "string" && collectionName.trim() !== "") {
            await Collection.updateOne({ userId: userId, name: collectionName.trim() }, { $setOnInsert: { userId: userId, name: collectionName.trim() } }, { upsert: true });
        }
        // 7. Create Content document
        await Content.create({
            link: link.trim(),
            contentType: contentType.trim(),
            title: title.trim(),
            tags: tagIds,
            userId: new mongoose.Types.ObjectId(userId),
            collectionName: collectionName.trim(), // ✅ ADD THIS LINE
        });
        res.status(201).json({ message: "Content created" });
        return;
    }
    catch (error) {
        console.error("Error in /api/v1/content:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Oops! Content creation failed." });
        }
        return;
    }
});
app.post("/api/v1/content/:contentId/share", verifyToken, async (req, res) => {
    // @ts-ignore
    const userId = req.userId;
    const { contentId } = req.params;
    console.log("🔐 [ShareSingle] req.userId =", userId, "contentId =", contentId);
    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    if (!mongoose.Types.ObjectId.isValid(contentId)) {
        res.status(400).json({ error: "Invalid contentId" });
        return;
    }
    try {
        // Check ownership
        const objectUserId = new mongoose.Types.ObjectId(userId);
        const contentDoc = await Content.findOne({ _id: contentId, userId: objectUserId }).lean();
        if (!contentDoc) {
            res.status(404).json({ error: "Content not found or not owned by you" });
            return;
        }
        // Generate fresh sharedId
        const sharedId = nanoid(10);
        console.log("🎁 [ShareSingle] generated sharedId =", sharedId);
        // Insert into SharedContent
        try {
            await SharedContent.create({
                sharedId,
                contentId: contentDoc._id,
            });
        }
        catch (e) {
            console.warn("[ShareSingle] Error inserting SharedContent:", e);
            // Likely no error since sharedId is fresh. If duplicate occurs, ignore or handle.
        }
        // Build share URL
        const baseDomain = config.domain?.replace(/\/$/, "") || "http://localhost:3000";
        const shareUrl = `${baseDomain}/api/v1/brain/${sharedId}`;
        console.log("🚀 [ShareSingle] shareUrl =", shareUrl);
        res.status(200).json({ shareUrl, hash: sharedId });
    }
    catch (err) {
        console.error("[ShareSingle] Unexpected error:", err);
        res.status(500).json({ error: "Failed to share content" });
    }
});
app.get("/api/v1/content", verifyToken, async (req, res) => {
    //@ts-ignore
    const userId = req.userId;
    try {
        const content = await Content.find({ userId });
        if (!content) {
            res.json({ message: "no content found" });
            return;
        }
        res.json({ content });
    }
    catch (error) {
        res.status(500).json({ error: "Something went wrong" });
    }
});
app.delete("/api/v1/content/:contentId", verifyToken, async (req, res) => {
    try {
        // @ts-ignore
        const userId = req.userId;
        const { contentId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(contentId)) {
            res.status(400).json({ error: "Invalid content ID" });
            return;
        }
        const result = await Content.findOneAndDelete({ userId: userId, _id: contentId });
        if (!result) {
            res.status(404).json({ error: "Content not found or cannot be deleted" });
            return;
        }
        // Return a JSON object
        res.status(200).json({ message: "Content deleted successfully", deletedId: contentId });
    }
    catch (error) {
        console.error("[DELETE /content/:contentId] Error:", error);
        res.status(500).json({ error: "Something went wrong deleting content" });
    }
});
app.get("/api/v1/findTitle", verifyToken, async (req, res) => {
    const rawTitle = req.query.title;
    // Narrow to a single string (covers undefined, arrays, and ParsedQs)
    if (typeof rawTitle !== "string") {
        res
            .status(400)
            .json({ error: "`title` query parameter must be a single string" });
        return;
    }
    const title = rawTitle.trim();
    if (!title) {
        res.status(400).json({ error: "`title` cannot be empty" });
        return;
    }
    try {
        const results = await Content.find({
            title: { $regex: title, $options: "i" },
        }).exec();
        res.json({ count: results.length, results });
    }
    catch (err) {
        console.error("Error in findTitle:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
app.post("/api/v1/brain/share", verifyToken, async (req, res) => {
    const userId = req.userId;
    console.log("🔐 [Share] req.userId =", userId);
    if (!userId) {
        console.log("❌ [Share] no userId, unauthorized");
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    // 🧪 DEBUG: Check all content belonging to this user
    const objectId = new mongoose.Types.ObjectId(userId);
    const allUserContent = await Content.find({ userId: objectId }).lean();
    console.log("🧪 [Share] All user content:", allUserContent.map((c) => ({
        id: c._id,
        title: c.title,
        createdAt: c.createdAt,
    })));
    if (allUserContent.length === 0) {
        console.log("ℹ️ [Share] No content found for this user");
        res.status(404).json({ error: "No content found to share" });
        return;
    }
    // 1) Load all content IDs for this user
    const contents = allUserContent.map((c) => ({ _id: c._id }));
    console.log(`📂 [Share] found ${contents.length} Content docs:`, contents);
    // 2) Generate a fresh sharedId
    const sharedId = nanoid(10);
    console.log("🎁 [Share] generated sharedId =", sharedId);
    const docs = contents.map((c) => ({
        sharedId,
        contentId: c._id,
    }));
    console.log(`[📦 Share] Prepared ${docs.length} docs to insert`);
    // 3) Insert into SharedContent (ignore duplicates)
    try {
        await SharedContent.insertMany(docs, { ordered: false });
        console.log("✅ [Share] insertMany succeeded");
    }
    catch (err) {
        console.warn("⚠️ [Share] insertMany partial failure (some may already exist):", err?.code, err?.writeErrors?.length);
    }
    // 4) Count what was stored
    const storedCount = await SharedContent.countDocuments({ sharedId });
    console.log(`📊 [Share] actually stored ${storedCount} docs for sharedId=${sharedId}`);
    // 5) Build and return the share URL
    const domain = config.domain?.replace(/\/$/, "") || "http://localhost:3000";
    const shareUrl = `${domain}/api/v1/brain/${sharedId}`;
    console.log("🚀 [Share] responding with shareUrl =", shareUrl);
    res.status(200).json({ shareUrl, hash: sharedId });
});
// GET /api/v1/brain/:shareId
app.get("/api/v1/brain/:shareId", async (req, res) => {
    const { shareId } = req.params;
    console.log("🔑 [FetchShare] shareId param =", shareId);
    // fetch the sharedContent docs
    const sharedContent = await SharedContent.find({ sharedId: shareId }).populate("contentId");
    console.log(`📦 [FetchShare] found ${sharedContent.length} docs:`, sharedContent);
    if (sharedContent.length === 0) {
        console.log("❌ [FetchShare] no shared content found");
        res.status(404).json({ error: "Shared content not found" });
        return;
    }
    const contents = sharedContent.map((doc) => doc.contentId);
    console.log("📤 [FetchShare] returning contents array:", contents);
    res.json({ contents });
});
// ────────────────────────────────────────────────────────
// Collections CRUD
// ────────────────────────────────────────────────────────
app.get("/api/v1/collections", verifyToken, async (req, res) => {
    try {
        // Turn the string userId into an ObjectId
        const userObjectId = new mongoose.Types.ObjectId(req.userId);
        // Fetch all collections belonging to this user
        const docs = await Collection.find({ userId: userObjectId })
            .select("name -_id") // only return the `name` field
            .lean();
        // Extract names into a simple array
        const collections = docs.map((doc) => doc.name);
        res.status(200).json({ collections });
        return;
    }
    catch (err) {
        console.error("[GET /collections] Error:", err);
        res.status(500).json({ error: "Failed to list collections" });
        return;
    }
});
app.get("/api/v1/collections/:name/contents", verifyToken, async (req, res) => {
    const collectionName = decodeURIComponent(req.params.name);
    const userId = req.userId;
    console.log("[COLLECTION FETCH] For:", { userId, collectionName });
    try {
        const items = await Content.find({
            userId,
            collectionName,
        });
        console.log(`[FOUND ${items.length}] items in '${collectionName}' for user ${userId}`);
        res.status(200).json({ collection: collectionName, items });
    }
    catch (err) {
        console.error("[GET /collections/:name/content] Error:", err);
        res.status(500).json({ error: "Failed to list collection content" });
    }
});
// 3) Rename a collection
app.put("/api/v1/collections/:oldName", verifyToken, async (req, res) => {
    const oldName = decodeURIComponent(req.params.oldName);
    const newName = String(req.body.newName || "").trim();
    if (!newName) {
        res.status(400).json({ error: "Missing `newName` in body" });
        return;
    }
    try {
        // Check target unique
        const conflict = await Content.exists({
            userId: req.userId,
            collectionName: newName,
        });
        if (conflict) {
            res.status(409).json({ error: "newName already in use" });
            return;
        }
        // Update all docs in that collection
        const result = await Content.updateMany({ userId: req.userId, collectionName: oldName }, { $set: { collectionName: newName } });
        if (result.matchedCount === 0) {
            res.status(404).json({ error: "Collection not found" });
            return;
        }
        res.status(200).json({ oldName, newName });
    }
    catch (err) {
        console.error("[PUT /collections/:oldName] Error:", err);
        res.status(500).json({ error: "Failed to rename collection" });
    }
});
// 4) Delete a collection
app.delete("/api/v1/collections/:name", verifyToken, async (req, res) => {
    const userId = req.userId;
    const collectionName = decodeURIComponent(req.params.name);
    console.log("[DELETE COLLECTION] Request for:", { userId, collectionName });
    try {
        // Check if content exists in the collection
        const contentCount = await Content.countDocuments({ userId, collectionName });
        if (contentCount > 0) {
            res.status(400).json({
                error: `Cannot delete '${collectionName}' because it still contains ${contentCount} item(s).`,
            });
            return;
        }
        // Proceed to delete the collection
        const result = await Collection.deleteOne({ userId, name: collectionName });
        if (result.deletedCount === 0) {
            res.status(404).json({ error: "Collection not found or already deleted." });
            return;
        }
        console.log(`[COLLECTION DELETED]: '${collectionName}' for user ${userId}`);
        res.status(200).json({ message: `Collection '${collectionName}' deleted.` });
    }
    catch (err) {
        console.error("[DELETE /collections/:name] Error:", err);
        res.status(500).json({ error: "Failed to delete collection." });
    }
});
// 5) List content in a specific collection
app.get("/api/v1/collections/:name/content", verifyToken, async (req, res) => {
    const name = decodeURIComponent(req.params.name);
    try {
        const items = await Content.find({
            userId: req.userId,
            collectionName: name,
        }).lean();
        res.status(200).json({ collection: name, items });
    }
    catch (err) {
        console.error("[GET /collections/:name/content] Error:", err);
        res.status(500).json({ error: "Failed to list collection content" });
    }
});
// POST /api/v1/upload/pdf
// 1. Determine uploads directory based on project root
const uploadsDir = path.resolve(process.cwd(), "uploads");
console.log("Serving uploads from:", uploadsDir);
fs.mkdirSync(uploadsDir, { recursive: true });
// 2. Serve static files under /uploads
app.use("/api/v1/uploads", express.static(uploadsDir));
// 3. Multer setup writing to same uploadsDir/pdfs
const storage = multer.diskStorage({
    destination(req, file, cb) {
        const pdfDir = path.join(uploadsDir, "pdfs");
        fs.mkdirSync(pdfDir, { recursive: true });
        cb(null, pdfDir);
    },
    filename(req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
});
const upload = multer({ storage });
// 4. Upload endpoint
app.post("/api/v1/upload/pdf", verifyToken, (req, res) => {
    upload.single("pdf")(req, res, async (err) => {
        if (err) {
            console.error("[UploadPDF] Multer error:", err);
            const msg = err instanceof Error ? err.message : "Unknown upload error";
            return res.status(400).json({ error: "Upload failed", details: msg });
        }
        console.log("[UploadPDF] req.file:", req.file);
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        // Log where the file was saved:
        console.log("[UploadPDF] multer saved file at:", req.file.path);
        console.log("[UploadPDF] absolute path:", path.resolve(req.file.path));
        try {
            const userId = req.userId;
            const title = req.file.originalname;
            const link = `/uploads/pdfs/${req.file.filename}`;
            // Ensure "pdf" collection exists...
            let collection = await Collection.findOne({ userId, name: "pdf" });
            if (!collection) {
                collection = await Collection.create({ userId, name: "pdf" });
            }
            // Create Content; cast userId if needed:
            await Content.create({
                userId: new mongoose.Types.ObjectId(userId),
                link,
                title,
                contentType: "pdf",
                collectionName: "pdf",
                size: req.file.size,
                originalName: req.file.originalname,
                storageName: req.file.filename,
            });
            return res.status(200).json({ message: "PDF uploaded and saved", link });
        }
        catch (error) {
            console.error("[UploadPDF] Handler error:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    });
});
import { checkCollectionExists, creatingCollection, } from './weaviate/clientSchema.js';
app.post('/api/v1/ingest', verifyToken, async (req, res) => {
    // Destructure and type the incoming body
    const { url, collectionName, title, tags, } = req.body;
    if (!url) {
        res.status(400).json({ error: 'Missing `url` in request body' });
        return;
    }
    if (!collectionName) {
        res.status(400).json({ error: 'Missing `collectionName` in request body' });
        return;
    }
    try {
        // 1) Scrape the URL
        console.log(`[Ingest] Fetching content from: ${url}`);
        const blocks = await fetchContent(url);
        if (blocks.length === 0) {
            res.status(404).json({ error: 'No content extracted from that URL' });
            return;
        }
        console.log(`[Ingest] Extracted ${blocks.length} blocks`);
        // 2) Ensure the collection exists (create if not)
        const exists = await checkCollectionExists(collectionName);
        if (!exists) {
            console.log(`[Ingest] Collection "${collectionName}" not found. Creating…`);
            await creatingCollection(collectionName);
        }
        // 3) Upsert each block into the specified collection
        for (let i = 0; i < blocks.length; i++) {
            const id = Date.now() + i;
            await addDocument(id, collectionName, blocks[i]);
        }
        // 4) Return success _and_ the actual blocks
        res.status(200).json({
            message: `Ingested ${blocks.length} blocks into "${collectionName}"`,
            chunks: blocks.length,
            blocks, // <— here are the actual text blocks
        });
    }
    catch (err) {
        console.error('[Ingest] Error:', err);
        const details = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: 'Ingestion failed', details });
    }
});
// import { searchSimilarTexts } from './weaviate/searchContent.js';
app.post('/api/v1/search', verifyToken, async (req, res) => {
    const { query, collectionName, limit = 5 } = req.body;
    if (!query) {
        res.status(400).json({ error: 'Missing `query` in request body' });
        return;
    }
    if (!collectionName) {
        res.status(400).json({ error: 'Missing `collectionName` in request body' });
        return;
    }
    try {
        // 2) Search the vector DB
        const results = await searchSimilarTexts(query, collectionName);
        // 3) Return the matched points with payload
        res.status(200).json({
            query,
            hits: results.map(r => ({
                id: r.id,
                score: r.score,
                payload: r.payload,
            })),
        });
    }
    catch (err) {
        console.error('[Search] Error:', err);
        const details = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: 'Search failed', details });
    }
});
import { generateAnswer } from "./llm/localGenerator.js";
import { searchSimilarTexts } from "./weaviate/searchContent.js";
app.post("/api/v1/ask", verifyToken, async (req, res) => {
    const { question, collectionName, k = 3, charLimit = 500, // max chars for “concise” fallback
     } = req.body;
    if (!question || !collectionName) {
        res.status(400).json({ error: "Missing `question` or `collectionName`" });
        return;
    }
    // 1) Fetch context chunks
    const hits = await searchSimilarTexts(question, collectionName, k);
    if (!hits.length) {
        res.status(404).json({ error: "No context found" });
        return;
    }
    const fullContext = hits.slice(0, 1)
        .map(h => h.payload.text)
        .join("\n\n");
    // 2) Build messages
    const systemInstruction = `
      You are an expert in both AI and its applications. 
      First, refer to the provided context; if it doesn’t cover the user’s question fully, answer using your broader knowledge.
      Do NOT just repeat the context verbatim.
      If you truly don’t know, answer like a normal ai."
      `.trim();
    const promptMessages = [
        { role: "system", content: systemInstruction },
        { role: "system", content: `Context:\n${fullContext}` },
        { role: "user", content: question },
    ];
    try {
        // 3) Generate full answer
        let answer = await generateAnswer(promptMessages);
        // 4) If it exceeds our char limit, ask for a concise summary
        if (answer.length > charLimit) {
            const summaryInstruction = `
          You are a concise assistant. Here is a detailed answer:

          ${answer}

          Please **rewrite** this answer in your own words, preserving **all factual information**, and make it **no longer than ${charLimit} characters**. Do not add new information or remove key points.
          `.trim();
            const summaryMessages = [
                { role: "system", content: summaryInstruction }
            ];
            answer = await generateAnswer(summaryMessages);
        }
        // 5) Return either the full or the concise answer
        res.status(200).json({
            question,
            answer,
            source: {
                id: hits[0].id,
                score: hits[0].score,
                text: hits[0].payload.text,
            },
        });
    }
    catch (err) {
        console.error("[Ask] Error:", err);
        const details = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: "Ask failed", details });
    }
});
export default app;
app.listen(3000);
