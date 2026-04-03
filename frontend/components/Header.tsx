"use client";

import { Flame, MessageCircle, Settings } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50">

      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="bg-gradient-to-tr from-rose-500 to-orange-400 p-1.5 rounded-lg">
          <Flame size={24} color="white" fill="white" />
        </div>
        <span className="text-xl font-black text-gray-900 uppercase">
          Matcha
        </span>
      </div>

      {/* Right icons */}
      <div className="flex gap-6">
        <button className="text-gray-400 hover:text-rose-500 relative transition-colors">
          <MessageCircle size={24} />
          {/* Notification dot */}
          <span className="absolute -top-1 -right-1 bg-rose-500 w-2.5 h-2.5 rounded-full border-2 border-white"></span>
        </button>

        <button className="text-gray-400 hover:text-rose-500 transition-colors" onClick={()=>window.location.href = "/profile/setup"}>
          <Settings size={24} />
        </button>
      </div>

    </header>
  );
}
