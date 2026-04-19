"use client";

import { Filter } from "lucide-react";

type Props = {
  onOpenFilters?: () => void;
};

export default function FilterBar({ onOpenFilters }: Props) {
  return (
    <button
      onClick={onOpenFilters}
      className="group flex items-center justify-center gap-2 w-full h-10 px-4 bg-white rounded-xl shadow-sm border border-gray-200 text-gray-700 font-bold transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 active:scale-95"
    >
      <Filter
        size={20}
        className="text-rose-500 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
      />
      <span>Filters</span>
    </button>
  );
}
