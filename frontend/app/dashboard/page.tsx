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
  Calendar,
  User,
  Globe,
} from "lucide-react";
import { MOCK_PROFILES } from "./mockData";
import ProfileCard from "@/components/ProfileCard";
import Header from "@/components/Header";
import ActionButtons from "@/components/ActionButtons";
import FilterBar from "@/components/FilterBar";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useRouter } from "next/navigation";

// 🔥 Toggle here (switch to false when backend ready)
const USE_MOCK = false;

export default function Dashboard() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [detailedInfo, setDetailedInfo] = useState<any>(null);
  const [extraPictures, setExtraPictures] = useState<string[]>([]);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const handleShowInfo = async (userId: number) => {
    setIsModalLoading(true);
    setShowModal(true);

    try {
      // Parallel fetch for profile details and gallery
      const [profileRes, picturesRes] = await Promise.all([
        fetchWithAuth(`http://localhost:3001/profile/${userId}`),
        fetchWithAuth(`http://localhost:3001/pictures/${userId}`),
      ]);

      const profileData = await profileRes.json();
      const picturesData = await picturesRes.json();

      setDetailedInfo(profileData);
      setExtraPictures(picturesData); // Assuming this is an array of strings/URLs
    } catch (err) {
      console.error("Failed to load details", err);
    } finally {
      setIsModalLoading(false);
    }
  };
  // ✅ Load data (mock OR backend)
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        if (USE_MOCK) {
          await new Promise((res) => setTimeout(res, 300));
          setProfiles(MOCK_PROFILES);
        } else {
          console.log("=======================");
          const res = await fetchWithAuth(
            "http://localhost:3001/profile/suggestions"
          );
          if (res.status === 403) {
            router.push("profile/setup"); // onboarding page
          }
          const data = await res.json();
          console.log(`data from fetch is ${data}`);
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
      <>
        <Header />
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
      </>
    );
  }

  const currentProfile = profiles[currentIndex];

  const handleAction = async (type: "like" | "pass") => {
    const targetId = currentProfile.userId; // Or currentProfile.userId, ensure this matches your data structure
    console.log(`${targetId} is the current profile`);
    // 1. Optimistic Update: Move to the next profile immediately
    setCurrentIndex((prev) => prev + 1);

    try {
      const response = await fetchWithAuth(
        "http://localhost:3001/swipe/swipe",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            targetId: targetId,
            action: type,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to record swipe");
      }

      const result = await response.json();
      console.log(`Successfully ${type}d user ${targetId}`, result);

      // Optional: If your backend returns a "match: true" property,
      // you could trigger a match notification here.
    } catch (err) {
      console.error("Error sending swipe:", err);
      // Optional: You could show a toast notification here if it fails
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 🔥 HEADER */}
      <Header />

      {/* 🔍 FILTER BAR */}

      {/* 🔥 MAIN CARD */}
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <FilterBar onOpenFilters={() => console.log("open filter modal")} />
        <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl">
          <ProfileCard profile={currentProfile} />

          {/* ACTION BUTTONS */}
          <ActionButtons
            onLike={() => handleAction("like")}
            onPass={() => handleAction("pass")}
            onInfo={() => handleShowInfo(currentProfile.userId)}
          />
        </div>
      </main>

      {/* --- DETAILED PROFILE MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-2xl h-[92vh] sm:h-[85vh] overflow-y-auto rounded-t-[3rem] sm:rounded-[3rem] relative shadow-2xl">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 z-20 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-white sm:text-gray-900 sm:bg-gray-100"
            >
              <X size={24} />
            </button>

            {isModalLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-rose-500"></div>
              </div>
            ) : (
              <div className="pb-12">
                {/* Horizontal Photo Gallery */}
                <div className="flex overflow-x-auto snap-x snap-mandatory h-[450px] bg-gray-100 no-scrollbar">
                  {extraPictures.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      className="w-full h-full object-cover flex-shrink-0 snap-center"
                      alt="User gallery"
                    />
                  ))}
                </div>

                <div className="p-8">
                  {/* Name & Age Matching your ProfileCard style */}
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-4xl font-black text-gray-900">
                      {detailedInfo?.first_name}, {detailedInfo?.age}
                    </h2>
                    {detailedInfo?.is_online && (
                      <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex gap-3 mb-8">
                    <span className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2">
                      <Star
                        size={16}
                        className="text-orange-400 fill-orange-400"
                      />{" "}
                      {detailedInfo?.fame_rating}
                    </span>
                    <span className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2">
                      <MapPin size={16} className="text-rose-500" />{" "}
                      {detailedInfo?.distance}
                    </span>
                  </div>

                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
                    About
                  </h3>
                  <p className="text-gray-700 text-lg leading-relaxed mb-8">
                    {detailedInfo?.biography}
                  </p>

                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
                    Interests
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {detailedInfo?.tags?.map((tag: string) => (
                      <span
                        key={tag}
                        className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-sm font-bold border border-rose-100"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/*  FOOTER */}
      <footer className="bg-white border-t p-4 text-center">
        <p className="text-xs text-gray-300">
          Matcha © 2026 • Because love can be industrialized
        </p>
      </footer>
    </div>
  );
}
