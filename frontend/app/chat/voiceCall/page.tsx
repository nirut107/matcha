"use client";

import { 
  AgoraRTCProvider, 
  useJoin, 
  useLocalCameraTrack, 
  useLocalMicrophoneTrack, 
  useRemoteUsers, 
  RemoteUser, 
  LocalVideoTrack 
} from "agora-rtc-react";
import AgoraRTC from "agora-rtc-sdk-ng";

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

export default function VideoCall({ channelName, token }: { channelName: string, token: string }) {
  return (
    <AgoraRTCProvider client={client}>
      <CallScreen channelName={channelName} token={token} />
    </AgoraRTCProvider>
  );
}

function CallScreen({ channelName, token }: any) {
  const appId = "YOUR_AGORA_APP_ID";
  
  // Join the channel
  useJoin({ appid: appId, channel: channelName, token: token });

  // Setup local tracks (my camera/mic)
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(true);
  const { localCameraTrack } = useLocalCameraTrack(true);
  
  // Get other users in the room
  const remoteUsers = useRemoteUsers();

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        {/* My Video */}
        <div className="w-full h-64 bg-black rounded-lg overflow-hidden">
          <LocalVideoTrack track={localCameraTrack} play />
        </div>

        {/* Their Video */}
        {remoteUsers.map((user) => (
          <div key={user.uid} className="w-full h-64 bg-black rounded-lg overflow-hidden">
            <RemoteUser user={user} playVideo playAudio />
          </div>
        ))}
      </div>
    </div>
  );
}