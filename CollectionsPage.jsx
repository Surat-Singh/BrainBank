import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Backend_URL } from "../config";
import { FolderCard } from "../components/FolderCard";

export default function CollectionsPage() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchCollections = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const resp = await axios.get(`${Backend_URL}/collections`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      setCollections(resp.data.collections || []);
    } catch (err) {
      console.error("Error fetching collections:", err);
      setError("Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  const deleteCollection = async (name) => {
    const confirmDelete = window.confirm(`Delete collection '${name}'?`);
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${Backend_URL}/collections/${encodeURIComponent(name)}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      // Refetch collections after successful delete
      await fetchCollections();
    } catch (err) {
      console.error("Error deleting collection:", err);
      alert("Failed to delete collection. It may not be empty.");
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  return (
    <div className="p-4 mt-14">
      <h1 className="text-2xl font-bold mb-4">Your Collections</h1>

      {loading && <p>Loading collections...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && collections.length === 0 && (
        <p className="text-gray-500">You have no collections.</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {!loading &&
          collections.map((name) => (
            <FolderCard
              key={name}
              name={name}
              onClick={() => navigate(`/collections/${encodeURIComponent(name)}`)}
              onDelete={() => deleteCollection(name)}
            />
          ))}
      </div>
    </div>
  );
}
