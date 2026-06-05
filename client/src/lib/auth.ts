// Auth helpers — token stored in React state only (no localStorage/cookies)
// Token is passed via React context throughout the app

export type Role = "admin" | "lector";

export interface AuthUser {
    id: number;
    username: string;
    role: Role;
}

export interface AuthState {
    user: AuthUser | null;
    token: string | null;
}

// Pages accessible by role
export const ROLE_ROUTES: Record<Role, string[]> = {
    admin: ["/", "/datos", "/graficas", "/configuracion"],
    lector: ["/", "/graficas"],
};

export function canAccess(role: Role | undefined, path: string): boolean {
    if (!role) return false;
    const allowed = ROLE_ROUTES[role] ?? [];
    return allowed.some((r) => path === r || path.startsWith(r + "/"));
}