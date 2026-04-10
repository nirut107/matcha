"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Header from "@/components/Header"; // Adjust path if necessary
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

// Add your Mapbox token to your .env.local file as NEXT_PUBLIC_MAPBOX_TOKEN
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface MapUser {
  userId: number;
  first_name: string;
  age: number;
  biography: string;
  tags: string[];
  images: string[];
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

  const [users, setUsers] = useState<MapUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch users from backend
  useEffect(() => {
    const fetchMapData = async () => {
      try {
        // Adjust this endpoint to wherever your backend serves the map user data
        const response = await fetchWithAuth("/map", {
          method: "GET",
        });
        console.log(response,"map response")
        if (response.status === 403) {
          router.push("profile/setup");
        }
        if (!response.ok) throw new Error("Failed to fetch map data");

        const data = await response.json();
        // Filter out blocked users just in case the backend didn't
        setUsers(data.filter((u: MapUser) => !u.i_blocked_them));
      } catch (err) {
        console.error(err);
        setError("Could not load users on the map.");
      } finally {
        setLoading(false);
      }
    };

    fetchMapData();
  }, []);

  // Initialize Mapbox
  useEffect(() => {
    if (loading || error || !mapContainerRef.current) return;

    // Center map on the first user, or a default location
    const initialCenter: [number, number] = users.length > 0
      ? [users[0].longitude, users[0].latitude]
      : [-74.006, 40.7128]; // Default to NYC if empty

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11", // Light theme to match the app's clean UI
      center: initialCenter,
      zoom: 13,
      pitch: 60, // Tilts the map for a 3D effect
      bearing: -20, // Rotates the map slightly
      antialias: true, // Smoothes 3D edges
    });

    mapRef.current = map;

    map.on("load", () => {
      // Add 3D Buildings
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

      // Add User Markers
      users.forEach((user) => {
        // Create a custom DOM element for the marker
        const el = document.createElement("div");
        el.className = "marker-container";

        // Use inline styles to ensure Mapbox renders it correctly regardless of Tailwind purging
        el.style.width = "48px";
        el.style.height = "48px";
        el.style.borderRadius = "50%";
        el.style.backgroundImage = `url(${user.profileImage || '/default-avatar.png'})`;
        el.style.backgroundSize = "cover";
        el.style.backgroundPosition = "center";
        el.style.border = "3px solid white";
        el.style.boxShadow = "0 4px 6px rgba(0,0,0,0.3)";
        el.style.cursor = "pointer";
        el.style.position = "relative";

        // Add online status indicator
        if (user.is_online) {
          const status = document.createElement("div");
          status.style.position = "absolute";
          status.style.bottom = "-2px";
          status.style.right = "-2px";
          status.style.width = "12px";
          status.style.height = "12px";
          status.style.backgroundColor = "#10B981"; // Emerald 500
          status.style.border = "2px solid white";
          status.style.borderRadius = "50%";
          el.appendChild(status);
        }

        // Create the popup HTML structure
        // Styling matches the Matcha theme (Rose/Orange gradients)
        const tagsHtml = user.tags
          .slice(0, 3) // Show max 3 tags
          .map(tag => `<span style="background: #FFF1F2; color: #E11D48; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; display: inline-block; margin-right: 4px; margin-bottom: 4px;">#${tag}</span>`)
          .join("");

        const popupHTML = `
          <div style="padding: 0; min-width: 200px; font-family: system-ui, -apple-system, sans-serif;">
            <div style="background: linear-gradient(to right, #f43f5e, #fb923c); height: 60px; border-radius: 8px 8px 0 0;"></div>
            <div style="padding: 16px; text-align: center; margin-top: -40px;">
              <img src="${user.profileImage || '/default-avatar.png'}" style="width: 64px; height: 64px; border-radius: 50%; border: 4px solid white; object-fit: cover; background: white; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
              <h3 style="margin: 8px 0 4px 0; font-size: 18px; font-weight: 700; color: #1f2937;">
                ${user.first_name}, ${user.age}
              </h3>
              <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 13px;">📍 ${user.distance} away</p>

              <div style="text-align: left; margin-bottom: 12px;">
                ${tagsHtml}
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f3f4f6; padding-top: 12px;">
                <span style="font-size: 13px; font-weight: 600; color: #4b5563;">⭐ ${user.fame_rating} Fame</span>
                <a href="/profile/${user.userId}" style="background: linear-gradient(to right, #f43f5e, #fb923c); color: white; text-decoration: none; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; transition: opacity 0.2s;">View</a>
              </div>
            </div>
          </div>
        `;

        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: false,
          maxWidth: "300px"
        }).setHTML(popupHTML);

        // Attach marker to map
        new mapboxgl.Marker(el)
          .setLngLat([user.longitude, user.latitude])
          .setPopup(popup)
          .addTo(map);
      });
    });

    // Navigation Controls (Zoom, rotate)
    map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    // Cleanup on unmount
    return () => {
      map.remove();
    };
  }, [loading, error, users]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />

      <main className="flex-1 relative w-full h-full">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
            <Loader2 className="animate-spin text-rose-500 mb-4" size={40} />
            <p className="text-gray-600 font-medium">Finding matches nearby...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50">
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 shadow-sm">
              {error}
            </div>
          </div>
        )}

        {/* Map Container */}
        <div
          ref={mapContainerRef}
          className="absolute inset-0 w-full h-full"
        />

        {/* Global style override to clean up the Mapbox popup default styling */}
        <style dangerouslySetInnerHTML={{__html: `
          .mapboxgl-popup-content {
            padding: 0 !important;
            border-radius: 8px !important;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
            border: none !important;
          }
          .mapboxgl-popup-tip {
            border-top-color: white !important;
          }
        `}} />
      </main>
    </div>
  );
}
