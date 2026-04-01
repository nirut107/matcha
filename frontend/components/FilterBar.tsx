"use client";

import { Filter } from "lucide-react";

type Props = {
  onOpenFilters?: () => void;
};

export default function FilterBar({ onOpenFilters }: Props) {
  return (
    <div className="flex justify-center gap-3 px-4 pb-4">

      <button
        onClick={onOpenFilters}
        className="flex items-center gap-2 px-4 py-2.5 bg-white/80 backdrop-blur-md rounded-xl shadow-md border border-gray-100 text-gray-700 font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
      >
        <Filter size={16} className="text-rose-500" />
        Filters
      </button>

    </div>
  );
}
