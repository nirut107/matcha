"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  MessageCircle,
  Heart,
  Flame,
  X,
  Info,
  MapPin,
  Star,
  Filter,
  SlidersHorizontal,
} from "lucide-react";
import { MOCK_PROFILES } from "./mockData";
import ProfileCard from "@/components/ProfileCard";
import Header from "@/components/Header";
import ActionButtons from "@/components/ActionButtons";
import FilterBar from "@/components/FilterBar";

// 🔥 Toggle here (switch to false when backend ready)
const USE_MOCK = true;

export default function Dashboard() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // ✅ Load data (mock OR backend)
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        if (USE_MOCK) {
          await new Promise((res) => setTimeout(res, 300));
          setProfiles(MOCK_PROFILES);
        } else {
          const res = await fetch(
            "http://localhost:3001/profiles/suggestions"
          );
          const data = await res.json();
          setProfiles(data);
        }
      } catch (err) {
        console.error("Error loading profiles:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  // ✅ Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading profiles...</p>
      </div>
    );
  }

  // ✅ Empty state
  if (!profiles.length || currentIndex >= profiles.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
        <div className="bg-gray-100 p-6 rounded-full mb-4">
          <Flame size={48} className="text-gray-300" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">
          That's everyone for now!
        </h2>
        <p className="text-gray-500 mt-2">
          Try changing filters or come back later.
        </p>
        <button
          onClick={() => setCurrentIndex(0)}
          className="mt-6 text-rose-500 font-bold hover:underline"
        >
          Reset
        </button>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  const handleAction = (type: "like" | "pass") => {
    console.log(`${type}:`, currentProfile.username);
    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 🔥 HEADER */}
      <Header />

      {/* 🔍 FILTER BAR */}
      <FilterBar onOpenFilters={() => console.log("open filter modal")} />

      {/* 🔥 MAIN CARD */}
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl">

          <ProfileCard profile={currentProfile} />

          {/* ACTION BUTTONS */}
          <ActionButtons
            onLike={() => handleAction("like")}
            onPass={() => handleAction("pass")}
            onInfo={() => console.log("show profile detail")}
          />
        </div>
      </main>

      {/* 🔻 FOOTER */}
      <footer className="bg-white border-t p-4 text-center">
        <p className="text-xs text-gray-300">
          Matcha © 2026 • Because love can be industrialized
        </p>
      </footer>
    </div>
  );
}
