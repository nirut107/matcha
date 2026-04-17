import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

export const VerifyEmailPage = () => {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter()

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus("error");
        return;
      }
      try {
        await fetchWithAuth("/auth/verify-email", { method: "POST", body: token }),
          setStatus("success");
        setTimeout(() => router.push("/login"), 3000);
      } catch (err) {
        setStatus("error");
      }
    };
    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
        {status === "loading" && (
          <div className="animate-pulse">
            <div className="text-4xl mb-4">⏳</div>
            <h2 className="text-xl font-bold text-gray-800">
              Verifying your email...
            </h2>
          </div>
        )}

        {status === "success" && (
          <div className="animate-bounce-in">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-500">Verified!</h2>
            <p className="text-gray-500 mt-2">Redirecting to login...</p>
          </div>
        )}

        {status === "error" && (
          <div>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-500">Invalid Link</h2>
            <p className="text-gray-500 mt-2">
              The link is expired or incorrect.
            </p>
            <button
              onClick={() => router.push("/register")}
              className="mt-6 bg-pink-500 text-white px-6 py-2 rounded-xl font-bold"
            >
              Go to Register
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
