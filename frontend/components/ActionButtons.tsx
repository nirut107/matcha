"use client";

import { Heart, X, Info } from "lucide-react";

type Props = {
  onLike: () => void;
  onPass: () => void;
  onInfo?: () => void;
};

export default function ActionButtons({ onLike, onPass, onInfo }: Props) {
  return (
    <div className="flex justify-center items-center gap-6 mt-8">

      {/* PASS */}
      <button
        onClick={onPass}
        className="bg-white p-5 rounded-full shadow-xl text-gray-300 hover:text-red-500 hover:shadow-2xl transition-all active:scale-90 border border-gray-100"
      >
        <X size={32} strokeWidth={3} />
      </button>

      {/* LIKE */}
      <button
        onClick={onLike}
        className="bg-gradient-to-r from-rose-500 to-orange-400 p-6 rounded-full shadow-2xl text-white hover:scale-110 active:scale-95 transition-all shadow-rose-200"
      >
        <Heart size={36} fill="white" strokeWidth={0} />
      </button>

      {/* INFO */}
      <button
        onClick={onInfo}
        className="bg-white p-5 rounded-full shadow-xl text-gray-300 hover:text-blue-500 transition-all border border-gray-100"
      >
        <Info size={28} />
      </button>

    </div>
  );
}
