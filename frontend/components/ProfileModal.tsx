"use client";

import { X, Star, MapPin, Flag, Loader2, AlertCircle, Send } from "lucide-react";
import { useState } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

type Image = {
  url: string;
  position: number;
};

type Profile = {
  userId: number;
  first_name: string;
  age: number;
  biography: string;
  tags: string[];
  images: Image[];
  fame_rating: number;
  distance: string;
  is_online: boolean;
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
  const [reportStep, setReportStep] = useState<"idle" | "form" | "submitting" | "success">("idle");
  const [reason, setReason] = useState("");
  const [reportError, setReportError] = useState("");

  if (!showModal) return null;

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
          reason: reason.trim(),       // Custom reason from textarea
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
            <div className="flex overflow-x-auto snap-x snap-mandatory h-450px bg-gray-100 no-scrollbar">
              {profile.images.map((img, i) => (
                <img
                  key={i}
                  src={img.url}
                  //   src={typeof img === "string" ? img : img.url}
                  className="w-full h-full object-cover shrink-0 snap-center"
                  alt="User gallery"
                />
              ))}
            </div>

            <div className="p-8">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-4xl font-black text-gray-900">
                  {profile.first_name}, {profile.age}
                </h2>
                {profile?.is_online && (
                  <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                )}
              </div>

              <div className="flex gap-3 mb-8">
                <span className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2">
                  <Star size={16} className="text-orange-400 fill-orange-400" />
                  {profile?.fame_rating}
                </span>
                <span className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2">
                  <MapPin size={16} className="text-rose-500" />
                  {profile?.distance}
                </span>
              </div>

              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
                About
              </h3>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
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
                  <h4 className="font-black uppercase tracking-tight">Report User</h4>
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
                  <X size={20} className="rotate-45" /> {/* Simple checkmark effect */}
                </div>
                <p className="font-bold">Reported successfully.</p>
                <p className="text-sm opacity-80">Our moderation team will review this vibe check.</p>
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
