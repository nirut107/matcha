"use client";
import { useRouter } from "next/navigation";
import { MessageCircle, Heart, Sparkles, X, Flame } from "lucide-react";
import { usePathname } from "next/navigation";

type MatchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  match: {
    userName: string;
    userImage?: string;
  } | null;
};

export default function MatchModal({
  isOpen,
  onClose,
  match,
}: MatchModalProps) {
  const router = useRouter();
  const pathname = usePathname();

  if (!isOpen || !match) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] p-8 sm:p-10 text-center shadow-2xl max-w-sm w-full relative overflow-hidden animate-in zoom-in-95 duration-500 spring">
        {/* Decorative Background Blob */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-48 bg-gradient-to-b from-rose-100 to-transparent opacity-50 pointer-events-none" />

        {/* Close Button (Optional, but good UX) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Floating Heart Icon */}
        <div className="flex justify-center mb-6 relative z-10">
          <div className="relative">
            {match.userImage ? (
              <img
                src={match.userImage}
                className="w-32 h-32 rounded-full object-cover border-[6px] border-white shadow-[0_0_30px_rgba(244,63,94,0.3)] animate-pulse-slow"
                alt={match.userName}
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-rose-500 to-orange-400 flex items-center justify-center border-[6px] border-white shadow-[0_0_30px_rgba(244,63,94,0.3)]">
                <Flame
                  size={48}
                  // className="sm:w-6 sm:h-6"
                  color="white"
                  fill="white"
                />
              </div>
            )}

            {/* Tiny badge on the image */}
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-rose-500 to-orange-400 p-2.5 rounded-full border-4 border-white shadow-lg animate-bounce">
              <Heart className="fill-white text-white" size={12} />
            </div>
          </div>
        </div>

        <h1 className="text-4xl font-black mb-3 tracking-tight">
          <span className="bg-gradient-to-r from-rose-500 to-orange-400 bg-clip-text text-transparent">
            It's a Match!
          </span>
        </h1>

        <p className="text-gray-500 mb-8 text-base px-2">
          You and{" "}
          <span className="font-black text-gray-900">{match.userName}</span>{" "}
          just liked each other. Don't keep them waiting!{" "}
          <Sparkles className="inline text-yellow-400" size={16} />
        </p>

        {/* Stacked Buttons for better Mobile Tap Targets */}
        <div className="flex flex-col gap-3 relative z-10">
          <button
            onClick={() => {
              onClose();
              if (pathname !== "/chat") {
                router.push("/chat");
              } else {
                router.push(`/chat?reload=${Date.now()}`);
              }
            }}
            className="w-full bg-gradient-to-r from-rose-500 to-orange-400 text-white py-4 rounded-2xl font-black tracking-widest uppercase text-sm shadow-lg shadow-rose-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle size={18} className="fill-white/20" />
            Say Hello
          </button>

          <button
            onClick={onClose}
            className="w-full bg-rose-50 text-rose-500 hover:bg-rose-100 py-4 rounded-2xl font-bold transition-colors"
          >
            Keep Swiping
          </button>
        </div>
      </div>
    </div>
  );
}
