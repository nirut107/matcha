import React from 'react';
import { Flame } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 p-4">
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 bg-white/20 rounded-full animate-ping scale-150 opacity-20"></div>
        <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse scale-125"></div>

        <div className="relative bg-white p-6 rounded-3xl shadow-2xl animate-bounce">
          <Flame size={48} className="text-rose-500" fill="currentColor" />
        </div>
      </div>

      <div className="mt-8 text-center">
        <h2 className="text-white text-2xl font-bold tracking-tight animate-pulse">
          Setting the spark...
        </h2>
        <p className="text-white/80 mt-2 text-sm font-medium uppercase tracking-widest">
          Loading
        </p>
      </div>

      {/* Progress Bar with Tailwind-only animation */}
      <div className="mt-8 w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
        <div className="h-full bg-white rounded-full w-full -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
      </div>
    </div>
  );
}
