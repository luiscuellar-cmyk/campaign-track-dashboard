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

    useEffect(() => {
        fetch("/api/auth/me", { credentials: "include" })
            .then((res) => {
                if (!res.ok) throw new Error("Not authenticated");
                return res.json();
            })
            .then((data) => setUser(data.user))
            .catch(() => setUser(null))
            .finally(() => setIsLoading(false));
    }, []);

    const login = useCallback(async (username: string, password: string) => {
        const res = await apiRequest("POST", "/api/auth/login", { username, password });
        const data = await res.json();
        setUser(data.user);
    }, []);

    const logout = useCallback(async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
        } catch {}
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