// src/components/Navbar.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./Button";
import { ShareIcon } from "../icons/ShareIcon";
import { PlusIcon } from "../icons/PlusIcon";
import { Modal } from "./Modal";
import { Backend_URL } from "../config";
import axios from "axios";

export function Navbar({ onContentAdded }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      // If empty query, you could navigate to home or show all
      navigate("/");
      return;
    }
    // Navigate to search page with query param
    navigate(`/search?title=${encodeURIComponent(trimmed)}`);
    // Optionally keep the query in input or clear:
    // setQuery("");
  };

  // Enhanced share handler with detailed logging (unchanged)
  const handleShare = async () => {
    const token = localStorage.getItem("token");
    console.log("[Navbar] handleShare: token=", token);
    if (!token) {
      alert("No auth token found; please log in.");
      return;
    }

    try {
      // Log the URL and payload
      const url = `${Backend_URL}/brain/share`;
      console.log("[Navbar] Sharing to URL:", url);
      console.log("[Navbar] Payload:", { share: true });
      const response = await axios.post(
        url,
        { share: true },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("[Navbar] Share response:", response);
      if (response.data && response.data.hash) {
        const hash = response.data.hash;
        const shareUrl = `${window.location.origin}/share/${hash}`;
        console.log("[Navbar] Generated shareUrl:", shareUrl);
        alert(shareUrl);
      } else {
        console.warn("[Navbar] Unexpected response shape:", response.data);
        alert("Share succeeded but no hash returned");
      }
    } catch (err) {
      // Differentiate axios error types
      if (err.response) {
        console.error(
          "[Navbar] Share request failed:",
          "status=",
          err.response.status,
          "data=",
          err.response.data
        );
        const msg =
          err.response.data?.message ||
          err.response.data?.error ||
          `Status ${err.response.status}`;
        alert("Failed to generate share link: " + msg);
      } else if (err.request) {
        console.error("[Navbar] No response received:", err.request);
        alert("No response from server when generating share link");
      } else {
        console.error("[Navbar] Error setting up request:", err.message);
        alert("Error generating share link: " + err.message);
      }
    }
  };

  return (
    <>
      <div className="flex w-full fixed bg-gray-200 p-2 rounded-md justify-between z-40">
        <h1 className="font-bold">All Notes</h1>

        <div className="flex gap-3 items-center">
          <form onSubmit={handleSearch} className="flex items-center">
            <input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border rounded p-2 text-black bg-gray-100"
            />
            <button
              type="submit"
              className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
            >
              Search
            </button>
          </form>

          {/* Share Brain button */}
          <Button
            onOpen={handleShare}
            text="Share Brain"
            variant="secondary"
            startIcon={<ShareIcon />}
          />

          {/* Add Content button */}
          <Button
            text="Add Content"
            variant="secondary"
            startIcon={<PlusIcon />}
            onOpen={handleOpenModal}
          />
        </div>
      </div>

      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={() => {
          handleCloseModal();
          onContentAdded();
        }}
      />
    </>
  );
}
