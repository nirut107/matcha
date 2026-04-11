"use client";

import React, { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";

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

interface Tag {
  id: number;
  name: string;
}

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

  // Tag-specific state
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Fetch available tags from backend on component mount
  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    fetch(`${baseUrl}/tags`)
      .then((res) => res.json())
      .then((data) => {
        // Assuming the backend returns { tags: [...] } or an array [...]
        setAvailableTags(data.tags || data || []);
      })
      .catch((err) => console.error("Error fetching tags:", err));
  }, []);

  // When modal opens, populate with current active filters
  useEffect(() => {
    if (isOpen) {
      const active = currentFilters || defaultFilters;
      setFilters(active);

      // Parse the comma-separated string back into the UI array state
      if (active.tags) {
        const tagsArray = active.tags
          .split(",")
          .filter((t) => t.trim() !== "")
          .map((t) => `#${t.trim()}`);
        setSelectedTags(tagsArray);
      } else {
        setSelectedTags([]);
      }
      setSearchTerm(""); // Reset search when opening
    }
  }, [isOpen, currentFilters]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Tag UI Logic
  const toggleTag = (tagName: string) => {
    const formatted = tagName.startsWith("#")
      ? tagName
      : `#${tagName.toLowerCase()}`;

    if (selectedTags.includes(formatted)) {
      setSelectedTags(selectedTags.filter((t) => t !== formatted));
    } else {
      setSelectedTags([...selectedTags, formatted]);
    }
  };

  const handleAddCustomTag = () => {
    const clean = searchTerm
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    if (clean && !selectedTags.includes(`#${clean}`)) {
      toggleTag(clean);
      setSearchTerm("");
    }
  };

  const handleApply = () => {
    const cleanTagsArray = selectedTags.map((tag) => tag.replace(/^#/, "").trim());


    const pgArrayString = cleanTagsArray.length > 0
      ? `{${cleanTagsArray.join(",")}}`
      : "";

    onApply({ ...filters, tags: pgArrayString });
    onClose();
  };

  const handleClear = () => {
    setFilters(defaultFilters);
    setSelectedTags([]);
    setSearchTerm("");
    onApply(null);
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
              <input type="number" name="minAge" value={filters.minAge} onChange={handleChange} placeholder="Min" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-400/20 text-gray-700" />
              <span className="text-gray-400">-</span>
              <input type="number" name="maxAge" value={filters.maxAge} onChange={handleChange} placeholder="Max" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-400/20 text-gray-700" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Fame Rating</label>
            <div className="flex items-center gap-2">
              <input type="number" name="minFame" value={filters.minFame} onChange={handleChange} placeholder="Min" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-400/20 text-gray-700" />
              <span className="text-gray-400">-</span>
              <input type="number" name="maxFame" value={filters.maxFame} onChange={handleChange} placeholder="Max" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-400/20 text-gray-700" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Max Distance (km)</label>
            <input type="number" name="maxDistance" value={filters.maxDistance} onChange={handleChange} placeholder="e.g. 50" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-400/20 text-gray-700" />
          </div>

          {/* Interactive Tag Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">Select Tags</label>

            {/* Selected Tags Display */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl min-h-[50px]">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-rose-500 text-white pl-3 pr-2 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    {tag}
                    <X
                      size={12}
                      className="cursor-pointer hover:text-rose-200"
                      onClick={() => toggleTag(tag)}
                    />
                  </span>
                ))}
              </div>
            )}

            {/* Tag Search/Select Input */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-400/20 text-gray-900 shadow-sm text-sm"
                placeholder="Search or create tags to filter..."
              />

              {/* Dropdown for Available Tags */}
              {searchTerm && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                  {availableTags
                    .filter(
                      (t) =>
                        t?.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
                        !selectedTags.includes(`#${t.name.toLowerCase()}`)
                    )
                    .map((tag) => (
                      <div
                        key={tag.id}
                        onClick={() => {
                          toggleTag(tag.name);
                          setSearchTerm("");
                        }}
                        className="px-4 py-2 hover:bg-rose-50 cursor-pointer border-b border-gray-50 last:border-0 text-gray-700 font-medium text-sm"
                      >
                        #{tag.name}
                      </div>
                    ))}

                  {/* Option to create/filter by a new tag if not in list */}
                  <div
                    onClick={handleAddCustomTag}
                    className="px-4 py-2 hover:bg-rose-50 cursor-pointer text-rose-500 font-bold flex items-center gap-2 text-sm"
                  >
                    <Plus size={16} /> Filter by "{searchTerm}"
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
              <select name="sortBy" value={filters.sortBy} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-700 focus:ring-2 focus:ring-rose-400/20 text-sm">
                <option value="distance">Distance</option>
                <option value="age">Age</option>
                <option value="fame">Fame</option>
                <option value="common_tags">Common Tags</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Direction</label>
              <select name="sortDir" value={filters.sortDir} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-700 focus:ring-2 focus:ring-rose-400/20 text-sm">
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
