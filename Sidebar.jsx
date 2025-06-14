// src/components/Sidebar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { SidebarItem } from "./SidebarItem";
import { DocumentIcon } from "../icons/DocumentIcon";
import { PanelIcon } from "../icons/PanelIcon";
import { LogoutIcon } from "../icons/LogoutIcon";

export function Sidebar({
  currentState,
  newSideBarState,
  activeFilter,
  onFilterChange,
}) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  // Define filter items: key is the contentType or null for “All”
  const items = [
    { key: null, text: "All", icon: <DocumentIcon /> },
    { key: "twitter", text: "Tweets", icon: <DocumentIcon /> },
    { key: "youtube", text: "Videos", icon: <DocumentIcon /> },
    // Add more types if needed
  ];

  if (currentState) {
    return (
      <div className="w-56 flex flex-col bg-slate-100 fixed top-14 bottom-0 left-0 gap-6 px-3 py-4">
        {/* Header/title and close button */}
        <div className="flex items-center justify-between px-2">
          <h1 className="text-center font-semibold">BrainBank</h1>
          <button onClick={newSideBarState}>
            <PanelIcon titleVal="Close Sidebar" />
          </button>
        </div>

        {/* Filter items + Collections */}
        <div className="flex flex-col gap-2">
          {/* New Collections item */}
          <SidebarItem
            text="Collections"
            icon={<DocumentIcon />}
            onClick={() => navigate("/collections")}
          />

          {/* Existing filter items */}
          {items.map(({ key, text, icon }) => {
            const isActive = activeFilter === key;
            return (
              <SidebarItem
                key={String(key)}
                text={text}
                icon={icon}
                onClick={() => onFilterChange(key)}
                className={`${isActive ? "bg-gray-300 font-semibold" : ""}`}
              />
            );
          })}
        </div>

        {/* Push Logout to bottom */}
        <div className="mt-auto">
          <SidebarItem
            text="Logout"
            icon={<LogoutIcon />}
            onClick={handleLogout}
          />
        </div>
      </div>
    );
  } else {
    return (
      <div className="fixed top-14 left-0 w-12 h-12 m-2 rounded-md bg-slate-300 hover:bg-slate-200 flex justify-center items-center">
        <button onClick={newSideBarState}>
          <PanelIcon titleVal="Open Sidebar" />
        </button>
      </div>
    );
  }
}
