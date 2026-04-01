"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Plus, X, MapPin, Loader2 } from 'lucide-react';

export default function ProfileSetup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [availableTags, setAvailableTags] = useState<{id: number, name: string}[]>([]);
  const [selectedTags, setSelectedTags] = useState<{id: number, name: string}[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    gender: '',
    preference: 'bisexual', // Default per subject [cite: 99]
    bio: '',
    tags: [] as string[],
    location: { lat: null as number | null, lng: null as number | null, city: '' }
  });

  // Photo state (Subject requires up to 5)
  const [images, setImages] = useState<(string | null)[]>([null, null, null, null, null]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      }
      setTagInput("");
    }
  };

  const requestLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setFormData({
          ...formData,
          location: { ...formData.location, lat: pos.coords.latitude, lng: pos.coords.longitude }
        });
        alert("Location captured via GPS!");
      }, () => {
        alert("GPS denied. Please enter your city manually in the final version.");
      });
    }
  };
  // Fetch your NestJS tags on mount
  useEffect(() => {
    fetch('http://localhost:3001/tags')
      .then(res => res.json())
      .then(data => setAvailableTags(data.tags))
      .catch(err => console.error("Failed to load tags", err));
  }, []);

  const createNewTag = async () => {
    const tagName = searchTerm.toLowerCase().trim().replace(/[^a-z0-t]/g, '');
    if (!tagName) return;

    try {
      // POST to your backend to save the new tag
      const response = await fetch('http://localhost:3001/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tagName }),
      });

      const newTag = await response.json();
      setAvailableTags([...availableTags, newTag]);
      toggleTag(newTag);
      setSearchTerm("");
    } catch (err) {
      console.error("Error creating tag", err);
    }
  };

  const toggleTag = (tag: {id: number, name: string}) => {
    if (selectedTags.find(t => t.id === tag.id)) {
      setSelectedTags(selectedTags.filter(t => t.id !== tag.id));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Filter tags based on user typing
// Filter tags safely
    const filteredTags = availableTags.filter(tag =>
        tag?.name && // Check if tag and tag.name exist
        tag.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selectedTags.find(st => st.id === tag.id)
    );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
        <p className="text-gray-500 mb-8">You need to finish this to start matching! </p>

        <form className="space-y-8">
          {/* Photo Upload Grid  */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-4">Profile Pictures (Up to 5)</label>
            <div className="grid grid-cols-5 gap-2">
              {images.map((img, i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden">
                  {img ? (
                    <img src={img} className="object-cover w-full h-full" alt="Upload" />
                  ) : (
                    <Camera className="text-gray-400" />
                  )}
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              ))}
            </div>
          </div>

          {/* Gender & Preference [cite: 78, 79] */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">I am a...</label>
              <select
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Interested in...</label>
              <select
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                value={formData.preference}
                onChange={(e) => setFormData({...formData, preference: e.target.value})}
              >
                <option value="male">Men</option>
                <option value="female">Women</option>
                <option value="bisexual">Both (Bisexual)</option>
              </select>
            </div>
          </div>

          {/* Biography [cite: 80] */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            <textarea
              rows={4}
              placeholder="Tell us about yourself..."
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-rose-400"
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
            />
          </div>

          {/* Interests/Tags  */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Interests</label>

            {/* Selected Tags */}
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-gray-100 rounded-lg bg-gray-50/50">
                {selectedTags.map(tag => (
                <span key={tag.id} className="bg-rose-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    #{tag.name}
                    <button onClick={() => toggleTag(tag)}><X size={14} /></button>
                </span>
                ))}
            </div>

            <div className="relative">
                <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-rose-400 outline-none"
                placeholder="Search or add new tag..."
                />

                {searchTerm && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    {/* Suggest existing tags */}
                    {filteredTags.map(tag => (
                    <div
                        key={tag.id}
                        onClick={() => { toggleTag(tag); setSearchTerm(""); }}
                        className="p-3 hover:bg-rose-50 cursor-pointer text-gray-700 border-b border-gray-50 last:border-0"
                    >
                        #{tag.name}
                    </div>
                    ))}

                    {/* "Create New" option */}
                    {!availableTags.find(t => t.name.toLowerCase() === searchTerm.toLowerCase()) && (
                    <div
                        onClick={createNewTag}
                        className="p-3 hover:bg-green-50 cursor-pointer text-green-600 font-medium flex items-center gap-2"
                    >
                        <Plus size={18} /> Add new tag: "{searchTerm}"
                    </div>
                    )}
                </div>
                )}
            </div>
            </div>

          {/* Location [cite: 91, 92] */}
          <button
            type="button"
            onClick={requestLocation}
            className="flex items-center gap-2 text-rose-500 font-semibold hover:text-rose-600 transition-colors"
          >
            <MapPin size={20} />
            {formData.location.lat ? "Location Saved!" : "Share My Location"}
          </button>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-rose-500 to-orange-400 text-white font-bold py-4 rounded-full shadow-lg hover:opacity-90 transition-all"
          >
            SAVE PROFILE
          </button>
        </form>
      </div>
    </div>
  );
}
