"use client";

import {
  X,
  Star,
  MapPin,
  Flag,
  Loader2,
  AlertCircle,
  Send,
  Heart, // 🔥 Added
  Sparkles,
  Mars, // 🔥 Added
  Venus, // 🔥 Added
  Infinity,
} from "lucide-react";
import { useState } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { formatDistanceToNow } from "date-fns";
import { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface ProfileImage {
  url: string;
  position: number;
  is_profile: boolean;
}

export interface UserProfile {
  userId: number;
  first_name: string;
  age: number;
  biography: string;
  fame_rating: number;
  gender: string;
  images: ProfileImage[];
  tags: string[];
  profileIndex: number;
  profileImage: string | null;

  latitude: number;
  longitude: number;
  distance: string;
  is_online: boolean;
  last_connection: string;
  i_blocked_them: boolean;
  they_blocked_me: boolean;
  i_liked_them: boolean;
  they_liked_me: boolean;
  is_match: boolean;
}

type Props = {
  showModal: boolean;
  setShowModal: (v: boolean) => void;
  isModalLoading: boolean;
  profile: UserProfile;
};

export default function ProfileModal({
  showModal,
  setShowModal,
  isModalLoading,
  profile,
}: Props) {
  console.log("ProfileModal rendered with profile:", profile);
  const [reportStep, setReportStep] = useState<
    "idle" | "form" | "submitting" | "success"
  >("idle");
  const [reason, setReason] = useState("");
  const [reportError, setReportError] = useState("");
  const [current, setCurrent] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;
  console.log("Current image index:", current);
  const next = () => {
    setCurrent((prev) => (prev === profile.images.length - 1 ? 0 : prev + 1));
  };

  const prev = () => {
    setCurrent((prev) => (prev === 0 ? profile.images.length - 1 : prev - 1));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null); // Reset touch end
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && current < (profile.images?.length || 0) - 1) {
      next();
    }

    if (isRightSwipe && current > 0) {
      prev();
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCurrent(0);
        setShowModal(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [setShowModal]);

  if (!showModal) return null;

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return "";
    const dbDate = new Date(dateString);

    const localDate = new Date(dbDate.getTime() + 7 * 60 * 60 * 1000);

    return formatDistanceToNow(localDate, { addSuffix: true });
  };
  const renderGenderIcon = (gender: string) => {
    const g = gender?.toLowerCase();
    if (g === "male") {
      return <Mars size={28} className="text-blue-400 drop-shadow-md" />;
    }
    if (g === "female") {
      return <Venus size={28} className="text-pink-400 drop-shadow-md" />;
    }
    return <Infinity size={28} className="text-purple-400 drop-shadow-md" />;
  };

  const handleReport = async () => {
    if (!reason.trim()) {
      setReportError("Please provide a reason for the report.");
      return;
    }

    setReportStep("submitting");
    setReportError("");

    try {
      const res = await fetchWithAuth("/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reported_id: profile.userId,
          reason: reason.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to report user");
      }

      setReportStep("success");
      setTimeout(() => {
        setReportStep("idle");
        setReason("");
        setCurrent(0);
        setShowModal(false);
      }, 2000);
    } catch (err: any) {
      setReportError(err.message);
      setReportStep("form");
    }
  };
  return (
    <div
      className="fixed inset-0 z-70 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center"
      onClick={() => {
        setCurrent(0);
        setShowModal(false);
      }}
    >
      {/* Adjusted height for mobile browser bars: h-[90svh] uses the visual viewport */}
      <div
        className="bg-white w-full no-scrollbar max-w-2xl h-[90svh] sm:h-[85svh] overflow-y-auto rounded-t-[2rem] sm:rounded-[3rem] relative shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            setCurrent(0);
            setShowModal(false);
          }}
          className="absolute top-4 right-4 z-20 bg-black/20 hover:bg-black/40 hover:text-white backdrop-blur-md p-2 rounded-full text-white sm:text-gray-900 sm:bg-gray-100 transition-colors"
        >
          <X size={20} />
        </button>

        {isModalLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-rose-500"></div>
          </div>
        ) : (
          <div className="pb-8 sm:pb-12">
            <div
              className="relative h-[45vh] sm:h-[450px] bg-gray-100 overflow-hidden group"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {profile.images && profile.images.length > 0 ? (
                <>
                  {/* Images */}
                  <div
                    className="flex h-full transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)"
                    style={{
                      transform: `translateX(-${current * 100}%)`,
                    }}
                  >
                    {profile.images.map((img, i) => (
                      <div
                        key={i}
                        className="w-full h-full shrink-0 flex-none relative"
                      >
                        <img
                          key={i}
                          src={img.url}
                          className="w-full h-full object-cover"
                          alt={`Gallery image ${i + 1}`}
                        />
                      </div>
                    ))}
                  </div>

                  {/* LEFT ARROW (Only show if not on the first image) */}
                  {current > 0 && (
                    <button
                      type="button"
                      onClick={prev}
                      className="absolute top-1/2 left-2 sm:left-4 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/20 hover:bg-black/40 backdrop-blur-md text-white rounded-full transition-all duration-200 active:scale-90 opacity-0 group-hover:opacity-100 shadow-lg z-10"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 pr-0.5" />
                    </button>
                  )}

                  {/* RIGHT ARROW (Only show if not on the last image) */}
                  {current < profile.images.length - 1 && (
                    <button
                      type="button"
                      onClick={next}
                      className="absolute top-1/2 right-2 sm:right-4 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/20 hover:bg-black/40 backdrop-blur-md text-white rounded-full transition-all duration-200 active:scale-90 opacity-0 group-hover:opacity-100 shadow-lg z-10"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 pr-0.5" />
                    </button>
                  )}

                  {/* DOTS */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/20 backdrop-blur-sm px-3 py-2 rounded-full">
                    {profile.images.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === current
                            ? "w-4 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                            : "w-1.5 bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                  <span className="text-4xl mb-2">📸</span>
                  <span className="font-medium text-sm">No Photos</span>
                </div>
              )}
            </div>

            {/* FIX 2: Reduce padding on mobile (p-5 instead of p-8) */}
            <div className="p-5 sm:p-8">
              <div className="flex items-center gap-3 mb-2">
                {/* 🔥 Added flex, items-center, and gap-2 to align the icon beautifully */}
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 flex items-center gap-2">
                  {profile.first_name}, {profile.age}
                  {renderGenderIcon(profile.gender)}
                </h2>

                {profile?.is_online ? (
                  <span className="bg-green-50 text-green-600 border border-green-100 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Online
                  </span>
                ) : (
                  <span className="bg-gray-50 text-gray-400 border border-gray-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center shadow-sm">
                    Active {formatTimeAgo(profile?.last_connection)}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
                <span className="bg-gray-100 text-gray-600 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2">
                  <Star size={14} className="text-orange-400 fill-orange-400" />
                  {profile?.fame_rating}
                </span>
                <span className="bg-gray-100 text-gray-600 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2">
                  <MapPin size={14} className="text-rose-500" />
                  {profile?.distance}
                </span>
              </div>

              {/* 🔥 RELATIONSHIP STATUS BANNER 🔥 */}
              {
                profile?.is_match ? (
                  <div className="mb-8 bg-gradient-to-r from-pink-500 to-rose-500 p-4 rounded-2xl text-white flex items-center justify-center gap-2 shadow-lg shadow-rose-200 animate-in zoom-in duration-300">
                    <Heart className="fill-white" size={20} />
                    <span className="font-black tracking-widest uppercase text-sm">
                      It's a Match!
                    </span>
                  </div>
                ) : profile?.they_liked_me ? (
                  <div className="mb-8 bg-rose-50 border border-rose-200 p-4 rounded-2xl text-rose-600 flex items-center justify-center gap-2 animate-in zoom-in duration-300 shadow-sm">
                    <Sparkles size={20} className="text-rose-500" />
                    <span className="font-bold text-sm">
                      They like you! Swipe right to match. ✨
                    </span>
                  </div>
                ) : null /* If "nothing at all", we show no banner to keep the UI clean */
              }

              <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 mb-2 sm:mb-3">
                About
              </h3>
              <p className="text-gray-700 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8">
                {profile?.biography}
              </p>

              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
                Interests
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile?.tags?.map((tag: string) => (
                  <span
                    key={tag}
                    className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-sm font-bold border border-rose-100"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="mt-12 pt-8 border-t border-gray-100">
                {reportStep === "idle" && (
                  <button
                    onClick={() => setReportStep("form")}
                    className="flex items-center gap-2 text-gray-400 hover:text-rose-500 font-bold text-sm transition-colors group"
                  >
                    <Flag size={16} className="group-hover:fill-rose-500" />
                    Report {profile?.first_name}
                  </button>
                )}

                {reportStep === "form" && (
                  <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 animate-in fade-in zoom-in duration-200">
                    <div className="flex items-center gap-2 mb-4 text-rose-600">
                      <AlertCircle size={20} />
                      <h4 className="font-black uppercase tracking-tight">
                        Report User
                      </h4>
                    </div>

                    <textarea
                      autoFocus
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Tell us why you're reporting this profile..."
                      className="w-full p-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-rose-400 outline-none text-gray-900 resize-none text-sm mb-4 min-h-[100px]"
                    />

                    {reportError && (
                      <p className="text-red-500 text-xs font-bold mb-4 ml-1">
                        {reportError}
                      </p>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={handleReport}
                        className="flex-1 bg-rose-500 text-white py-3 rounded-xl font-bold hover:bg-rose-600 transition-all flex items-center justify-center gap-2"
                      >
                        <Send size={16} /> Submit Report
                      </button>
                      <button
                        onClick={() => {
                          setReportStep("idle");
                          setReportError("");
                        }}
                        className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {reportStep === "submitting" && (
                  <div className="flex items-center gap-3 text-rose-500 font-bold p-4">
                    <Loader2 className="animate-spin" size={20} />
                    Processing your report...
                  </div>
                )}

                {reportStep === "success" && (
                  <div className="bg-green-50 text-green-700 p-6 rounded-[2rem] border border-green-100 flex flex-col items-center gap-2 text-center animate-in fade-in">
                    <div className="bg-green-500 p-2 rounded-full text-white">
                      <X size={20} className="rotate-45" />{" "}
                      {/* Simple checkmark effect */}
                    </div>
                    <p className="font-bold">Reported successfully.</p>
                    <p className="text-sm opacity-80">
                      Our moderation team will review this vibe check.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
