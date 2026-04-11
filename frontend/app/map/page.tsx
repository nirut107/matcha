"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Header from "@/components/Header";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import ProfileModal from "@/components/ProfileModal";

// Add your Mapbox token to your .env.local file as NEXT_PUBLIC_MAPBOX_TOKEN
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

type Image = {
  url: string;
  position: number;
};

interface MapUser {
  userId: number;
  first_name: string;
  age: number;
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
  const [selectedUser, setSelectedUser] = useState<MapUser | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  // ==========================================
  // 1. HELPER FUNCTIONS (Moved outside the loop!)
  // ==========================================
  const handleShowInfo = async (user: MapUser) => {
    setSelectedUser(user);
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
          ? { ...u, i_blocked_them: blocked, i_liked_them: blocked ? false : u.i_liked_them }
          : u
      )
    );
  };

  const handleLike = async (userId: number) => {
    console.log("like", userId);
    // await fetchWithAuth(`/swipe/like`, { method: "POST", body: JSON.stringify({ targetId: userId }) });
  };

  const handleUnlike = async (userId: number) => {
    console.log("unlike", userId);
    // await fetchWithAuth(`/swipe/unlike`, { method: "POST", body: JSON.stringify({ targetId: userId }) });
  };

  const handleBlock = async (userId: number) => {
    console.log("block", userId);
    // await fetchWithAuth(`/block/${userId}`, { method: "POST" });
  };

  const handleUnblock = async (userId: number) => {
    console.log("unblock", userId);
    // await fetchWithAuth(`/block/${userId}`, { method: "DELETE" });
  };

  // ==========================================
  // 2. HTML GENERATOR (Only written ONCE)
  // ==========================================
  function createPopupHTML(user: MapUser) {
    const tagsHtml = user.tags
      .slice(0, 3)
      .map(
        (tag) =>
          `<span style="background: #FFF1F2; color: #E11D48; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; display: inline-block; margin-right: 4px; margin-bottom: 4px;">#${tag}</span>`
      )
      .join("");

    return `
      <div style="position: relative; padding: 0; min-width: 220px; font-family: system-ui, -apple-system, sans-serif; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(to right, #f43f5e, #fb923c); height: 80px;"></div>
        
        <button id="block-${user.userId}" style="position: absolute; top: 10px; right: 10px; width: 36px; height: 36px; border-radius: 50%; border: none; background: ${
          user.i_blocked_them ? "linear-gradient(to right, #10b981, #059669)" : "rgba(0,0,0,0.6)"
        }; color: white; font-size: 16px; cursor: pointer;">
          ${user.i_blocked_them ? "🔓" : "🚫"}
        </button>

        <div style="padding: 16px; text-align: center; margin-top: -50px;">
          <div style="display: flex; justify-content: center;">
            <img src="${user.profileImage || "/default-avatar.png"}" style="width: 80px; height: 80px; border-radius: 50%; border: 4px solid white; object-fit: cover; background: white; box-shadow: 0 6px 12px rgba(0,0,0,0.2);" />
          </div>

          <h3 style="margin: 10px 0 4px 0; font-size: 18px; font-weight: 700; color: #1f2937;">
            ${user.first_name}, ${user.age}
          </h3>

          <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">📍 ${user.distance}</p>

          <div style="text-align: left; margin-bottom: 12px;">${tagsHtml}</div>

          <div style="display: flex; justify-content: center; margin: 12px 0;">
            <button id="like-${user.userId}" style="width: 46px; height: 46px; border-radius: 50%; border: none; font-size: 26px; cursor: pointer; color: white; box-shadow: 0 8px 20px rgba(0,0,0,0.25); background: ${
              user.i_liked_them ? "linear-gradient(to right, #6b7280, #4b5563)" : "linear-gradient(to right, #f43f5e, #fb923c)"
            };">
              ${user.i_liked_them ? "💔" : "❤️"}
            </button>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f3f4f6; padding-top: 10px; margin-top: 10px;">
            <span style="font-size: 13px; font-weight: 600; color: #4b5563;">⭐ ${user.fame_rating}</span>
            <button id="view-${user.userId}" style="background: linear-gradient(to right, #f43f5e, #fb923c); color: white; border: none; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer;">
              View
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Bind the DOM events when Mapbox opens the popup
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
    const fetchMapData = async () => {
      try {
        const res1 = await fetchWithAuth("/profile/me");
        if (res1.status === 403) return router.push("profile/setup");
        
        const { latitude, longitude } = await res1.json();
        
        const response = await fetchWithAuth(`/map?lat=${latitude}&lng=${longitude}`);
        if (response.status === 403) return router.push("profile/setup");
        if (!response.ok) throw new Error("Failed to fetch map data");

        const data = await response.json();
        setUsers(data.filter((u: MapUser) => !u.i_blocked_them));
      } catch (err) {
        console.error(err);
        setError("Could not load users on the map.");
      } finally {
        setLoading(false);
      }
    };

    fetchMapData();
  }, [router]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || loading) return;

    if (users.length > 0) {
      map.easeTo({ center: [users[0].longitude, users[0].latitude] });
    }

    Object.keys(markersRef.current).forEach((id) => {
      const userId = parseInt(id);
      if (!users.find((u) => u.userId === userId)) {
        markersRef.current[userId].remove();
        delete markersRef.current[userId];
      }
    });

    users.forEach((user) => {
      // Create the popup ONCE using the generator function
      const popupHTML = createPopupHTML(user);

      if (markersRef.current[user.userId]) {
        // If marker exists, just update its HTML and re-attach events
        const marker = markersRef.current[user.userId];
        const popup = new mapboxgl.Popup({ offset: 25, closeButton: false, maxWidth: "300px" }).setHTML(popupHTML);
        marker.setPopup(popup);
        attachPopupEvents(user, popup);
        return;
      }

      // If marker is new, create it
      const el = document.createElement("div");
      el.className = "marker-container";
      el.style.width = "48px";
      el.style.height = "48px";
      el.style.borderRadius = "50%";
      el.style.backgroundImage = `url(${user.profileImage || "/default-avatar.png"})`;
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

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false, maxWidth: "300px" }).setHTML(popupHTML);
      attachPopupEvents(user, popup);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([user.longitude, user.latitude])
        .setPopup(popup)
        .addTo(map);

      markersRef.current[user.userId] = marker;
    });
  }, [users, loading]);

  useEffect(() => {
    const initMap = async () => {
      if (!mapContainerRef.current || mapRef.current) return;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [-74.006, 40.7128], 
        zoom: 13,
        pitch: 60,
        bearing: -20,
        antialias: true,
      });

      map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

      map.on("load", () => {
        const layers = map.getStyle().layers;
        const labelLayerId = layers?.find((layer) => layer.type === "symbol" && layer.layout?.["text-field"])?.id;

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
              "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 15, 0, 15.05, ["get", "height"]],
              "fill-extrusion-base": ["interpolate", ["linear"], ["zoom"], 15, 0, 15.05, ["get", "min_height"]],
              "fill-extrusion-opacity": 0.6,
            },
          },
          labelLayerId
        );
      });

      mapRef.current = map;
    };
    initMap();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <main className="flex-1 relative w-full h-full overflow-hidden">
        {/* ... Loading and Error UI remain exactly the same ... */}
        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
            <Loader2 className="animate-spin text-rose-500 mb-4" size={40} />
            <p className="text-gray-600 font-medium">Finding matches nearby...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-50">
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 shadow-sm">{error}</div>
          </div>
        )}

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