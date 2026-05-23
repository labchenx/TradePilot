export interface JwtPayload {
  sub: string;
  userId: string;
  email: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  createdAt?: string;
}

export interface RequestWithUser {
  user?: CurrentUser;
  headers: Record<string, string | string[] | undefined>;
}
