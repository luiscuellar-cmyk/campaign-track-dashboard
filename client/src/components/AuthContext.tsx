import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { AuthUser } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

interface AuthContextValue {
    user: AuthUser | null;
    token: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);

    const login = useCallback(async (username: string, password: string) => {
        const res = await apiRequest("POST", "/api/auth/login", { username, password });
        if (!res.ok) {
            const body = await res.json();
            throw new Error(body.error || "Error al iniciar sesión");
        }
        const data = await res.json();
        setToken(data.token);
        setUser(data.user);
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}