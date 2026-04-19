"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Flame, X, Plus, MapPin, Loader2, Camera, Star } from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import Header from "@/components/Header";
import PhotoEditorModal from "@/components/PhotoEditorModal";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import ConfirmModal from "@/components/ConfirmModal";

export interface ImageItem {
  id?: number; // existing image (from DB)
  position: number; // order in gallery (1–5)
  is_profile?: boolean; // main profile picture
  file?: File; // new uploaded file
}

const MAX_TAGS = 10;

interface Tag {
  id: number;
  name: string;
}

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

function MapPickerModal({
  initialCoords,
  onConfirm,
  onClose,
}: {
  initialCoords: { lat: number; lng: number } | null;
  onConfirm: (lat: number, lng: number) => void;
  onClose: () => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [tempCoords, setTempCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(initialCoords);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const frame = requestAnimationFrame(() => {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current!,
        style: "mapbox://styles/mapbox/streets-v12",
        center: initialCoords
          ? [initialCoords.lng, initialCoords.lat]
          : [100.4953, 13.7518],
        zoom: initialCoords ? 12 : 8,
        antialias: true,
      });

      map.on("click", (e) => {
        const { lng, lat } = e.lngLat;
        setTempCoords({ lat, lng });

        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat]);
        } else {
          markerRef.current = new mapboxgl.Marker({ color: "#f43f5e" })
            .setLngLat([lng, lat])
            .addTo(map);
        }
      });

      if (initialCoords) {
        markerRef.current = new mapboxgl.Marker({ color: "#f43f5e" })
          .setLngLat([initialCoords.lng, initialCoords.lat])
          .addTo(map);
      }

      mapRef.current = map;
    });

    return () => {
      cancelAnimationFrame(frame);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="font-bold text-xl">Select Your Location</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div ref={mapContainerRef} className="h-[400px] w-full" />

        <div className="p-6 bg-gray-50 flex flex-col gap-3">
          <p className="text-sm text-gray-500 italic">
            Click on the map to drop a pin. This location will be used to show
            you matches nearby.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 font-bold text-gray-600 bg-white border rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              disabled={tempCoords ? true : false}
              onClick={() =>
                tempCoords && onConfirm(tempCoords.lat, tempCoords.lng)
              }
              className="flex-1 py-3 font-bold text-white bg-rose-500 rounded-xl hover:bg-rose-600 disabled:opacity-50"
            >
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfileSetupPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const [loading, setLoading] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Form State
  const [gender, setGender] = useState("");
  const [preference, setPreference] = useState("bisexual");
  const [biography, setBiography] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [location, setLocation] = useState<{
    lat: number | null;
    lng: number | null;
  }>({ lat: null, lng: null });
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [hasGoogle, setHasGoogle] = useState(false);
  const [error, setError] = useState("");
  const [errorFirst, setErrorFirst] = useState("");
  const [errorBio, setErrorBio] = useState("");

  // Image State (Matcha requires up to 5)
  const [previews, setPreviews] = useState<(string | null)[]>([
    null,
    null,
    null,
    null,
    null,
  ]);
  const [profilePicIndex, setProfilePicIndex] = useState(0);
  const [files, setFiles] = useState<(File | null)[]>([
    null,
    null,
    null,
    null,
    null,
  ]);
  const [existingImages, setExistingImages] = useState<(number | null)[]>([
    null,
    null,
    null,
    null,
    null,
  ]);
  const [age, setAge] = useState<number>(18);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [editingImage, setEditingImage] = useState<{
    index: number;
    src: string;
  } | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);

  const [isFirefox, setIsFirefox] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [progress, setProgress] = useState(0);
  const [openConfirmModal, setOpenConfirmModal] = useState<boolean>(false);

  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    setProgress(calculateProgress());
    setError("");
    setErrorFirst("");
    setErrorBio("");
  }, [
    firstName,
    lastName,
    email,
    gender,
    biography,
    selectedTags,
    previews,
    location,
    preference,
  ]);

  const fetchUser = async () => {
    try {
      const res = await fetchWithAuth("/user/me");
      if (res.status == 404) {
        router.push("auth/login");
      }
      const data = await res.json();

      setEmail(data.email || "");
      setHasGoogle(data.hasGoogle || false);
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };

  const fetchProfile = async () => {
    const res = await fetchWithAuth("/profile/me");

    if (res.status == 200) {
      const data = await res.json();
      setFirstName(data.first_name || "");
      setLastName(data.last_name);
      setGender(data.gender || "");
      setPreference(data.preference || "");
      setBiography(data.biography || "");
      let tagWithShape = [];
      if (data.tags) {
        tagWithShape = data.tags.map((tag: string) => "#" + tag);
      }
      setSelectedTags(tagWithShape);
      setAge(data.age || 18);
      setLocation({ lat: data.latitude || null, lng: data.longitude || null });
    }

    const newPreviews = [null, null, null, null, null];
    const newExisting = [null, null, null, null, null];
    const res2 = await fetchWithAuth("/pictures/me");

    if (res2.status == 200) {
      const data2 = await res2.json();
      data2.forEach((img: any) => {
        const index = img.position - 1;

        newPreviews[index] = img.url; // show image
        newExisting[index] = img.id; // store id

        if (img.is_profile) {
          setProfilePicIndex(index);
        }
      });
    }

    setPreviews(newPreviews);
    setExistingImages(newExisting);
  };

  useEffect(() => {
    // Detect Firefox
    setIsFirefox(navigator.userAgent.toLowerCase().includes("firefox"));

    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    fetch(`${baseUrl}/tags`)
      .then((res) => res.json())
      .then((data) => setAvailableTags(data.tags))
      .catch((err) => console.error("Error fetching tags:", err));
    fetchProfile();
    fetchUser();
  }, []);

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    fetch(`${baseUrl}/tags`)
      .then((res) => res.json())
      .then((data) => setAvailableTags(data.tags))
      .catch((err) => console.error("Error fetching tags:", err));
    fetchProfile();
    fetchUser();
  }, []);

  // Geocoding (Text to Coordinates)
  const handleCitySearch = async () => {
    if (!cityInput.trim()) return;

    setIsGeocoding(true);
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          cityInput
        )}.json?access_token=${token}&limit=1`
      );
      const data = await res.json();

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        setLocation({ lat, lng });
        // Optional: clear the input or set it to the formatted place name
        setCityInput(data.features[0].place_name);
      } else {
        alert("Location not found. Try a different city or neighborhood.");
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      alert("Failed to search location.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleCityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCityInput(val);

    // Clear the previous timer
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // If input is empty, clear suggestions
    if (!val.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Set a new timer to fetch suggestions after 300ms
    typingTimeoutRef.current = setTimeout(async () => {
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        // Notice we added autocomplete=true and limit=5
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            val
          )}.json?access_token=${token}&autocomplete=true&limit=5`
        );
        const data = await res.json();

        if (data.features) {
          setSuggestions(data.features);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error("Geocoding autocomplete error:", err);
      }
    }, 300);
  };

  // Function when a user clicks a suggestion from the dropdown
  const handleSelectSuggestion = (feature: any) => {
    const [lng, lat] = feature.center;
    setLocation({ lat, lng });
    setCityInput(feature.place_name); // Fill input with full location name
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleImageChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    openEditor(index, file);
    e.target.value = ""; // Clear input so the same file can be re-selected if they cancel
  };
  // Intercepts the file and opens the editor modal
  const openEditor = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditingImage({ index, src: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  // Callback when the editor modal finishes processing
  const handleSaveEdit = (editedFile: File, newPreviewUrl: string) => {
    if (!editingImage) return;
    const { index } = editingImage;

    const newFiles = [...files];
    newFiles[index] = editedFile;
    setFiles(newFiles);

    const newExisting = [...existingImages];
    newExisting[index] = null;
    setExistingImages(newExisting);

    const newPreviews = [...previews];
    newPreviews[index] = newPreviewUrl;
    setPreviews(newPreviews);

    setEditingImage(null); // Close modal
  };

  const buildImagesPayload = (): ImageItem[] => {
    const images: ImageItem[] = [];

    for (let i = 0; i < 5; i++) {
      if (files[i]) {
        images.push({
          position: i + 1,
          is_profile: i === profilePicIndex,
          file: files[i]!,
        });
      }

      // ✅ existing image
      else if (existingImages[i]) {
        images.push({
          id: existingImages[i]!,
          position: i + 1,
          is_profile: i === profilePicIndex,
        });
      }
    }

    return images;
  };
  const buildFormData = () => {
    const formData = new FormData();
    const imagesPayload: any[] = [];

    const images = buildImagesPayload();

    images.forEach((img) => {
      if (img.file) {
        formData.append("files", img.file);

        imagesPayload.push({
          position: img.position,
          is_profile: img.is_profile,
        });
      } else {
        imagesPayload.push({
          id: img.id,
          position: img.position,
          is_profile: img.is_profile,
        });
      }
    });

    formData.append("images", JSON.stringify(imagesPayload));

    return formData;
  };
  const syncImages = async () => {
    const formData = buildFormData();

    for (const [key, value] of formData.entries()) {
      console.log(key, value);
    }

    const res = await fetchWithAuth("/pictures/sync", {
      method: "POST",
      body: formData,
    });

    if (res.status === 401) {
      console.log("Unauthorized");
      return;
    }

    if (!res.ok) {
      const error = await res.json();
      console.log("Error:", error);
      return;
    }

    const data = await res.json();
    console.log("Success:", data);
  };

  const handleDrop = (dropIndex: number, e?: React.DragEvent) => {
    if (e) e.preventDefault();

    // 1. Check if a file was dragged from the Computer/OS
    if (e?.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        openEditor(dropIndex, file);
      }
      return;
    }

    // 2. Reordering internal gallery images
    if (dragIndex === null) return;

    const newPreviews = [...previews];
    const newFiles = [...files];
    const newExisting = [...existingImages]; // Don't forget to swap existing IDs too!

    [newPreviews[dragIndex], newPreviews[dropIndex]] = [
      newPreviews[dropIndex],
      newPreviews[dragIndex],
    ];
    [newFiles[dragIndex], newFiles[dropIndex]] = [
      newFiles[dropIndex],
      newFiles[dragIndex],
    ];
    [newExisting[dragIndex], newExisting[dropIndex]] = [
      newExisting[dropIndex],
      newExisting[dragIndex],
    ];

    setPreviews(newPreviews);
    setFiles(newFiles);
    setExistingImages(newExisting);

    if (profilePicIndex === dragIndex) setProfilePicIndex(dropIndex);
    else if (profilePicIndex === dropIndex) setProfilePicIndex(dragIndex);

    setDragIndex(null);
  };

  // Tag Logic (Local only, sent on submit)
  const toggleTag = (tagName: string) => {
    setError("");

    const formatted = tagName.startsWith("#")
      ? tagName
      : `#${tagName.toLowerCase()}`;

    if (selectedTags && selectedTags.includes(formatted)) {
      setSelectedTags(selectedTags.filter((t) => t !== formatted));
    } else if (!selectedTags) {
      setSelectedTags([formatted]);
    } else {
      if (selectedTags.length >= MAX_TAGS) {
        setError(`You can select up to ${MAX_TAGS} tags.`);
        return;
      }
      setSelectedTags([...selectedTags, formatted]);
    }
  };

  const handleAddCustomTag = () => {
    const clean = searchTerm
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    if (clean.length > 15) {
      setError("Tag must be 15 characters or less.");
      return;
    }
    if (!selectedTags) {
      toggleTag(clean);
      setSearchTerm("");
    } else if (clean && !selectedTags.includes(`#${clean}`)) {
      toggleTag(clean);
      setSearchTerm("");
    }
  };

  const handleLocation = () => {
    setIsLocating(true); // Start loading

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false); // Stop loading on success
        alert("GPS Location captured!");
      },
      () => {
        setIsLocating(false); // Stop loading on error
        alert("Location denied. Please select it manually on the map.");
        // setShowMapModal(true);
      },
      { timeout: 10000 } // Optional: add a timeout for safety
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (progress < 100) {
      setError("Please complete your profile 100% before submitting.");
      return;
    }

    if (!firstName || !lastName) {
      setError("First name and last name are required.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const cleanTags = selectedTags.map((tag) => tag.replace(/^#/, "").trim());
      const profileRes = await fetchWithAuth("/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          gender,
          preference,
          biography,
          tags: cleanTags,
          age,
          latitude: location.lat,
          longitude: location.lng,
        }),
      });

      if (!profileRes.ok) throw new Error("Profile creation failed");

      await syncImages();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
    if (!hasGoogle) {
      console.log("Updating email to:", email);
      setLoading(true);
      const emailRes = await fetchWithAuth("/user/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!emailRes.ok) {
        const data = await emailRes.json();
        throw new Error(data.message || "Email update failed");
      }
      if (emailRes.ok) {
        const data = await emailRes.json();
        if (data.message.includes("verify")) {
          setOpenConfirmModal(true);
          return;
        }
      }
    }
    setLoading(false);
    router.push("/dashboard");
  };

  // Calculate completion percentage for the Progress Bar
  const calculateProgress = () => {
    let score = 0;
    if (firstName && lastName) score += 15;
    if (email) score += 15;
    if (gender) score += 10;
    if (biography && biography.length > 10) score += 15;
    if (selectedTags && selectedTags.length >= 3) score += 15;
    if (previews.filter((p) => p !== null).length >= 1) score += 15;
    if (location.lat) score += 10;
    if (preference) score += 5;
    return score;
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 flex flex-col items-center py-12 px-4">
        <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12">
          {/* Header & Percent Bar */}
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="bg-gradient-to-tr from-rose-500 to-orange-400 p-3 rounded-2xl mb-4 shadow-lg">
              <Flame size={32} color="white" fill="white" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Setup Your Vibe
            </h1>

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
              <label className="text-sm font-bold text-gray-700 ml-1">
                PHOTOS (MIN 1, MAX 5)
              </label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {previews.map((url, i) => (
                  <div
                    key={i}
                    draggable={!!url}
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(i, e)}
                    className={`relative aspect-[3/4] rounded-2xl border-2 overflow-hidden bg-gray-50 transition-all cursor-move
                ${
                  i === profilePicIndex
                    ? "border-rose-500 ring-4 ring-rose-50"
                    : "border-dashed border-gray-200"
                }`}
                  >
                    {url ? (
                      <>
                        {/* IMAGE */}
                        <img src={url} className="w-full h-full object-cover" />

                        {/* PROFILE SELECT */}
                        <button
                          type="button"
                          onClick={() => setProfilePicIndex(i)}
                          className={`absolute top-2 left-2 p-1 rounded-lg backdrop-blur-md ${
                            i === profilePicIndex
                              ? "bg-rose-500 text-white"
                              : "bg-white/80 text-gray-400"
                          }`}
                        >
                          <Star
                            size={12}
                            fill={i === profilePicIndex ? "white" : "none"}
                          />
                        </button>

                        {/* DELETE */}
                        <button
                          type="button"
                          onClick={() => {
                            const n = [...previews];
                            const f = [...files];
                            n[i] = null;
                            f[i] = null;
                            setPreviews(n);
                            setFiles(f);
                          }}
                          className="absolute top-2 right-2 bg-black/40 backdrop-blur-md p-1 rounded-full text-white hover:bg-black"
                        >
                          <X size={12} />
                        </button>
                      </>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-gray-100 transition-colors">
                        <Camera size={20} className="text-gray-400" />
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleImageChange(i, e)}
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">
                  FIRST NAME
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => {
                    if (e.target.value.length > 20) {
                      setErrorFirst(
                        `First name must be 20 characters or fewer.`
                      );
                      setFirstName(firstName);
                    } else {
                      setErrorFirst("");

                      setFirstName(e.target.value);
                    }
                  }}
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-rose-400 outline-none text-gray-900"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">
                  LAST NAME
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => {
                    if (e.target.value.length > 20) {
                      setErrorFirst(
                        `Last name must be 20 characters or fewer.`
                      );
                      setLastName(lastName);
                    } else {
                      setErrorFirst("");
                      setLastName(e.target.value);
                    }
                  }}
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-rose-400 outline-none text-gray-900"
                />
              </div>
            </div>
            {errorFirst && (
              <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm font-semibold">
                {errorFirst}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">
                EMAIL
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={hasGoogle}
                className={`w-full p-4 border-2 rounded-2xl outline-none transition text-gray-900
      ${
        hasGoogle
          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
          : "bg-gray-50 border-gray-100 focus:border-rose-400"
      }`}
              />

              {hasGoogle && (
                <p className="text-xs text-gray-400">
                  Email is managed via Google account and cannot be changed.
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">
                  GENDER{" "}
                </label>
                <select
                  required
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-rose-400 outline-none text-gray-900 appearance-none"
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="both">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">
                  AGE
                </label>
                <input
                  type="number"
                  min="18"
                  max="99"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-rose-400 outline-none text-gray-900 appearance-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">
                  INTERESTED IN{" "}
                </label>
                <select
                  value={preference}
                  onChange={(e) => setPreference(e.target.value)}
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-rose-400 outline-none text-gray-900 appearance-none"
                >
                  <option value="">Select...</option>
                  <option value="male">Men</option>
                  <option value="female">Women</option>
                  <option value="both">Everyone (Default)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">
                BIO
              </label>
              <textarea
                required
                rows={3}
                placeholder="Tell us something interesting..."
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-rose-400 outline-none text-gray-900 resize-none"
                value={biography}
                onChange={(e) => {
                  if (e.target.value.length > 150) {
                    setErrorBio(
                      "Biography is too long. Please enter less than 150 characters"
                    );
                    setBiography(biography);
                  } else {
                    setErrorBio("");
                    setBiography(e.target.value);
                  }
                }}
              />
              <p className="text-xs text-gray-400">
                Type at least 10 characters and up to 150 characters
              </p>
            </div>
            {errorBio && (
              <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm font-semibold">
                {errorBio}
              </div>
            )}

            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-700 ml-1">
                INTERESTS
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border-2 border-gray-100 rounded-2xl min-h-[60px]">
                {selectedTags &&
                  selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-rose-500 text-white pl-4 pr-2 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm"
                    >
                      {tag}{" "}
                      <X
                        size={14}
                        className="cursor-pointer"
                        onClick={() => toggleTag(tag)}
                      />
                    </span>
                  ))}
              </div>
              <p className="text-xs text-gray-400">
                Choose at least 3 tags and up to 10 tags
              </p>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), handleAddCustomTag())
                  }
                  className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-rose-400 outline-none text-gray-900 shadow-sm"
                  placeholder="Search or create tags..."
                />
                {searchTerm && (
                  <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-100 rounded-2xl shadow-2xl max-h-48 overflow-y-auto">
                    {availableTags &&
                      availableTags
                        .filter(
                          (t) =>
                            t?.name?.includes(searchTerm.toLowerCase()) &&
                            selectedTags &&
                            !selectedTags.includes(`#${t.name}`)
                        )
                        .map((tag) => (
                          <div
                            key={tag.id}
                            onClick={() => {
                              toggleTag(tag.name);
                              setSearchTerm("");
                            }}
                            className="p-4 hover:bg-rose-50 cursor-pointer border-b border-gray-50 last:border-0 text-gray-800 font-medium text-sm"
                          >
                            #{tag.name}
                          </div>
                        ))}
                    <div
                      onClick={handleAddCustomTag}
                      className="p-4 hover:bg-green-50 cursor-pointer text-green-600 font-bold flex items-center gap-2 text-sm"
                    >
                      <Plus size={18} /> Create new tag: "{searchTerm}"
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-700 ml-1">
                LOCATION
              </label>

              {/* GPS and Map Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  disabled={isLocating} // Disable button while fetching
                  onClick={handleLocation}
                  className={`flex-1 flex items-center justify-center gap-2 font-bold px-4 py-4 rounded-2xl transition-all border-2 ${
                    location.lat
                      ? "text-green-600 bg-green-50 border-green-100"
                      : "text-rose-500 bg-rose-50 border-rose-100 hover:bg-rose-100"
                  }`}
                >
                  {isLocating ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Locating...
                    </>
                  ) : (
                    <>
                      <MapPin size={20} />
                      {location.lat ? "GPS Verified" : "Use My GPS"}
                    </>
                  )}
                </button>

                <div className="flex-1 flex flex-col relative group">
                  <button
                    type="button"
                    disabled={isFirefox}
                    onClick={() => setShowMapModal(true)}
                    className={`w-full h-full flex items-center justify-center gap-2 font-bold px-4 py-4 rounded-2xl transition-all border-2 ${
                      isFirefox
                        ? "text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed"
                        : location.lat && !navigator.geolocation
                        ? "text-green-600 bg-green-50 border-green-100"
                        : "text-gray-600 bg-gray-50 border-gray-100 hover:bg-gray-100"
                    }`}
                  >
                    <Search size={20} />
                    {location.lat ? "Change on Map" : "Select on Map"}
                  </button>
                </div>
              </div>

              {/* Firefox Warning */}
              {isFirefox && (
                <p className="text-xs text-rose-500 font-medium px-1">
                  * Map selection is currently unavailable in Firefox. Please
                  use Chrome to pick from the map, or type your city below.
                </p>
              )}

              {/* Autocomplete Text Search UI */}
              <div className="flex gap-2 relative">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Or type your city / neighborhood..."
                    value={cityInput}
                    onChange={handleCityInputChange}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    onBlur={() =>
                      setTimeout(() => setShowSuggestions(false), 200)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCitySearch(); // Fallback to first result if they just hit enter
                      }
                    }}
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-rose-400 outline-none text-gray-900"
                  />

                  {/* The Dropdown Menu */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                      {suggestions.map((feature) => (
                        <div
                          key={feature.id}
                          onClick={() => handleSelectSuggestion(feature)}
                          className="p-4 hover:bg-rose-50 cursor-pointer border-b border-gray-50 last:border-0 text-gray-800 text-sm font-medium transition-colors"
                        >
                          <div className="text-gray-900 font-bold">
                            {feature.text}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {feature.place_name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleCitySearch}
                  disabled={isGeocoding || !cityInput.trim()}
                  className="px-6 py-4 bg-gray-800 text-white font-bold rounded-2xl hover:bg-gray-900 transition-all disabled:opacity-50 flex items-center justify-center min-w-[100px] z-0"
                >
                  {isGeocoding ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    "Search"
                  )}
                </button>
              </div>

              {location.lat && (
                <p className="text-center text-xs text-green-600 font-medium">
                  Success! Location set to {location.lat.toFixed(4)},{" "}
                  {location.lng?.toFixed(4)}
                </p>
              )}
            </div>
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm font-semibold">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={!isMounted || loading || progress < 100}
              className="w-full bg-gradient-to-r from-rose-500 to-orange-400 text-white font-black py-5 rounded-2xl shadow-xl shadow-rose-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
            >
              {loading ? (
                <Loader2 className="animate-spin mx-auto" />
              ) : (
                "FINISH & START MATCHING"
              )}
            </button>
          </form>
          {/* Render the Editor Modal if an image is queued for editing */}
          {editingImage && (
            <PhotoEditorModal
              src={editingImage.src}
              onClose={() => setEditingImage(null)}
              onSave={handleSaveEdit}
            />
          )}
          {/* MAP MODAL RENDERING */}
          {showMapModal && (
            <MapPickerModal
              key="map-picker"
              initialCoords={
                location.lat && location.lng
                  ? { lat: location.lat, lng: location.lng }
                  : null
              }
              onClose={() => setShowMapModal(false)}
              onConfirm={(lat, lng) => {
                setLocation({ lat, lng });
                setShowMapModal(false);
              }}
            />
          )}
        </div>
        {openConfirmModal && (
          <ConfirmModal
            title="Email Updated!"
            message="Please check your inbox and verify your email before logging in again."
            isOpen={openConfirmModal}
            onConfirm={() => router.push("/auth/login")}
          />
        )}
      </div>
      {/*  FOOTER */}
      <footer className="bg-white border-t p-4 text-center">
        <p className="text-xs text-gray-300">
          Matcha © 2026 • Because love can be industrialized
        </p>
      </footer>
    </>
  );
}
