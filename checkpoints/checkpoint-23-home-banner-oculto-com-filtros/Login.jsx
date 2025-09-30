import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCurrentUser, useAuthActions } from "@/hooks/useCurrentUser";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const navigate = useNavigate();
  const { currentUser, isLoading } = useCurrentUser();
  const { login } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email, password });
      
      // Verificar se há parâmetro redirect
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      
      if (redirect) {
        window.location.href = redirect;
      } else {
        navigate('/Home');
      }
    } catch (err) {
      setError(err?.message || "Não foi possível autenticar");
    }
    setLoading(false);
  };

  // Se já estiver autenticado, redireciona imediatamente para a rota padrão
  useEffect(() => {
    if (currentUser && !isLoading) {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      
      if (redirect) {
        window.location.href = redirect;
      } else {
        navigate('/Home');
      }
    }
  }, [currentUser, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Entrar</CardTitle>
          <p className="text-sm text-gray-600 text-center">Acesse sua conta para continuar</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Não tem uma conta?{" "}
              <Link to="/CriarConta" className="text-orange-500 hover:text-orange-600 font-medium">
                Cadastre-se
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}