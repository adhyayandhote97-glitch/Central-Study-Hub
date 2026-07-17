export type UserRole = "student" | "admin";

export interface SessionPayload {
  uid: string;
  role: UserRole;
  [key: string]: unknown;
}

export interface SessionResponse {
  role: UserRole | null;
}
