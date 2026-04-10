import React from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean; // Changes the confirm button to red if true
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isDestructive = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    // Backdrop with blur
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      

      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-black tracking-tight text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors active:scale-95"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl font-bold text-white shadow-md hover:shadow-lg transition-all active:scale-95 ${
              isDestructive
                ? "bg-rose-500 hover:bg-rose-600"
                : "bg-gray-900 hover:bg-gray-800"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
      
    </div>
  );
}