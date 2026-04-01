"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Flame, X, Plus, User, Heart, AlignLeft, MapPin, Loader2, Camera, Star, CheckCircle2 } from 'lucide-react';

interface Tag {
  id: number;
  name: string;
}

export default function ProfileSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Form State
  const [gender, setGender] = useState("");
  const [preference, setPreference] = useState("bisexual");
  const [biography, setBiography] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });

  // Image State (Matcha requires up to 5)
  const [previews, setPreviews] = useState<(string | null)[]>([null, null, null, null, null]);
  const [profilePicIndex, setProfilePicIndex] = useState(0);

  // Load existing tags from NestJS
  useEffect(() => {
    fetch('http://localhost:3001/tags')
      .then(res => res.json())
      .then(data => setAvailableTags(data.tags))
      .catch(err => console.error("Error fetching tags:", err));
  }, []);

  // Image Logic
  const handleImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPreviews = [...previews];
        newPreviews[index] = reader.result as string;
        setPreviews(newPreviews);
      };
      reader.readAsDataURL(file);
    }
  };

  // Tag Logic (Local only, sent on submit)
  const toggleTag = (tagName: string) => {
    const formatted = tagName.startsWith('#') ? tagName : `#${tagName.toLowerCase()}`;
    if (selectedTags.includes(formatted)) {
      setSelectedTags(selectedTags.filter(t => t !== formatted));
    } else {
      setSelectedTags([...selectedTags, formatted]);
    }
  };

  const handleAddCustomTag = () => {
    const clean = searchTerm.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean && !selectedTags.includes(`#${clean}`)) {
      toggleTag(clean);
      setSearchTerm("");
    }
  };

  // Geolocation (Mandatory Step [cite: 91, 92])
  const handleLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert("Location denied. You'll need to set this manually in your settings later.")
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      gender,
      preference,
      biography,
      tags: selectedTags,
      images: previews.filter(p => p !== null),
      mainImageIndex: profilePicIndex,
      location
    };

    try {
      const res = await fetch('http://localhost:3001/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) router.push('/browse');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate completion percentage for the Progress Bar
  const calculateProgress = () => {
    let score = 0;
    if (gender) score += 20;
    if (biography.length > 10) score += 20;
    if (selectedTags.length >= 3) score += 20;
    if (previews.filter(p => p !== null).length >= 1) score += 20;
    if (location.lat) score += 20;
    return score;
  };

  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12">

        {/* Header & Percent Bar */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="bg-gradient-to-tr from-rose-500 to-orange-400 p-3 rounded-2xl mb-4 shadow-lg">
            <Flame size={32} color="white" fill="white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Setup Your Vibe</h1>

          <div className="w-full mt-6 space-y-2">
            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
              <span>Profile Completion</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden border border-gray-50">
              <div
                className="bg-gradient-to-r from-rose-500 via-pink-500 to-orange-400 h-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">

          {/* Photo Grid (Max 5 [cite: 82]) */}
          <div className="space-y-4">
            <label className="text-sm font-bold text-gray-700 ml-1">PHOTOS (MIN 1, MAX 5)</label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {previews.map((url, i) => (
                <div key={i} className={`relative aspect-[3/4] rounded-2xl border-2 overflow-hidden bg-gray-50 transition-all ${i === profilePicIndex ? 'border-rose-500 ring-4 ring-rose-50' : 'border-dashed border-gray-200'}`}>
                  {url ? (
                    <>
                      <img src={url} className="w-full h-full object-cover" alt="upload" />
                      <button
                        type="button"
                        onClick={() => setProfilePicIndex(i)}
                        className={`absolute top-2 left-2 p-1 rounded-lg backdrop-blur-md ${i === profilePicIndex ? 'bg-rose-500 text-white' : 'bg-white/80 text-gray-400'}`}
                      >
                        <Star size={12} fill={i === profilePicIndex ? "white" : "none"} />
                      </button>
                      <button
                        type="button"
                        onClick={() => { const n = [...previews]; n[i] = null; setPreviews(n); }}
                        className="absolute top-2 right-2 bg-black/40 backdrop-blur-md p-1 rounded-full text-white hover:bg-black"
                      >
                        <X size={12} />
                      </button>
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-gray-100 transition-colors">
                      <Camera size={20} className="text-gray-400" />
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(i, e)} />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">GENDER </label>
              <select required value={gender} onChange={(e) => setGender(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-rose-400 outline-none text-gray-900 appearance-none">
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">INTERESTED IN </label>
              <select value={preference} onChange={(e) => setPreference(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-rose-400 outline-none text-gray-900 appearance-none">
                <option value="male">Men</option>
                <option value="female">Women</option>
                <option value="bisexual">Everyone (Default)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">BIO</label>
            <textarea required rows={3} placeholder="Tell us something interesting..." className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-rose-400 outline-none text-gray-900 resize-none" onChange={(e) => setBiography(e.target.value)} />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-gray-700 ml-1">INTERESTS</label>
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border-2 border-gray-100 rounded-2xl min-h-[60px]">
              {selectedTags.map(tag => (
                <span key={tag} className="bg-rose-500 text-white pl-4 pr-2 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm">
                  {tag} <X size={14} className="cursor-pointer" onClick={() => toggleTag(tag)} />
                </span>
              ))}
            </div>
            <div className="relative">
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTag())} className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-rose-400 outline-none text-gray-900 shadow-sm" placeholder="Search or create tags..." />
              {searchTerm && (
                <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-100 rounded-2xl shadow-2xl max-h-48 overflow-y-auto">
                  {availableTags.filter(t => t?.name?.includes(searchTerm.toLowerCase()) && !selectedTags.includes(`#${t.name}`)).map(tag => (
                    <div key={tag.id} onClick={() => { toggleTag(tag.name); setSearchTerm(""); }} className="p-4 hover:bg-rose-50 cursor-pointer border-b border-gray-50 last:border-0 text-gray-800 font-medium text-sm">#{tag.name}</div>
                  ))}
                  <div onClick={handleAddCustomTag} className="p-4 hover:bg-green-50 cursor-pointer text-green-600 font-bold flex items-center gap-2 text-sm"><Plus size={18} /> Create new tag: "{searchTerm}"</div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <button type="button" onClick={handleLocation} className={`flex items-center gap-2 font-bold px-4 py-2 rounded-xl transition-all ${location.lat ? 'text-green-500 bg-green-50' : 'text-rose-500 bg-rose-50 hover:bg-rose-100'}`}>
              {location.lat ? <CheckCircle2 size={20} /> : <MapPin size={20} />}
              {location.lat ? "Location Verified" : "Verify Location (GPS)"}
            </button>
          </div>

          <button type="submit" disabled={loading || progress < 40 || !previews[profilePicIndex]} className="w-full bg-gradient-to-r from-rose-500 to-orange-400 text-white font-black py-5 rounded-2xl shadow-xl shadow-rose-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : "FINISH & START MATCHING"}
          </button>
        </form>
      </div>
    </div>
  );
}
