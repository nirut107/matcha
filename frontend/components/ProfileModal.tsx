"use client";

import { X, Star, MapPin } from "lucide-react";

type Image = {
  url: string;
  position: number;
};

type Profile = {
  first_name: string;
  age: number;
  biography: string;
  tags: string[];
  images: Image[];
  fame_rating: number;
  distance: string;
  is_online: boolean;
};

type Props = {
  showModal: boolean;
  setShowModal: (v: boolean) => void;
  isModalLoading: boolean;
  profile: Profile;
};

export default function ProfileModal({
  showModal,
  setShowModal,
  isModalLoading,
  profile,
}: Props) {
  if (!showModal) return null;
  console.log("profile_image:", profile.images)
  return (
    <div className="fixed inset-0 z-70 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-2xl h-[92vh] sm:h-[85vh] overflow-y-auto rounded-t-[3rem] sm:rounded-[3rem] relative shadow-2xl">
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-6 right-6 z-20 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-white sm:text-gray-900 sm:bg-gray-100"
        >
          <X size={24} />
        </button>

        {isModalLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-rose-500"></div>
          </div>
        ) : (
          <div className="pb-12">
            <div className="flex overflow-x-auto snap-x snap-mandatory h-450px bg-gray-100 no-scrollbar">
              {profile.images.map((img, i) => (
                <img
                  key={i}
                    src={img.url}
                //   src={typeof img === "string" ? img : img.url}
                  className="w-full h-full object-cover shrink-0 snap-center"
                  alt="User gallery"
                />
              ))}
            </div>

            <div className="p-8">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-4xl font-black text-gray-900">
                  {profile.first_name}, {profile.age}
                </h2>
                {profile?.is_online && (
                  <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                )}
              </div>

              <div className="flex gap-3 mb-8">
                <span className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2">
                  <Star size={16} className="text-orange-400 fill-orange-400" />
                  {profile?.fame_rating}
                </span>
                <span className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2">
                  <MapPin size={16} className="text-rose-500" />
                  {profile?.distance}
                </span>
              </div>

              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
                About
              </h3>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                {profile?.biography}
              </p>

              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
                Interests
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile?.tags?.map((tag: string) => (
                  <span
                    key={tag}
                    className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-sm font-bold border border-rose-100"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
