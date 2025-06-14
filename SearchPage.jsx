// src/pages/SearchPage.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { Backend_URL } from "../config";
import axios from "axios";

export default function SearchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Helper to get query param 'title'
  const getQueryParam = (param) => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get(param);
  };

  const titleQuery = getQueryParam("title") || "";

  useEffect(() => {
    const fetchResults = async () => {
      const trimmed = titleQuery.trim();
      if (!trimmed) {
        // No query: navigate back or show message
        setResults([]);
        setCount(0);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        // Build URL: assume Backend_URL ends with /api/v1
        const url = `${Backend_URL}/findTitle?title=${encodeURIComponent(trimmed)}`;
        const resp = await axios.get(url, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        // Backend returns { count, results }
        const data = resp.data;
        const arr = data.results ?? [];
        setResults(arr);
        setCount(data.count ?? arr.length);
      } catch (err) {
        console.error("[SearchPage] fetch error:", err);
        setError("Failed to fetch search results.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [titleQuery]);

  const handleNewSearch = (newQuery) => {
    // For example, if you want to support changing query from here
    navigate(`/search?title=${encodeURIComponent(newQuery)}`);
  };

  return (
    <div className="p-4 mt-14"> {/* mt-14 to push below navbar */}
      <h1 className="text-xl font-bold mb-4">
        Search results for "{titleQuery}"
      </h1>
      {loading && <p className="text-gray-500">Searching…</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && (
        <>
          <p className="mb-4 text-gray-700">
            {count !== null
              ? `Found ${count} result${count === 1 ? "" : "s"}`
              : ""}
          </p>
          {results.length === 0 ? (
            <p className="text-gray-500">No matching content found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((item, idx) => (
                <Card
                  key={item._id ?? idx}
                  id={item._id}
                  type={item.contentType}
                  articleText={item.title}
                  link={item.link}
                  onDeleteSuccess={() => {
                    // If desired: after deleting a result, refetch search results
                    // For simplicity, just remove from local state:
                    setResults((prev) =>
                      prev.filter((c) => c._id !== item._id)
                    );
                    setCount((prevCount) => (prevCount != null ? prevCount - 1 : null));
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
