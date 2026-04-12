// components/PhotoEditorModal.tsx
"use client";

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { X, Check, RotateCw, Loader2 } from "lucide-react";
import { getEditedImage } from "@/lib/imageUtils"; // Adjust import path

interface PhotoEditorModalProps {
  src: string;
  onClose: () => void;
  onSave: (file: File, url: string) => void;
}

const FILTERS = [
  { name: "Normal", value: "none" },
  { name: "Warm", value: "sepia(0.5) contrast(1.1)" },
  { name: "Cool", value: "hue-rotate(180deg) saturate(1.5)" },
  { name: "B&W", value: "grayscale(1)" },
  { name: "Pop", value: "contrast(1.2) saturate(1.5)" },
];

export default function PhotoEditorModal({ src, onClose, onSave }: PhotoEditorModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [filter, setFilter] = useState("none");
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);

  const onCropComplete = useCallback((_, croppedPixels) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-black text-gray-800">Edit Photo</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="relative h-[400px] w-full bg-gray-900">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1} // Matches your aspect-[3/4] UI!
            onCropChange={setCrop}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            style={{ mediaStyle: { filter: filter } }} // Live filter preview
          />
        </div>

        {/* Controls */}
        <div className="p-6 space-y-6">
          {/* Zoom & Rotate */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold text-gray-500">ZOOM</label>
              <input
                type="range" min={1} max={3} step={0.1} value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>
            <button
              onClick={() => setRotation((r) => r + 90)}
              className="mt-6 p-3 bg-gray-100 rounded-xl hover:bg-gray-200 text-gray-600"
            >
              <RotateCw size={20} />
            </button>
          </div>

          {/* Filters */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500">FILTERS</label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {FILTERS.map((f) => (
                <button
                  key={f.name}
                  onClick={() => setFilter(f.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
                    filter === f.value ? "bg-rose-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
            className="w-full bg-gradient-to-r from-rose-500 to-orange-400 text-white font-black py-4 rounded-xl shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" /> : "APPLY & SAVE"}
          </button>
        </div>
      </div>
    </div>
  );
}
