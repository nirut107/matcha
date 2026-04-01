"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function OAuthSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      localStorage.setItem("token", token);

      // redirect ไปหน้า setup profile
      router.push("/profile/setup");
    } else {
      router.push("/auth/login");
    }
  }, [searchParams, router]);

  return <p>Logging in...</p>;
}
