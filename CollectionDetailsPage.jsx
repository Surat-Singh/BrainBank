import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Backend_URL } from "../config";
import { Card } from "../components/Card";

export default function CollectionDetailsPage() {
  const { name } = useParams();
  const decodedName = decodeURIComponent(name || "");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchCollectionContents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${Backend_URL}/collections/${encodeURIComponent(decodedName)}/contents`,
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );
      setItems(Array.isArray(res.data.items) ? res.data.items : []);
    } catch (err) {
      console.error("Error loading collection contents:", err);
      setError("Failed to load collection contents.");
    } finally {
      setLoading(false);
    }
  }, [decodedName]);

  useEffect(() => {
    fetchCollectionContents();
  }, [fetchCollectionContents]);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("pdf", selectedFile);
      const token = localStorage.getItem("token");
      await axios.post(`${Backend_URL}/upload/pdf`, formData, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "multipart/form-data",
        },
      });
      setSelectedFile(null);
      await fetchCollectionContents();
    } catch (err) {
      console.error("PDF upload error:", err);
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 mt-16">
      {/* Simple Black Heading */}
      <h1 className="text-2xl font-bold text-black mb-6">
        Collection: <span className="font-semibold">{decodedName}</span>
      </h1>

      {/* Upload section for "pdf" collection */}
      {decodedName.toLowerCase() === "pdf" && (
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 mb-8">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {selectedFile ? selectedFile.name : "Select PDF to upload"}
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="block w-full text-gray-900 bg-white border border-gray-300 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className={`w-full sm:w-auto px-5 py-2 rounded-md text-white font-semibold transition-colors duration-200 
              ${uploading ? "bg-blue-400 cursor-not-allowed" : selectedFile ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"}`}
          >
            {uploading ? "Uploading..." : "Upload PDF"}
          </button>
        </div>
      )}

      {/* Main content */}
      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">No items in this collection.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
          {items.map((c, i) => (
            <Card
              key={c._id || i}
              id={c._id}
              type={c.contentType}
              articleText={c.title}
              link={c.link}
              onDeleteSuccess={fetchCollectionContents}
            />
          ))}
        </div>
      )}
    </div>
  );
}