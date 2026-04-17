"use client";

import React, { useState, useEffect } from "react";
import { Flame, Clock, Users } from "lucide-react";
import Header from "@/components/Header";
import ActionButtons from "@/components/ActionButtons";
import FilterBar from "@/components/FilterBar";
import FilterModal from "@/components/FilterModal";
import ProfileCard from "@/components/ProfileCard";
import ProfileModal from "@/components/ProfileModal"; // Using your component
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useRouter } from "next/navigation";
import Loading from "@/app/loading";

type Image = { url: string; is_profile: boolean; position: number };

type Profile = {
  first_name: string;
  age: number;
  biography: string;
  tags: string[];
  images: Image[];
  fame_rating: number;
  distance: string;
  is_online: boolean;
  userId: number;
  profileIndex: number;
  profileImage: string;
  create_at: string;
};

export default function Dashboard() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Filter States
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any | null>(null);

  // Visit History States
  const [visitHistory, setVisitHistory] = useState<Profile[]>([]);
  const [showVisitHistory, setShowVisitHistory] = useState(false);

  // Modal States
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);

  // 1. Fetch Suggestions
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        let endpoint = "/profile/suggestions";
        if (activeFilters) {
          const params = new URLSearchParams();
          Object.entries(activeFilters).forEach(([key, value]) => {
            if (value) params.append(key, value as string);
          });
          endpoint = `/profile/search?${params.toString()}`;
        }
        const res = await fetchWithAuth(endpoint);
        if (res.status === 403) router.push("profile/setup");
        const data = await res.json();
        setProfiles(data);
        setCurrentIndex(0);
      } catch (err) {
        console.error("Error loading profiles:", err);
      } finally {
        setIsFadingOut(true);
        setTimeout(() => setLoading(false), 1000);
      }
    };
    fetchProfiles();
  }, [activeFilters, router]);

  // --- PRELOADER: Preload the next profile's images ---
  useEffect(() => {
    if (profiles.length > 0 && currentIndex + 1 < profiles.length) {
      const nextProfile = profiles[currentIndex + 1];

      // Force the browser to download the next user's images into cache
      nextProfile.images.forEach((img) => {
        const image = new window.Image();
        image.src = img.url;
      });
    }
  }, [currentIndex, profiles]);

  // 2. Fetch Visit History
  const handleOpenVisitHistory = async () => {
    setShowVisitHistory(true);
    try {
      const res = await fetchWithAuth("/visit/visits");
      if (res.ok) {
        const data = await res.json();
        setVisitHistory(data);
      }
    } catch (err) {
      console.error("Error fetching visits:", err);
    }
  };

  const handleShowInfo = async (profile: Profile) => {
    console.log(profile);
    setSelectedProfile(profile);
    setIsModalOpen(true);
    setIsModalLoading(true);

    try {
      await fetchWithAuth(`/profile/visit/${profile.userId}`, {
        method: "POST",
      });
    } catch (err) {
      console.warn("Visit log failed", err);
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleAction = async (type: "like" | "pass") => {
    const targetId = profiles[currentIndex].userId;
    setCurrentIndex((prev) => prev + 1);
    try {
      await fetchWithAuth("/swipe/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, action: type }),
      });
    } catch (err) {
      console.error("Swipe failed", err);
    }
  };

  const currentProfile = profiles[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {loading && (
        <div
          className={`fixed inset-0 z-50 transition-opacity duration-1000 ease-in-out ${
            isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <Loading />
        </div>
      )}

      <Header />

      {/* Changed justify-center to justify-start so it pushes from the top */}
      <main className="grow flex flex-col items-center justify-start p-4">
        {/* --- TOP ACTION BAR (50/50 Split & High Animation) --- */}
        <div className="w-full max-w-md lg:max-w-lg flex items-center gap-3 mb-4">
          {/* flex-1 makes Filters take exactly 50% of the available width */}
          <div className="flex-1">
            <FilterBar onOpenFilters={() => setIsFilterModalOpen(true)} />
          </div>

          {/* flex-1 makes Visits take the other 50%. Classes matched perfectly to FilterBar */}
          <button
            onClick={handleOpenVisitHistory}
            className="group flex-1 flex items-center justify-center gap-2 bg-white w-full h-12 px-4 rounded-xl shadow-sm border border-gray-200 text-gray-700 font-bold transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 active:scale-95"
            aria-label="Visit History"
          >
            <Clock
              size={20}
              className="text-rose-500 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12"
            />
            <span>Visits</span>
          </button>
        </div>
        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          onApply={setActiveFilters}
          currentFilters={activeFilters}
        />
        {!currentProfile ? (
          <div className="flex flex-col items-center justify-center text-center p-6 mt-10">
            <div className="bg-gradient-to-r from-rose-500 to-orange-400 p-3 rounded-2xl mb-4 shadow-lg">
              <Flame size={40} color="white" fill="white" />
            </div>
            <h2 className="text-2xl font-bold">That's everyone!</h2>
            <button
              onClick={() => {
                setCurrentIndex(0);
                setActiveFilters(null);
              }}
              className="mt-6 text-rose-500 font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="w-full max-w-md lg:max-w-lg flex flex-col grow">
            <ProfileCard key={currentProfile.userId} profile={currentProfile} />

            <ActionButtons
              onLike={() => handleAction("like")}
              onPass={() => handleAction("pass")}
              onInfo={() => handleShowInfo(currentProfile)}
            />
          </div>
        )}
      </main>

      {/* --- VISIT HISTORY OVERLAY --- */}
      {showVisitHistory && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-xl font-black flex items-center gap-2 text-gray-700">
              <Users className="text-rose-500" /> Recent Visitors
            </h2>
            <button
              onClick={() => setShowVisitHistory(false)}
              className="p-2 bg-rose-500 rounded-full font-bold text-white"
            >
              Close
            </button>
          </div>
          <div className="grow overflow-y-auto p-4 flex flex-col gap-4">
            {visitHistory.length === 0 ? (
              <p className="text-center text-gray-400 mt-10">
                No visits yet. Keep glowing! ✨
              </p>
            ) : (
              visitHistory.map((visitor) => (
                <div
                  key={visitor.userId}
                  onClick={() => handleShowInfo(visitor)}
                  className="flex items-center gap-4 p-3 bg-white border rounded-2xl hover:border-rose-300 cursor-pointer transition-all"
                >
                  <div>{visitor.create_at}</div>
                  <img
                    src={visitor.profileImage || ""}
                    className="w-14 h-14 rounded-xl object-cover"
                  />
                  <div className="grow">
                    <p className="font-bold text-gray-900">
                      {visitor.first_name}, {visitor.age}
                    </p>
                    <p className="text-xs text-gray-400">
                      {visitor.distance} away
                    </p>
                  </div>
                  <div className="text-rose-500 font-bold text-xs uppercase tracking-widest">
                    View
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- REUSABLE PROFILE MODAL --- */}
      {selectedProfile && (
        <ProfileModal
          showModal={isModalOpen}
          setShowModal={setIsModalOpen}
          isModalLoading={isModalLoading}
          profile={selectedProfile}
        />
      )}

      <footer className="bg-white border-t p-4 text-center">
        <p className="text-xs text-gray-300">Matcha © 2026</p>
      </footer>
    </div>
  );
}
