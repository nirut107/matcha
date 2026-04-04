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

  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [profileDetails, setProfileDetails] = useState<any>(null);
  const [profilePictures, setProfilePictures] = useState<any[]>([]);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const handleShowInfo = async (userId: number) => {
    setIsModalLoading(true);
    setSelectedProfile(true); // Open the modal UI immediately (shows loader)

    try {
      // Fetch profile and pictures in parallel
      const [profileRes, picturesRes] = await Promise.all([
        fetchWithAuth(`http://localhost:3001/profile/${userId}`),
        fetchWithAuth(`http://localhost:3001/pictures/${userId}`),
      ]);

      const profileData = await profileRes.json();
      const picturesData = await picturesRes.json();

      setProfileDetails(profileData);
      setProfilePictures(picturesData);
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

      {/* --- DETAIL MODAL --- */}
      {selectedProfile && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-2xl h-[90vh] sm:h-[80vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl relative animate-in slide-in-from-bottom duration-300">
            {/* Close Button */}
            <button
              onClick={() => setSelectedProfile(null)}
              className="absolute top-4 right-4 z-10 bg-black/20 hover:bg-black/40 p-2 rounded-full text-white transition-colors"
            >
              <X size={24} />
            </button>

            {isModalLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
              </div>
            ) : (
              <div className="pb-10">
                {/* Photo Gallery (Mobile Friendly Horizontal Scroll) */}
                <div className="flex overflow-x-auto snap-x snap-mandatory h-[400px] bg-gray-200">
                  {profilePictures.length > 0 ? (
                    profilePictures.map((pic, idx) => (
                      <img
                        key={idx}
                        src={pic.url || pic} // Adjust based on your API structure
                        className="w-full h-full object-cover flex-shrink-0 snap-center"
                        alt="Profile"
                      />
                    ))
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <User size={64} />
                    </div>
                  )}
                </div>

                {/* Profile Details */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">
                        {profileDetails?.firstName},{" "}
                        {profileDetails?.age || "24"}
                      </h2>
                      <div className="flex items-center text-gray-500 mt-1">
                        <MapPin size={16} className="mr-1" />
                        <span>
                          {profileDetails?.distance || "2 miles"} away
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                      <Flame size={18} className="text-rose-500 mr-1" />
                      <span className="text-rose-600 font-bold">
                        {profileDetails?.fameRating || "99"}
                      </span>
                    </div>
                  </div>

                  <hr className="my-6 border-gray-100" />

                  <h3 className="font-bold text-gray-800 mb-2 uppercase text-sm tracking-widest">
                    About Me
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {profileDetails?.bio || "No bio provided."}
                  </p>

                  <h3 className="font-bold text-gray-800 mb-3 uppercase text-sm tracking-widest">
                    Interests
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {profileDetails?.interests?.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-4 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700 font-medium border border-gray-200"
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
