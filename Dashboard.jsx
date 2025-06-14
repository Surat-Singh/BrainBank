// src/pages/Dashboard.jsx
import React, { useState, useMemo } from "react";
import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { Card } from "../components/Card";
import { useContent } from "../hooks/useContent";

export default function Dashboard() {
  const [sideBarOpen, setSideBarOpen] = useState(true);
  const { contents, refresh } = useContent();

  // filterType: null => show all; "youtube" or "twitter" to filter
  const [filterType, setFilterType] = useState(null);

  // Compute filtered contents
  const filteredContents = useMemo(() => {
    if (!filterType) return contents;
    return contents.filter((c) => c.contentType === filterType);
  }, [contents, filterType]);

  return (
    <div className="flex p-1">
      <Navbar onContentAdded={refresh} />

      <div className="mt-14">
        <Sidebar
          currentState={sideBarOpen}
          newSideBarState={() => setSideBarOpen(!sideBarOpen)}
          activeFilter={filterType}
          onFilterChange={setFilterType}
        />
      </div>

      <div
        className={`flex flex-wrap items-start gap-4 my-16 mr-8 ${
          sideBarOpen ? "ml-60" : "ml-16"
        }`}
      >
        {/* Show a small banner when a filter is active */}
        {filterType && (
          <div className="w-full px-4">
            <p className="text-gray-700">
              Showing only <strong>{filterType}</strong> content.{" "}
              <button
                onClick={() => setFilterType(null)}
                className="underline text-blue-600"
              >
                Show all
              </button>
            </p>
          </div>
        )}

        {/* Hardcoded test cards (no id => share/delete hidden) */}
        {/* <Card
          key="test-twitter"
          type="twitter"
          articleText="fun video"
          link="https://x.com/DigitalTrends/status/1932218655703781756"
        />
        <Card
          key="test-youtube"
          type="youtube"
          articleText="vedant"
          link="https://youtu.be/EU9tTklPS4g?si=ixsOTw5SVDaLWE22"
        />
        <Card
          key="test-twitter-2"
          type="twitter"
          articleText="random"
          link="https://x.com/reTruthNews/status/1930718007929827359"
        /> */}

        {/* Dynamically loaded content */}
        {filteredContents.length === 0 ? (
          <p className="text-gray-500">
            {filterType
              ? `No ${filterType} content to display.`
              : "No content to display."}
          </p>
        ) : (
          filteredContents.map((c, i) => (
            <Card
              key={c._id ?? i}
              id={c._id}
              type={c.contentType}
              articleText={c.title}
              link={c.link}
              onDeleteSuccess={refresh}
            />
          ))
        )}
      </div>
    </div>
  );
}
