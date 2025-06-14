import mongoose, { Schema } from "mongoose";
import { config } from "./config.js";
async function main() {
    try {
        await mongoose.connect(config.mongourl);
        console.log("connected to MongoDB");
    }
    catch (error) {
        console.log("MongoDB Connection Failed:", error);
        process.exit(1);
    }
}
main();
// User schema/model
const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: [6, "minimum length must be 6"] },
}, { timestamps: true });
// Tag schema/model
const tagSchema = new Schema({
    title: { type: String, required: true, unique: true },
}, { timestamps: true });
// Collection schema/model
const collectionSchema = new Schema({
    name: { type: String, required: true },
    userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
collectionSchema.index({ userId: 1, name: 1 }, { unique: true });
// Content schema/model (for links and uploaded PDFs)
const contentSchema = new Schema({
    link: {
        type: String,
        required: function () {
            return this.contentType !== 'pdf';
        },
    },
    contentType: { type: String, required: true },
    title: { type: String, required: true },
    tags: [{ type: mongoose.Types.ObjectId, ref: "Tag", required: true }],
    userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    collectionName: { type: String, required: true, default: "Default" },
    // PDF-specific fields
    storageName: {
        type: String,
        required: function () {
            return this.contentType === 'pdf';
        },
    },
    originalName: {
        type: String,
        required: function () {
            return this.contentType === 'pdf';
        },
    },
    size: {
        type: Number,
        required: function () {
            return this.contentType === 'pdf';
        },
    },
    textContent: { type: String }, // optional extracted text
}, { timestamps: true });
contentSchema.index({ userId: 1, collectionName: 1 });
// Link schema/model (e.g., for short links)
const linkSchema = new Schema({
    hash: { type: String, required: true, unique: true },
    userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
// SharedContent schema
const sharedContentSchema = new Schema({
    sharedId: { type: String, required: true, trim: true },
    contentId: { type: mongoose.Types.ObjectId, required: true, ref: "Content" },
}, { timestamps: true });
sharedContentSchema.index({ sharedId: 1, contentId: 1 }, { unique: true });
// Export models
export const User = mongoose.model("User", userSchema);
export const Tag = mongoose.model("Tag", tagSchema);
export const Collection = mongoose.model("Collection", collectionSchema);
export const Content = mongoose.model("Content", contentSchema);
export const Link = mongoose.model("Link", linkSchema);
export const SharedContent = mongoose.model("SharedContent", sharedContentSchema);
