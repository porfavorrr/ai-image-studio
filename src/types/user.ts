export interface PublicUser {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  credits: number;
  role: "user" | "admin";
  createdAt: string;
}

export interface AuthResponse {
  user: PublicUser;
}
