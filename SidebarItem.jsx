// src/components/SidebarItem.jsx
import React from "react";

export function SidebarItem({ text, icon, onClick, className = "" }) {
  return (
    <div
      onClick={onClick}
      className={`w-48 px-2 py-3 rounded-md flex bg-slate-200 justify-center items-center gap-2 cursor-pointer shadow-md hover:bg-slate-300 transition ${className}`}
    >
      {icon}
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}
