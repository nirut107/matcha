"use client";

import {
  X,
  Star,
  MapPin,
  Flag,
  Loader2,
  AlertCircle,
  Send,
} from "lucide-react";
import { useState } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { formatDistanceToNow } from "date-fns";

type Image = {
  url: string;
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
  userId: number;
  profileIndex: number;
  profileImage: string;
  create_at: string;
  last_connection: string;
};

type Props = {
  showModal: boolean;
  setShowModal: (v: boolean) => void;
  isModalLoading: boolean;
  profile: Profile;
};

export default function ProfileModal({
  showModal,
  setShowModal,
  isModalLoading,
  profile,
}: Props) {
  // New States
  const [reportStep, setReportStep] = useState<
    "idle" | "form" | "submitting" | "success"
  >("idle");
  const [reason, setReason] = useState("");
  const [reportError, setReportError] = useState("");
  console.log(profile);

  if (!showModal) return null;

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return "";
    const dbDate = new Date(dateString);

    const localDate = new Date(dbDate.getTime() + 7 * 60 * 60 * 1000);

    return formatDistanceToNow(localDate, { addSuffix: true });
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
          reported_id: profile.userId, // From your MapUser/Profile data
          reason: reason.trim(), // Custom reason from textarea
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
        setShowModal(false);
      }, 2000);
    } catch (err: any) {
      setReportError(err.message);
      setReportStep("form"); // Go back to form to let user try again
    }
  };
  return (
    <div className="fixed inset-0 z-70 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center">
      {/* Adjusted height for mobile browser bars: h-[90svh] uses the visual viewport */}
      <div className="bg-white w-full max-w-2xl h-[90svh] sm:h-[85vh] overflow-y-auto rounded-t-[2rem] sm:rounded-[3rem] relative shadow-2xl">
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-4 right-4 z-20 bg-black/20 hover:bg-black/40 backdrop-blur-md p-2 rounded-full text-white sm:text-gray-900 sm:bg-gray-100 transition-colors"
        >
          <X size={20} />
        </button>

        {isModalLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-rose-500"></div>
          </div>
        ) : (
          <div className="pb-8 sm:pb-12">
            {/* FIX 1: Use relative height (45vh) on mobile, fixed (450px) on larger screens */}
            <div className="flex overflow-x-auto snap-x snap-mandatory h-[45vh] sm:h-[450px] bg-gray-100 no-scrollbar">
              {profile.images && profile.images.length > 0 ? (
                profile.images.map((img, i) => (
                  <img
                    key={i}
                    src={img.url}
                    className="w-full h-full object-cover shrink-0 snap-center"
                    alt="User gallery"
                  />
                ))
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                  No Photos
                </div>
              )}
            </div>

            {/* FIX 2: Reduce padding on mobile (p-5 instead of p-8) */}
            <div className="p-5 sm:p-8">
              <div className="flex items-center gap-3 mb-2">
                {/* FIX 3: Smaller text on mobile (text-3xl) */}
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900">
                  {profile.first_name}, {profile.age}
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
