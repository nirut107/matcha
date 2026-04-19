// components/PhotoEditorModal.tsx
"use client";

import React, { useState, useCallback } from "react";
import { X, RotateCw, Loader2 } from "lucide-react";
import { getEditedImage } from "@/lib/imageUtils";
import Cropper, { Area } from "react-easy-crop";

interface PhotoEditorModalProps {
  src: string;
  onClose: () => void;
  onSave: (file: File, url: string) => void;
}

const FILTERS = [
  { name: "Normal", value: "none" },
  { name: "Warm", value: "sepia(0.5) contrast(1.1)" },
  { name: "Neon", value: "hue-rotate(180deg) saturate(1.5)" }, // Renamed from Invert
  { name: "B&W", value: "grayscale(1)" },
  { name: "Pop", value: "contrast(1.2) saturate(1.5)" },
];

export default function PhotoEditorModal({ src, onClose, onSave }: PhotoEditorModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [filter, setFilter] = useState("none");
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setLoading(true);
    try {
      const result = await getEditedImage(src, croppedAreaPixels, rotation, filter);
      if (result) onSave(result.file, result.url);
    } catch (e) {
      console.error("Editing failed", e);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-sm p-2 sm:p-4">
      {/* Changed: Added flex-col and max-h-[95vh] to prevent overflowing iPhone SE screens */}
      <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[95vh]">

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b shrink-0">
          <h3 className="font-black text-gray-800">Edit Photo</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Cropper Area - Changed: h-[400px] to h-[30vh] or min-h-[250px] for responsiveness */}
        <div className="relative h-[35vh] min-h-[280px] w-full bg-gray-900 shrink-0">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={3 / 4} // Matched your Matcha gallery aspect ratio!
            onCropChange={setCrop}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            style={{ mediaStyle: { filter: filter } }}
          />
        </div>

        {/* Controls - Changed: Added overflow-y-auto so smaller screens can scroll the buttons */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Zoom & Rotate */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Zoom</label>
              <input
                type="range" min={1} max={3} step={0.1} value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-rose-500 h-6"
              />
            </div>
            <button
              onClick={() => setRotation((r) => r + 90)}
              className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 text-gray-600"
            >
              <RotateCw size={18} />
            </button>
          </div>

          {/* Filters */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Filters</label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {FILTERS.map((f) => (
                <button
                  key={f.name}
                  onClick={() => setFilter(f.value)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border-2 ${
                    filter === f.value
                      ? "bg-rose-500 border-rose-500 text-white"
                      : "bg-white border-gray-100 text-gray-600 hover:border-rose-200"
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-gradient-to-r from-rose-500 to-orange-400 text-white font-black py-4 rounded-2xl shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" /> : "APPLY & SAVE"}
          </button>
        </div>
      </div>
    </div>
  );
}
