import { useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, BarChart3, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login(username.trim(), password);
        } catch (err: any) {
            setError(err.message || "Usuario o contraseña incorrectos");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-background"
            style={{
                background: "radial-gradient(ellipse at 60% 0%, hsl(var(--primary)/0.12) 0%, transparent 60%), hsl(var(--background))",
            }}
        >
            <div className="w-full max-w-sm px-4">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8 gap-2">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/15 ring-1 ring-primary/30">
                        <BarChart3 className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-lg font-semibold tracking-tight">CampaignTrack</h1>
                        <p className="text-xs text-muted-foreground">Dashboard de Pauta</p>
                    </div>
                </div>

                <Card className="border-border/60 shadow-xl shadow-black/10">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base">Iniciar sesión</CardTitle>
                        <CardDescription className="text-xs">
                            Ingresa tus credenciales para acceder al dashboard
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="username" className="text-xs font-medium">Usuario</Label>
                                <Input
                                    id="username"
                                    data-testid="input-username"
                                    type="text"
                                    placeholder="Tu nombre de usuario"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    autoComplete="username"
                                    required
                                    className="h-9 text-sm"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="text-xs font-medium">Contraseña</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        data-testid="input-password"
                                        type={showPass ? "text" : "password"}
                                        placeholder="Tu contraseña"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="current-password"
                                        required
                                        className="h-9 text-sm pr-9"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass((v) => !v)}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <Alert variant="destructive" className="py-2 px-3">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    <AlertDescription className="text-xs ml-1">{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-9 text-sm font-medium"
                                data-testid="button-login"
                                disabled={loading}
                            >
                                {loading ? (
                                    <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Ingresando...</>
                                ) : (
                                    "Ingresar"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-[11px] text-muted-foreground mt-6">
                    Campaña Elecciones 2026 · Acceso restringido
                </p>
            </div>
        </div>
    );
}