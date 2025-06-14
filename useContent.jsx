// src/hooks/useContent.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { Backend_URL } from "../config";

export function useContent() {
  const [contents, setContents] = useState([]);
  const prevContentsRef = useRef([]);

  const refresh = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${Backend_URL}/content`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      const newContents = data.contents ?? data.content ?? [];
      const prevJSON = JSON.stringify(prevContentsRef.current);
      const nextJSON = JSON.stringify(newContents);

      if (nextJSON !== prevJSON) {
        setContents(newContents);
        prevContentsRef.current = newContents;
      }
    } catch (err) {
      console.error("failed to fetch content:", err);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { contents, refresh };
}
