import { apiClient } from "@/lib/api";

export type AuthUser = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  isStaff: boolean;
  isSuperuser: boolean;
  departmentId?: number | null;
  departmentName?: string | null;
  canManageDepartment?: boolean;
  staffRole?: string;
  staffProfileId?: number | null;
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  purpose: "personal" | "manager" | "invite";
  metadata?: Record<string, unknown>;
};

export async function login(username = "", password = "") {
  return apiClient.post<{ user: AuthUser }>("/auth/login/", {
    username,
    password
  });
}

export async function register(payload: RegisterPayload) {
  return apiClient.post<{ message: string; user: AuthUser }>("/auth/register/", payload);
}

export async function logout() {
  return apiClient.post<{ message: string }>("/auth/logout/");
}

export async function getMe() {
  return apiClient.get<{ user: AuthUser }>("/auth/me/");
}
