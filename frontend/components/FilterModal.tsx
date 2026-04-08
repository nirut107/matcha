"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

type FilterState = {
  minAge: string;
  maxAge: string;
  minFame: string;
  maxFame: string;
  maxDistance: string;
  tags: string;
  sortBy: string;
  sortDir: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState | null) => void;
  currentFilters: FilterState | null;
};

const defaultFilters: FilterState = {
  minAge: "",
  maxAge: "",
  minFame: "",
  maxFame: "",
  maxDistance: "",
  tags: "",
  sortBy: "distance",
  sortDir: "asc",
};

export default function FilterModal({ isOpen, onClose, onApply, currentFilters }: Props) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  // When modal opens, populate with current active filters if they exist
  useEffect(() => {
    if (isOpen) {
      setFilters(currentFilters || defaultFilters);
    }
  }, [isOpen, currentFilters]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApply = () => {
    onApply(filters); // Send the data back to Dashboard
    onClose();
  };

  const handleClear = () => {
    setFilters(defaultFilters);
    onApply(null); // Tell Dashboard to clear filters
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Filters</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-rose-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Form Area */}
        <div className="p-6 overflow-y-auto flex-grow space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Age Range</label>
            <div className="flex items-center gap-2">
              <input type="number" name="minAge" value={filters.minAge} onChange={handleChange} placeholder="Min" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-400/20" />
              <span className="text-gray-400">-</span>
              <input type="number" name="maxAge" value={filters.maxAge} onChange={handleChange} placeholder="Max" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-400/20" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Fame Rating</label>
            <div className="flex items-center gap-2">
              <input type="number" name="minFame" value={filters.minFame} onChange={handleChange} placeholder="Min" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-400/20" />
              <span className="text-gray-400">-</span>
              <input type="number" name="maxFame" value={filters.maxFame} onChange={handleChange} placeholder="Max" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-400/20" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Max Distance (km)</label>
            <input type="number" name="maxDistance" value={filters.maxDistance} onChange={handleChange} placeholder="e.g. 50" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-400/20" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tags (comma separated)</label>
            <input type="text" name="tags" value={filters.tags} onChange={handleChange} placeholder="vegan, art, fitness" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-400/20" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
              <select name="sortBy" value={filters.sortBy} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-700 focus:ring-2 focus:ring-rose-400/20">
                <option value="distance">Distance</option>
                <option value="age">Age</option>
                <option value="fame">Fame</option>
                <option value="common_tags">Common Tags</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Direction</label>
              <select name="sortDir" value={filters.sortDir} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-700 focus:ring-2 focus:ring-rose-400/20">
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
