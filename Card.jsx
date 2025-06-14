import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Backend_URL } from "../config";
import { ShareIcon } from "../icons/ShareIcon";
import { TrashIcon } from "../icons/TrashIcon";
import { DocumentIcon } from "../icons/DocumentIcon";

export function Card({ id, articleText, link, type, onDeleteSuccess }) {
  const [loadingShare, setLoadingShare] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const currentDate = new Date().toLocaleDateString("en-IN");
  const twitterScriptAddedRef = useRef(false);

  useEffect(() => {
    if (type === "twitter") {
      if (!twitterScriptAddedRef.current) {
        const script = document.createElement("script");
        script.src = "https://platform.twitter.com/widgets.js";
        script.async = true;
        document.body.appendChild(script);
        twitterScriptAddedRef.current = true;
      } else if (window.twttr && window.twttr.widgets) {
        window.twttr.widgets.load();
      }
    }
  }, [type, link]);

  const toEmbedUrl = (watchUrl) => {
    try {
      const url = new URL(watchUrl);
      let videoId = null;
      if (url.searchParams.has("v")) videoId = url.searchParams.get("v");
      else if (url.hostname === "youtu.be") videoId = url.pathname.slice(1);
      if (!videoId) return null;
      const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);
      ["start", "list"].forEach((param) => {
        if (url.searchParams.has(param)) {
          embedUrl.searchParams.set(param, url.searchParams.get(param));
        }
      });
      return embedUrl.toString();
    } catch {
      return null;
    }
  };

  const youtubeSrc = type === "youtube" ? toEmbedUrl(link) : null;

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this content?")) return;
    setLoadingDelete(true);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${Backend_URL}/content/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onDeleteSuccess?.();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setLoadingDelete(false);
    }
  };

  const handleShare = async () => {
    if (!id) return;
    setLoadingShare(true);
    try {
      const token = localStorage.getItem("token");
      const resp = await axios.post(
        `${Backend_URL}/content/${id}/share`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const hash = resp.data.hash;
      const url = `${window.location.origin}/share/${hash}`;
      try {
        await navigator.clipboard.writeText(url);
        alert("Copied to clipboard: " + url);
      } catch {
        alert("Share link: " + url);
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setLoadingShare(false);
    }
  };

  // Determine link target: for PDFs point to backend static URL, else use provided link
  const href = type === "pdf" && link.startsWith("/uploads")
    ? `${Backend_URL}${link}`
    : link;

  return (
    <div className="flex flex-col justify-between bg-white rounded-md shadow p-4 w-64 h-auto">
      <div className="flex items-start justify-between">
        <div className="flex items-center min-w-0">
          <DocumentIcon className="flex-shrink-0 mr-2" />
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium truncate"
            title={articleText}
          >
            {articleText}
          </a>
        </div>
        {id && (
          <div className="flex-shrink-0 flex space-x-1 ml-2">
            <button
              onClick={handleShare}
              disabled={loadingShare}
              className="p-1 hover:bg-gray-100 rounded"
              title={loadingShare ? "Sharing..." : "Share"}
            >
              <ShareIcon className={loadingShare ? "opacity-50" : ""} />
            </button>
            <button
              onClick={handleDelete}
              disabled={loadingDelete}
              className="p-1 hover:bg-gray-100 rounded"
              title={loadingDelete ? "Deleting..." : "Delete"}
            >
              <TrashIcon className={loadingDelete ? "opacity-50" : ""} />
            </button>
          </div>
        )}
      </div>

      <div className="mt-3">
        {type === "youtube" && youtubeSrc && (
          <iframe
            src={youtubeSrc}
            className="w-full aspect-video rounded"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        )}
        {type === "twitter" && (
          <blockquote className="twitter-tweet">
            <a href={link.replace("x.com", "twitter.com")} />
          </blockquote>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600">Added on {currentDate}</div>
    </div>
  );
}
