import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { AuthUser } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

interface AuthContextValue {
    user: AuthUser | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check session on mount
    useEffect(() => {
        apiRequest("GET", "/api/auth/me")
            .then(res => res.json())
            .then(data => setUser(data.user))
            .catch(() => setUser(null))
            .finally(() => setIsLoading(false));
    }, []);

    const login = useCallback(async (username: string, password: string) => {
        const res = await apiRequest("POST", "/api/auth/login", { username, password });
        if (!res.ok) {
            const body = await res.json();
            throw new Error(body.error || "Error al iniciar sesión");
        }
        const data = await res.json();
        setUser(data.user);
    }, []);

    const logout = useCallback(async () => {
        await apiRequest("POST", "/api/auth/logout", {});
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}