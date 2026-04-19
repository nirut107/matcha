"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Header from "@/components/Header";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import ProfileModal from "@/components/ProfileModal";
import { UserProfile } from "@/components/ProfileModal";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

type Image = {
  url: string;
  position: number;
};

interface MapUser {
  userId: number;
  first_name: string;
  age: number;
  gender: string;
  biography: string;
  tags: string[];
  images: Image[];
  profileIndex: number;
  profileImage: string;
  fame_rating: number;
  latitude: number;
  longitude: number;
  distance: string;
  is_online: boolean;
  i_blocked_them: boolean;
  i_liked_them: boolean;
  create_at: string;
  last_connection: string;
}

export default function MapPage() {
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: number]: mapboxgl.Marker }>({});

  const [users, setUsers] = useState<MapUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const [isSearchingArea, setIsSearchingArea] = useState(false);
  const [showSearchButton, setShowSearchButton] = useState(false);

  const [mapCenter, setMapCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    const isFirefox = navigator.userAgent.toLowerCase().includes("firefox");
    if (isFirefox) {
      alert(
        "The Map feature is not supported on Firefox. Redirecting to the dashboard."
      );
      router.push("/dashboard");
    }
  }, [router]);

  const getGenderSVG = (gender?: string) => {
    const g = gender?.toLowerCase();
    if (g === "male") {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));"><circle cx="10" cy="14" r="6"/><path d="m14.24 9.76 5.38-5.38"/><path d="M15.5 4h4.5v4.5"/></svg>`;
    }
    if (g === "female") {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f472b6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));"><circle cx="12" cy="9" r="6"/><path d="M12 15v7"/><path d="M9 19h6"/></svg>`;
    }
    // Infinity icon for 'other'
    return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));"><path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z"/></svg>`;
  };

  // ==========================================
  // 1. HELPER FUNCTIONS
  // ==========================================
  const handleShowInfo = async (user: MapUser) => {
    const res = await fetchWithAuth(`/profile/data/${user.userId}`);
    const data: UserProfile = await res.json();

    setSelectedUser(data);
    setShowModal(true);
    setIsModalLoading(true);

    try {
      await fetchWithAuth(`/profile/visit/${user.userId}`, { method: "POST" });
    } catch (err) {
      console.error(err);
    } finally {
      setIsModalLoading(false);
    }
  };

  const updateLike = (userId: number, liked: boolean) => {
    setUsers((prev) =>
      prev.map((u) => (u.userId === userId ? { ...u, i_liked_them: liked } : u))
    );
  };

  const updateBlock = (userId: number, blocked: boolean) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.userId === userId
          ? {
              ...u,
              i_blocked_them: blocked,
              i_liked_them: blocked ? false : u.i_liked_them,
            }
          : u
      )
    );
  };

  const handleLike = async (userId: number) => {
    try {
      const res = await fetchWithAuth(`/swipe/swipe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: userId, action: "like" }),
      });
      if (!res.ok) throw new Error("Failed to like user");
    } catch (err) {
      console.error("Error liking user:", err);
    }
  };

  const handleUnlike = async (userId: number) => {
    try {
      const res = await fetchWithAuth(`/swipe/unlike`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: userId }),
      });
      if (!res.ok) throw new Error("Failed to unlike user");
    } catch (err) {
      console.error("Error unliking user:", err);
    }
  };

  const handleBlock = async (userId: number) => {
    try {
      const res = await fetchWithAuth(`/blocks/${userId}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to block user");
    } catch (err) {
      console.error("Error blocking user:", err);
    }
  };

  const handleUnblock = async (userId: number) => {
    try {
      const res = await fetchWithAuth(`/blocks/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to unblock user");
    } catch (err) {
      console.error("Error unblocking user:", err);
    }
  };

  // 🔥 ACTION: Triggered when user clicks "Search this area"
  const handleSearchAreaClick = () => {
    if (!mapRef.current) return;
    const newCenter = mapRef.current.getCenter();

    // Hide the button and update the mapCenter state (which triggers the fetch)
    setShowSearchButton(false);
    setMapCenter({ lat: newCenter.lat, lng: newCenter.lng });
  };

  // ==========================================
  // 2. HTML GENERATOR
  // ==========================================
  function createPopupHTML(user: MapUser) {
    const tagsHtml = user.tags
      .slice(0, 3)
      .map(
        (tag) =>
          `<span style="background: #FFF1F2; color: #E11D48; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; display: inline-block; margin-right: 4px; margin-bottom: 4px;">#${tag}</span>`
      )
      .join("");

    const banIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="m4.9 4.9 14.2 14.2"></path>
      </svg>
    `;

    const rose500 = "#f43f5e";
    const gray400 = "#9ca3af";
    const isBlocked = user.i_blocked_them;
    const iconColor = isBlocked ? rose500 : gray400;

    const blockedStyles = isBlocked
      ? "filter: grayscale(100%); opacity: 0.55; pointer-events: none;"
      : "";

    return `
      <div style="position: relative; padding: 0; min-width: 220px; font-family: system-ui, -apple-system, sans-serif; border-radius: 12px; overflow: hidden; background: white;">
        <div style="${blockedStyles} transition: all 0.3s ease;">
          <div style="background: linear-gradient(to right, #f43f5e, #fb923c); height: 80px;"></div>

          <div style="padding: 16px; text-align: center; margin-top: -50px;">
            <div style="display: flex; justify-content: center;">
              <img src="${
                user.profileImage || "/default-avatar.png"
              }" style="width: 80px; height: 80px; border-radius: 50%; border: 4px solid white; object-fit: cover; background: white; box-shadow: 0 6px 12px rgba(0,0,0,0.2);" />
            </div>
           <h3 style="margin: 10px 0 4px 0; font-size: 18px; font-weight: 700; color: #1f2937; display: flex; align-items: center; justify-content: center; gap: 4px;">
              ${user.first_name}, ${user.age}
              ${getGenderSVG(user.gender)}
            </h3>
            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">📍 ${
              user.distance
            }</p>
            <div style="text-align: left; margin-bottom: 12px;">${tagsHtml}</div>

            <div style="display: flex; justify-content: center; margin: 12px 0;">
              <button id="like-${
                user.userId
              }" style="width: 46px; height: 46px; border-radius: 50%; border: none; font-size: 26px; cursor: pointer; color: white;  background: ${
      user.i_liked_them
        ? "linear-gradient(to right, #6b7280, #4b5563)"
        : "linear-gradient(to right, #f43f5e, #fb923c)"
    };">
                ${user.i_liked_them ? "💔" : "❤️"}
              </button>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f3f4f6; padding-top: 10px; margin-top: 10px;">
              <span style="font-size: 13px; font-weight: 600; color: #4b5563;">⭐ ${
                user.fame_rating
              }</span>
              <button id="view-${
                user.userId
              }" style="background: linear-gradient(to right, #f43f5e, #fb923c); color: white; border: none; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer;">
                View
              </button>
            </div>
          </div>
        </div>

        <button id="block-${user.userId}"
          title="${isBlocked ? "Unblock user" : "Block user"}"
          style="position: absolute; top: 10px; right: 10px; width: 32px; height: 32px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; background: white; color: ${iconColor}; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.15); transition: color 0.2s ease-in-out; z-index: 10;"
          onmouseover="this.style.color='${rose500}'"
          onmouseout="this.style.color='${iconColor}'"
        >
          ${banIcon}
        </button>
      </div>
    `;
  }

  function attachPopupEvents(user: MapUser, popup: mapboxgl.Popup) {
    popup.on("open", () => {
      const likeBtn = document.getElementById(`like-${user.userId}`);
      const blockBtn = document.getElementById(`block-${user.userId}`);
      const viewBtn = document.getElementById(`view-${user.userId}`);

      if (viewBtn) viewBtn.onclick = () => handleShowInfo(user);
      if (likeBtn) {
        likeBtn.onclick = async () => {
          if (user.i_blocked_them) return;
          const newLiked = !user.i_liked_them;
          if (newLiked) await handleLike(user.userId);
          else await handleUnlike(user.userId);
          updateLike(user.userId, newLiked);
        };
      }
      if (blockBtn) {
        blockBtn.onclick = async () => {
          const newBlocked = !user.i_blocked_them;
          if (newBlocked) await handleBlock(user.userId);
          else await handleUnblock(user.userId);
          updateBlock(user.userId, newBlocked);
        };
      }
    });
  }

  // ==========================================
  // 3. FETCH DATA & MAP EFFECTS
  // ==========================================
  useEffect(() => {
    const isFirefox = navigator.userAgent.toLowerCase().includes("firefox");
    if (isFirefox) {
      return;
    }
    const fetchInitialLocation = async () => {
      try {
        const res = await fetchWithAuth("/profile/me");
        if (res.status === 404) return router.push("profile/setup");
        const { latitude, longitude } = await res.json();
        setMapCenter({ lat: latitude, lng: longitude });
      } catch (err) {
        console.error("Failed to get initial location", err);
      }
    };
    fetchInitialLocation();
  }, [router]);

  useEffect(() => {
    const isFirefox = navigator.userAgent.toLowerCase().includes("firefox");
    if (isFirefox) {
      return;
    }
    if (!mapCenter) return;

    const fetchAreaUsers = async () => {
      setIsSearchingArea(true);
      try {
        const response = await fetchWithAuth(
          `/map?lat=${mapCenter.lat}&lng=${mapCenter.lng}`
        );
        if (!response.ok) throw new Error("Failed to fetch map data");

        const data = await response.json();
        setUsers(data);
      } catch (err) {
        console.error(err);
        setError("Could not load users on the map.");
      } finally {
        setLoading(false);
        setIsSearchingArea(false);
      }
    };

    fetchAreaUsers();
  }, [mapCenter, router]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || loading) return;

    Object.keys(markersRef.current).forEach((id) => {
      const userId = parseInt(id);
      if (!users.find((u) => u.userId === userId)) {
        markersRef.current[userId].remove();
        delete markersRef.current[userId];
      }
    });

    users.forEach((user) => {
      const popupHTML = createPopupHTML(user);

      if (markersRef.current[user.userId]) {
        const marker = markersRef.current[user.userId];
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: false,
          maxWidth: "300px",
        }).setHTML(popupHTML);
        marker.setPopup(popup);
        attachPopupEvents(user, popup);
        return;
      }

      const el = document.createElement("div");
      el.className = "marker-container";
      el.style.width = "48px";
      el.style.height = "48px";
      el.style.borderRadius = "50%";
      el.style.backgroundImage = `url(${
        user.profileImage || "/default-avatar.png"
      })`;
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
      el.style.border = "3px solid white";
      el.style.boxShadow = "0 4px 6px rgba(0,0,0,0.3)";
      el.style.cursor = "pointer";

      if (user.is_online) {
        const status = document.createElement("div");
        status.style.position = "absolute";
        status.style.bottom = "-2px";
        status.style.right = "-2px";
        status.style.width = "12px";
        status.style.height = "12px";
        status.style.backgroundColor = "#10B981";
        status.style.border = "2px solid white";
        status.style.borderRadius = "50%";
        el.appendChild(status);
      }

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        maxWidth: "300px",
      }).setHTML(popupHTML);
      attachPopupEvents(user, popup);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([user.longitude, user.latitude])
        .setPopup(popup)
        .addTo(map);

      markersRef.current[user.userId] = marker;
    });
  }, [users, loading]);

  useEffect(() => {
    const isFirefox = navigator.userAgent.toLowerCase().includes("firefox");
    if (isFirefox) {
      return;
    }
    const initMap = async () => {
      if (!mapContainerRef.current || mapRef.current || !mapCenter) return;
      if (
        typeof mapCenter.lat !== "number" ||
        typeof mapCenter.lng !== "number" ||
        isNaN(mapCenter.lat) ||
        isNaN(mapCenter.lng)
      ) {
        console.warn("Invalid coordinates detected. Redirecting to setup...");
        router.push("/profile/setup");
        return;
      }
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [mapCenter.lng, mapCenter.lat],
        zoom: 13,
        pitch: 60,
        bearing: -20,
        antialias: true, // 🔥 Kept false for high performance!
      });

      map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

      map.on("load", () => {
        map.resize();
        const layers = map.getStyle().layers;
        const labelLayerId = layers?.find(
          (layer) => layer.type === "symbol" && layer.layout?.["text-field"]
        )?.id;

        map.addLayer(
          {
            id: "3d-buildings",
            source: "composite",
            "source-layer": "building",
            filter: ["==", "extrude", "true"],
            type: "fill-extrusion",
            minzoom: 15,
            paint: {
              "fill-extrusion-color": "#aaa",
              "fill-extrusion-height": [
                "interpolate",
                ["linear"],
                ["zoom"],
                15,
                0,
                15.05,
                ["get", "height"],
              ],
              "fill-extrusion-base": [
                "interpolate",
                ["linear"],
                ["zoom"],
                15,
                0,
                15.05,
                ["get", "min_height"],
              ],
              "fill-extrusion-opacity": 0.6,
            },
          },
          labelLayerId
        );
      });

      // 🔥 Trigger the "Search this area" button ONLY when the user manually drags/moves the map
      map.on("moveend", (e) => {
        // e.originalEvent ensures it only fires on user interaction, not initial load
        if (e.originalEvent) {
          setShowSearchButton(true);
        }
      });

      mapRef.current = map;
    };
    initMap();
  }, [mapCenter]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <main className="flex-1 relative w-full h-full overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
            <Loader2 className="animate-spin text-rose-500 mb-4" size={40} />
            <p className="text-gray-600 font-medium">
              Finding matches nearby...
            </p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-50">
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 shadow-sm">
              {error}
            </div>
          </div>
        )}

        {/* 🔥 Sleek Interactive UI Elements */}
        <div className="absolute top-6 left-0 right-0 z-20 flex flex-col items-center pointer-events-none gap-3">
          {/* Searching Area Spinner Pill */}
          {isSearchingArea && !loading && (
            <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-gray-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 pointer-events-auto">
              <Loader2 className="animate-spin text-rose-500" size={16} />
              <span className="text-sm font-bold text-gray-700">
                Searching area...
              </span>
            </div>
          )}

          {/* "Search this area" Button */}
          {showSearchButton && !isSearchingArea && !loading && (
            <button
              onClick={handleSearchAreaClick}
              className="bg-white px-5 py-2.5 rounded-full shadow-lg border border-gray-200 text-sm font-bold text-rose-500 hover:bg-rose-50 hover:border-rose-100 flex items-center gap-2 transition-all active:scale-95 animate-in fade-in slide-in-from-top-4 pointer-events-auto"
            >
              <Search size={16} />
              Search this area
            </button>
          )}
        </div>

        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

        <style
          dangerouslySetInnerHTML={{
            __html: `
            .mapboxgl-popup-content {
              padding: 0 !important;
              border-radius: 12px !important;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2) !important;
              border: none !important;
            }
            .mapboxgl-popup-tip { border-top-color: white !important; }
          `,
          }}
        />
      </main>

      {selectedUser && (
        <ProfileModal
          showModal={showModal}
          setShowModal={setShowModal}
          isModalLoading={isModalLoading}
          profile={selectedUser}
        />
      )}
    </div>
  );
}
