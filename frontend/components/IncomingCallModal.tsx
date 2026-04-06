// components/IncomingCallModal.tsx
"use client";

interface IncomingCallProps {
  isOpen: boolean;
  callerName: string;
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCallModal({ isOpen, callerName, onAccept, onDecline }: IncomingCallProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full animate-bounce-short">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📞</span>
        </div>
        
        <h2 className="text-xl font-bold mb-1">{callerName}</h2>
        <p className="text-gray-500 mb-6">Incoming Video Call...</p>

        <div className="flex gap-4 justify-center">
          <button 
            onClick={onDecline}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-semibold transition-colors"
          >
            Decline
          </button>

          <button 
            onClick={onAccept}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-semibold transition-colors animate-pulse"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}