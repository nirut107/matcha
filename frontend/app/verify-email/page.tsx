"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus("error");
        return;
      }

      // Start a timer to ensure we show loading for at least 2000ms
      const startTime = Date.now();

      try {
        const res = await fetchWithAuth("/mail/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const result = await res.json();

        const duration = Date.now() - startTime;
        const waitTime = Math.max(0, 2000 - duration);

        setTimeout(() => {
          if (result.error || !res.ok) {
            setStatus("error");
          } else {
            setStatus("success");
            setTimeout(() => router.push("/login"), 3000);
          }
        }, waitTime);
      } catch (err) {
        setTimeout(() => setStatus("error"), 1000);
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 flex items-center justify-center p-6">
      {/* Semi-transparent Glass Container */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] max-w-sm w-full text-center text-white">
        {status === "loading" && (
          <div className="flex flex-col items-center">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-white rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-2xl">
                🍵
              </div>
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-2">
              Brewing Magic...
            </h2>
            <p className="text-white/60 text-sm font-medium">
              Verifying your profile
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl transform rotate-3">
              <span className="text-4xl">💚</span>
            </div>
            <h2 className="text-3xl font-black tracking-tighter mb-2">
              Verified!
            </h2>
            <p className="text-white/80 font-medium mb-6">
              Your Matcha journey starts now.
            </p>
            <div className="flex justify-center gap-1">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-6xl mb-6 drop-shadow-lg">🥀</div>
            <h2 className="text-2xl font-black tracking-tight mb-2 text-white">
              Expired Link
            </h2>
            <p className="text-white/70 text-sm mb-8 leading-relaxed">
              This verification link has turned sour. <br /> Please request a
              new one.
            </p>
            <button
              onClick={() => router.push("/auth/register")}
              className="w-full bg-white text-[#FF416C] py-4 rounded-2xl font-black text-sm tracking-widest hover:bg-opacity-90 active:scale-95 transition-all shadow-xl shadow-black/10"
            >
              RETRY REGISTRATION
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
