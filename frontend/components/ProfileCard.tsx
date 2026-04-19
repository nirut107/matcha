import { Mars, Venus, User,Infinity } from "lucide-react";
type Image = {
  url: string;
  is_profile: boolean;
  position: number;
};

type Profile = {
  first_name: string;
  age: number;
  gender: string;
  biography: string;
  tags: string[];
  images: Image[];
  fame_rating: number;
  distance: string;
  is_online: boolean;
  userId: number;
  profileIndex: number;
  profileImage: string;
  create_at: string;
  last_connection: string;
};

export default function ProfileCard({ profile }: { profile: Profile }) {

  const renderGenderIcon = (gender: string) => {
    const g = gender?.toLowerCase();
    if (g === "male") {
      return <Mars size={26} className="text-blue-400 drop-shadow-md" />;
    }
    if (g === "female") {
      return <Venus size={26} className="text-pink-400 drop-shadow-md" />;
    }
    return <Infinity  size={26} className="text-purple-400 drop-shadow-md" />;
  };
  return (
    <div className="relative aspect-[3/4] w-full rounded-[3rem] overflow-hidden shadow-2xl bg-white border-[6px] border-white">
      <img
        src={profile.profileImage}
        className="w-full h-full object-cover"
        alt={profile.first_name}
      />

      {/* BADGES */}
      <div className="absolute top-6 left-6 flex flex-col gap-3">
        <span className="bg-black/30 text-white text-xs px-4 py-1 rounded-full flex items-center gap-2">
          ⭐ {profile.fame_rating}
        </span>
        <span className="bg-black/30 text-white text-xs px-4 py-1 rounded-full flex items-center gap-2">
          📍 {profile.distance}
        </span>
      </div>

      {/* INFO */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 to-transparent text-white">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-3xl font-bold">
            {profile.first_name}, {profile.age}
            {renderGenderIcon(profile.gender)}
          </h2>

          {profile.is_online && (
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          )}
        </div>

        <p className="text-sm mb-4">{profile.biography}</p>

        <div className="flex flex-wrap gap-2">
          {profile.tags.map((tag) => (
            <span key={tag} className="text-xs bg-white/20 px-2 py-1 rounded">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
