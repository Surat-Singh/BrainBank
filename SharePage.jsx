// src/pages/SharePage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card } from "../components/Card";

export function SharePage() {
  const { hash } = useParams();
  const [sharedItems, setSharedItems] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    console.log("🔑 [Client] URL hash =", hash);

    async function fetchSharedContent() {
      console.log(`🚀 [Client] fetching /api/v1/brain/${hash}`);
      try {
        const res = await fetch(`http://localhost:3000/api/v1/brain/${hash}`);
        console.log("📡 [Client] raw response:", res);

        if (!res.ok) {
          console.error("❌ [Client] bad response:", res.status);
          throw new Error("Failed to fetch shared content");
        }

        const data = await res.json();
        console.log("📦 [Client] parsed JSON:", data);

        const items = data.contents || data.content || [];
        console.log("🔍 [Client] extracted items:", items);

        if (!Array.isArray(items)) {
          console.error("⚠️ [Client] items not an array:", items);
          throw new Error("Invalid response format");
        }

        setSharedItems(items);
      } catch (err) {
        console.error("🔥 [Client] fetch error:", err);
        setError("Unable to load shared content.");
      } finally {
        setLoading(false);
        console.log("⏱️ [Client] loading=false");
      }
    }

    fetchSharedContent();
  }, [hash]);

  if (loading) return <div className="p-4">Loading shared content...</div>;
  if (error)   return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Shared Notes</h1>

      {sharedItems.length === 0 ? (
        <p>No shared content found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sharedItems.map((item, idx) => {
            console.log(`🖼️ [Client] rendering card #${idx}:`, item);
            return (
              <Card
                key={item._id || item.link || idx}
                articleText={item.title}
                link={item.link}
                type={item.contentType}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
