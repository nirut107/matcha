"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { X } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function FilterModal({ isOpen, onClose }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Local state to hold form values before applying
  const [filters, setFilters] = useState({
    minAge: searchParams.get("minAge") || "",
    maxAge: searchParams.get("maxAge") || "",
    minFame: searchParams.get("minFame") || "",
    maxFame: searchParams.get("maxFame") || "",
    maxDistance: searchParams.get("maxDistance") || "",
    tags: searchParams.get("tags") || "", // Storing as comma-separated string for the input
    sortBy: searchParams.get("sortBy") || "distance",
    sortDir: searchParams.get("sortDir") || "asc",
  });

  // Sync state if URL changes outside the modal
  useEffect(() => {
    if (isOpen) {
      setFilters({
        minAge: searchParams.get("minAge") || "",
        maxAge: searchParams.get("maxAge") || "",
        minFame: searchParams.get("minFame") || "",
        maxFame: searchParams.get("maxFame") || "",
        maxDistance: searchParams.get("maxDistance") || "",
        tags: searchParams.get("tags") || "",
        sortBy: searchParams.get("sortBy") || "distance",
        sortDir: searchParams.get("sortDir") || "asc",
      });
    }
  }, [isOpen, searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString());

    // Loop through filters and apply them to URL params
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key); // Remove empty parameters to keep URL clean
      }
    });

    // Push new URL
    router.push(`${pathname}?${params.toString()}`);
    onClose();
  };

  const handleClear = () => {
    router.push(pathname); // Clears all query params
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Filters</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-rose-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Form Area */}
        <div className="p-6 overflow-y-auto flex-grow space-y-6">

          {/* Age Range */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Age Range</label>
            <div className="flex items-center gap-2">
              <input type="number" name="minAge" value={filters.minAge} onChange={handleChange} placeholder="Min" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-400/20 text-gray-700" />
              <span className="text-gray-400">-</span>
              <input type="number" name="maxAge" value={filters.maxAge} onChange={handleChange} placeholder="Max" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-400/20 text-gray-700" />
            </div>
          </div>

          {/* Fame Range */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Fame Rating</label>
            <div className="flex items-center gap-2">
              <input type="number" name="minFame" value={filters.minFame} onChange={handleChange} placeholder="Min" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-400/20 text-gray-700" />
              <span className="text-gray-400">-</span>
              <input type="number" name="maxFame" value={filters.maxFame} onChange={handleChange} placeholder="Max" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-400/20 text-gray-700" />
            </div>
          </div>

          {/* Max Distance */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Max Distance (km)</label>
            <input type="number" name="maxDistance" value={filters.maxDistance} onChange={handleChange} placeholder="e.g. 50" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-400/20 text-gray-700" />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tags (comma separated)</label>
            <input type="text" name="tags" value={filters.tags} onChange={handleChange} placeholder="vegan, art, fitness" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-400/20 text-gray-700" />
          </div>

          {/* Sorting */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
              <select name="sortBy" value={filters.sortBy} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-400/20 text-gray-700">
                <option value="distance">Distance</option>
                <option value="age">Age</option>
                <option value="fame">Fame</option>
                <option value="common_tags">Common Tags</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Direction</label>
              <select name="sortDir" value={filters.sortDir} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-400/20 text-gray-700">
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 flex gap-3 bg-gray-50">
          <button onClick={handleClear} className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors">
            Clear
          </button>
          <button onClick={handleApply} className="flex-1 py-2.5 bg-gradient-to-r from-rose-500 to-orange-400 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all">
            Apply Filters
          </button>
        </div>

      </div>
    </div>
  );
}
