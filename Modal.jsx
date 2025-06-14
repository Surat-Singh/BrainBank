import React, { useState, useEffect } from "react";
import { CloseIcons } from "../icons/CloseIcons";
import axios from "axios";
import { Backend_URL } from "../config";

export function Modal({ open, onClose, onSuccess }) {
  const [link, setLink] = useState("");
  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState("");
  const [newTag, setNewTag] = useState("");
  const [tags, setTags] = useState([]);
  const [collectionName, setCollectionName] = useState("");
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch existing collections on mount
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const token = localStorage.getItem("token");
        const resp = await axios.get(`${Backend_URL}/collections`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        setCollections(resp.data.collections || []);
      } catch (err) {
        console.error("Error fetching collections:", err);
      }
    };
    if (open) fetchCollections();
  }, [open]);

  if (!open) return null;

  const addTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed]);
    }
    setNewTag("");
  };

  const removeTag = idx => {
    setTags(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!link.trim() || !title.trim() || !contentType.trim() || !collectionName.trim()) {
      alert("Please fill all required fields.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${Backend_URL}/content`,
        { link, title, contentType, tags, collectionName },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      alert("Content added successfully!");
      onSuccess?.();
      // reset fields
      setLink("");
      setTitle("");
      setContentType("");
      setNewTag("");
      setTags([]);
      setCollectionName("");
    } catch (err) {
      console.error("Error adding content:", err);
      alert(err.response?.data?.error || "Failed to add content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white text-black rounded-lg p-6 w-full max-w-md mx-4 relative shadow-xl">
        <div className="absolute top-3 right-3 cursor-pointer" onClick={onClose}>
          <CloseIcons />
        </div>
        <h2 className="text-xl font-semibold mb-4 text-center">
          Add Content to Your SecondBrain
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className="border rounded p-2 text-black w-full bg-gray-100"
            type="text"
            placeholder="Link"
            value={link}
            onChange={e => setLink(e.target.value)}
            required
          />
          <input
            className="border rounded p-2 text-black w-full bg-gray-100"
            type="text"
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <input
            className="border rounded p-2 text-black w-full bg-gray-100"
            type="text"
            placeholder="Content Type (e.g., twitter, youtube, article)"
            value={contentType}
            onChange={e => setContentType(e.target.value)}
            required
          />

          {/* Collection Name with datalist */}
          <div>
            <input
              list="collection-list"
              className="border rounded p-2 text-black w-full bg-gray-100"
              placeholder="Collection Name"
              value={collectionName}
              onChange={e => setCollectionName(e.target.value)}
              required
            />
            <datalist id="collection-list">
              {collections.map((col, idx) => (
                <option key={idx} value={col} />
              ))}
            </datalist>
          </div>

          <div className="flex items-center">
            <input
              className="border rounded-l p-2 text-black w-full bg-gray-100"
              type="text"
              placeholder="Add a tag"
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <button
              type="button"
              onClick={addTag}
              className="bg-gray-800 text-white px-4 py-2 rounded-r hover:bg-gray-700 transition"
            >
              +
            </button>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="flex items-center bg-gray-200 text-gray-800 px-2 py-1 rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(idx)}
                    className="ml-1 text-gray-500 hover:text-gray-700"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`${loading ? "bg-gray-400 cursor-not-allowed" : "bg-gray-800 hover:bg-gray-700"} text-white px-4 py-2 rounded transition`}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
