export interface PublicUser {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: PublicUser;
}
