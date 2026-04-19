"use client";

import { useState, useEffect, useRef } from "react";
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
import { formatDistanceToNow } from "date-fns";
import { Eye, X } from "lucide-react";
import { UserProfile } from "@/components/ProfileModal";

type Image = { url: string; is_profile: boolean; position: number };

type Profile = {
  first_name: string;
  age: number;
  biography: string;
  gender: string;
  tags: string[];
  images: Image[];
  fame_rating: number;
  distance: string;
  is_online: boolean;
  userId: number;
  profileIndex: number;
  profileImage: string;
  create_at: string;
  last_connection: string;
};

const formatTimeAgo = (dateString: string) => {
  if (!dateString) return "";
  const dbDate = new Date(dateString);

  const localDate = new Date(dbDate.getTime() + 7 * 60 * 60 * 1000);

  return formatDistanceToNow(localDate, { addSuffix: true });
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
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);
  // --- SWIPE LOGIC STATES ---
  const [dragX, setDragX] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const isDragging = useRef(false);
  const SWIPE_THRESHOLD = 100; // How far they have to drag to trigger a swipe

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const currentX = e.targetTouches[0].clientX;
    const diff = currentX - touchStartX;

    setDragX(diff);

    if (Math.abs(diff) > 10) {
      isDragging.current = true;
    }
  };

  const handleTouchEnd = () => {
    if (dragX > SWIPE_THRESHOLD) {
      handleAction("like");
    } else if (dragX < -SWIPE_THRESHOLD) {
      handleAction("pass");
    }
    setDragX(0);
    setTouchStartX(null);
  };
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
    const res = await fetchWithAuth(`/profile/data/${profile.userId}`);
    const data: UserProfile = await res.json();

    setSelectedProfile(data);
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
    <div className="h-screen bg-gray-50 flex flex-col h-screen">
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
        <div className="w-full max-w-md lg:max-w-lg flex items-center gap-2 sm:gap-3 mb-4">
          <div className="flex-1">
            <FilterBar onOpenFilters={() => setIsFilterModalOpen(true)} />
          </div>
          <button
            onClick={handleOpenVisitHistory}
            className="group flex-none sm:flex-1 w-12 sm:w-full  sm:h-10 h-10 flex items-center justify-center gap-2 bg-white px-0 sm:px-4 rounded-xl shadow-sm border border-gray-200 text-gray-700 font-bold transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 active:scale-95 shrink-0"
            aria-label="Visit History"
          >
            <Clock
              size={20}
              className="text-rose-500 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12"
            />
            <span className="hidden sm:inline">Visits</span>
          </button>
        </div>
        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          onApply={setActiveFilters}
          currentFilters={activeFilters}
        />
        {!currentProfile ? (
          <div className="flex-1 flex-col items-center justify-center text-center p-6 mt-10">
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
          <div className="w-full max-w-md lg:max-w-lg flex flex-col grow justify-center relative overflow-hidden pb-4">
            {" "}
            {/* 🔥 Swipeable & Clickable Container 🔥 */}
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={() => {
                // Only open the profile if the user tapped (didn't drag)
                if (!isDragging.current) {
                  handleShowInfo(currentProfile);
                }
              }}
              className={`relative w-full z-10 cursor-pointer ${
                touchStartX !== null
                  ? "transition-none"
                  : "transition-transform duration-300 ease-out"
              }`}
              style={{
                transform: `translateX(${dragX}px) rotate(${dragX * 0.04}deg)`,
              }}
            >
              {/* Tinder-style stamps */}
              {dragX > 20 && (
                <div
                  className="absolute top-10 left-6 z-50 border-[6px] border-green-500 text-green-500 font-black text-4xl px-4 py-2 rounded-xl transform -rotate-12 tracking-widest pointer-events-none"
                  style={{ opacity: Math.min(dragX / SWIPE_THRESHOLD, 1) }}
                >
                  LIKE
                </div>
              )}
              {dragX < -20 && (
                <div
                  className="absolute top-10 right-6 z-50 border-[6px] border-red-500 text-red-500 font-black text-4xl px-4 py-2 rounded-xl transform rotate-12 tracking-widest pointer-events-none"
                  style={{
                    opacity: Math.min(Math.abs(dragX) / SWIPE_THRESHOLD, 1),
                  }}
                >
                  PASS
                </div>
              )}

              <ProfileCard
                key={currentProfile.userId}
                profile={currentProfile}
              />
            </div>
            {/* 🔥 Hidden on mobile, visible on desktop (sm:block) 🔥 */}
            <div className="hidden sm:block mt-4 z-20">
              <ActionButtons
                onLike={() => handleAction("like")}
                onPass={() => handleAction("pass")}
                onInfo={() => handleShowInfo(currentProfile)}
              />
            </div>
          </div>
        )}
      </main>

      {/* --- VISIT HISTORY OVERLAY --- */}
      {showVisitHistory && (
        <div className="fixed inset-0 z-[60] bg-gray-50/95 backdrop-blur-md flex flex-col animate-in slide-in-from-bottom-8 duration-300">
          {/* Header */}
          <div className="bg-white px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10 rounded-b-3xl">
            <h2 className="text-xl font-black flex items-center gap-2 text-gray-800 tracking-tight">
              <div className="bg-rose-100 p-2 rounded-xl">
                <Users size={20} className="text-rose-500" />
              </div>
              Recent Visitors
            </h2>
            <button
              onClick={() => setShowVisitHistory(false)}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable List */}
          <div className="grow overflow-y-auto p-4 sm:p-6 flex flex-col gap-3">
            {visitHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-50">
                <div className="text-6xl mb-4">👀</div>
                <p className="text-lg font-bold text-gray-500">
                  No secret admirers yet
                </p>
                <p className="text-sm text-gray-400">
                  Keep swiping to get noticed!
                </p>
              </div>
            ) : (
              visitHistory.map((visitor) => (
                <div
                  key={visitor.userId}
                  onClick={() => handleShowInfo(visitor)}
                  className="group relative flex items-center gap-4 p-4 bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-rose-200 hover:shadow-md cursor-pointer transition-all active:scale-[0.98]"
                >
                  {/* Avatar with Online Indicator */}
                  <div className="relative">
                    <img
                      src={visitor.profileImage || "/default-avatar.png"}
                      className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                      alt={visitor.first_name}
                    />
                    {visitor.is_online && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-black text-gray-900 text-lg leading-none">
                        {visitor.first_name}, {visitor.age}
                      </p>
                      {/* Formatted Time */}
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {formatTimeAgo(visitor.create_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                        📍 {visitor.distance}
                      </span>
                      <span className="text-xs font-bold text-yellow-500 bg-yellow-50 px-2 py-1 rounded-md">
                        ⭐ {visitor.fame_rating}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center group-hover:bg-rose-500 transition-colors">
                    <Eye
                      size={18}
                      className="text-rose-500 group-hover:text-white transition-colors"
                    />
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

      <footer className="hidden sm:block bg-white border-t p-2 text-center shrink-0">
        <p className="text-xs text-gray-300">Matcha © 2026</p>
      </footer>
    </div>
  );
}
