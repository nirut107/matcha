"use client";

import { useEffect, useState } from "react";
import { MOCK_PROFILES } from "../app/dashboard/mockData";

const USE_MOCK = true; // 🔥 toggle here

export function useProfiles() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URLL;
    const fetchProfiles = async () => {
      try {
        if (USE_MOCK) {
          // simulate loading
          await new Promise((res) => setTimeout(res, 500));
          setProfiles(MOCK_PROFILES);
        } else {
          const res = await fetch(`${baseUrl}/profiles/suggestions`);
          const data = await res.json();
          setProfiles(data);
        }
      } catch (err) {
        console.error("Error loading profiles:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  return { profiles, loading };
}
