import React from "react";
import { FolderIcon, Trash2Icon } from "lucide-react";

/**
 * FolderCard Component
 * Props:
 * - name: string - collection/folder name
 * - onClick?: () => void - open handler
 * - onDelete?: () => void - delete handler (with confirmation)
 */
export function FolderCard({ name, onClick, onDelete }) {
  const handleDelete = (e) => {
    e.stopPropagation(); // prevent triggering folder open
    const confirmDelete = window.confirm(`Delete collection '${name}'?`);
    if (confirmDelete && onDelete) {
      onDelete();
    }
  };

  return (
    <div
      onClick={onClick}
      className="relative flex flex-col items-center cursor-pointer p-4 bg-gray-100 hover:bg-gray-200 rounded-md transition group"
    >
      {/* Delete button in top right */}
      {onDelete && (
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 text-gray-500 hover:text-red-600 transition"
        >
          <Trash2Icon className="w-4 h-4" />
        </button>
      )}

      {/* Folder name */}
      <span
        className="text-sm font-medium mb-2 truncate max-w-full text-center"
        title={name}
      >
        {name}
      </span>

      {/* Folder icon */}
      <FolderIcon className="w-12 h-12 text-gray-700" />
    </div>
  );
}
