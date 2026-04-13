export interface UserRespone {
  id: number;
  username: string;
  email: string;
  hasGoogle: boolean;
  hasProfile: boolean;
  isSetup: boolean;
}

export interface MatchResponse {
  id: number;
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  is_online: boolean;
  unread_count: number;
  created_at: string; // ISO Date string
  last_connection: string | null;
  profile_picture: string | null;
  last_message: string | null;
  last_message_time: string | null;
  i_blocked_them: boolean;
}
