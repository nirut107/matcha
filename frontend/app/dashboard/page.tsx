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
import ProfileCard from "@/components/ProfileCard";
import Header from "@/components/Header";
import ActionButtons from "@/components/ActionButtons";
import FilterBar from "@/components/FilterBar";
import FilterModal from "@/components/FilterModal";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useRouter } from "next/navigation";
import Loading from "@/app/loading";

// 🔥 Toggle here (switch to false when backend ready)
const USE_MOCK = false;

type Image = {
  url: string;
  is_profile: boolean;
  position: number;
};

type Profile = {
  first_name: string;
  age: number;
  biography: string;
  tags: string[];
  images: Image[];
  fame_rating: number;
  distance: string;
  is_online: boolean;
  profileIndex: number;
  profileImage: string;
  userId: number;
};

export default function Dashboard() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const handleShowInfo = async (visitedId: number) => {
    setShowModal(true);
    setIsModalLoading(true);

    try {
      const response = await fetchWithAuth(`/profile/visit/${visitedId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn("Failed to record profile visit");
      }
    } catch (err) {
      console.error("Error sending visit record:", err);
    } finally {
      setIsModalLoading(false);
    }
  };
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        let endpoint = "/profile/suggestions"; // Default
        if (activeFilters) {
          const params = new URLSearchParams();
          Object.entries(activeFilters).forEach(([key, value]) => {
            if (value) params.append(key, value as string);
          });
          endpoint = `/profile/search?${params.toString()}`;
        }
        const res = await fetchWithAuth(endpoint);
        if (res.status === 403) {
          router.push("profile/setup"); // onboarding page
        }
        const data = await res.json();
        console.log(`data from fetch is ${data}`);
        setProfiles(data);
        setCurrentIndex(0);
        console.log(profiles);
      } catch (err) {
        console.error("Error loading profiles:", err);
      } finally {
        setIsFadingOut(true);

        setTimeout(() => {
          setLoading(false);
        }, 1000);
      }
    };
    const run = async () => {
      await new Promise((r) => setTimeout(r, 1000));
      setIsFadingOut(true);
      await new Promise((r) => setTimeout(r, 1000));
      setLoading(false);
    };

    fetchProfiles();
    run();
  }, [activeFilters, router]);

  if (!profiles.length || currentIndex >= profiles.length) {
    return (
      <div className="relative min-h-screen">
        {loading && (
          <div
            className={`
          fixed inset-0 z-50 
            transition-opacity duration-2000 ease-in-out
            ${isFadingOut ? "opacity-0" : "opacity-100"}
          `}
          >
            <Loading />
          </div>
        )}
        <div className="min-h-screen flex flex-col">
          <Header />
          {/* <FilterBar onOpenFilters={() => setIsFilterModalOpen(true)} /> */}
          {/* <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          onApply={setActiveFilters}
          currentFilters={activeFilters}
        /> */}
          <div className="flex flex-col items-center justify-center grow text-center p-6">
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
              onClick={() => {
                setCurrentIndex(0);
                setActiveFilters(null);
              }}
              className="mt-6 text-rose-500 font-bold hover:underline"
            >
              Clear Filters & Reset
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];
  console.log(currentProfile);

  const handleAction = async (type: "like" | "pass") => {
    const targetId = currentProfile.userId; // Or currentProfile.userId, ensure this matches your data structure
    console.log(`${targetId} is the current profile`);
    // 1. Optimistic Update: Move to the next profile immediately
    setCurrentIndex((prev) => prev + 1);

    try {
      const response = await fetchWithAuth("/swipe/swipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetId: targetId,
          action: type,
        }),
      });

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
      {loading && (
        <div
          className={`
                    fixed inset-0 z-50 
                      transition-opacity duration-1000 ease-in-out
                      ${isFadingOut ? "opacity-0" : "opacity-100"}
                    `}
        >
          <Loading />
        </div>
      )}
      <Header />
      <main className="grow flex flex-col items-center justify-center p-4">
        <FilterBar onOpenFilters={() => setIsFilterModalOpen(true)} />
        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          onApply={setActiveFilters}
          currentFilters={activeFilters}
        />
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
        <div className="fixed inset-0 z-70 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center">
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
                <div className="flex overflow-x-auto snap-x snap-mandatory h-450px bg-gray-100 no-scrollbar">
                  {currentProfile.images.map((img, i) => (
                    <img
                      key={i}
                      src={img.url}
                      className="w-full h-full object-cover shrink-0 snap-center"
                      alt="User gallery"
                    />
                  ))}
                </div>

                <div className="p-8">
                  {/* Name & Age Matching your ProfileCard style */}
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-4xl font-black text-gray-900">
                      {currentProfile.first_name}, {currentProfile.age}
                    </h2>
                    {currentProfile?.is_online && (
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
                      {currentProfile?.fame_rating}
                    </span>
                    <span className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2">
                      <MapPin size={16} className="text-rose-500" />{" "}
                      {currentProfile?.distance}
                    </span>
                  </div>

                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
                    About
                  </h3>
                  <p className="text-gray-700 text-lg leading-relaxed mb-8">
                    {currentProfile?.biography}
                  </p>

                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
                    Interests
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {currentProfile?.tags?.map((tag: string) => (
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
