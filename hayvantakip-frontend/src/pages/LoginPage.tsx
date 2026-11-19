import React, { useState } from "react";
import { axiosClient } from "../api/axiosClient";
import { Home, Lock, User, LogIn } from "lucide-react";
import { toast } from "sonner";

interface LoginPageProps {
  onLoginSuccess: (token: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    try {
      setLoading(true);
      const response = await axiosClient.post("/auth/login", {
        username: username.trim(),
        password: password.trim(),
      });

      const { token } = response.data;
      localStorage.setItem("auth_token", token);
      toast.success("Giriş başarılı!");
      onLoginSuccess(token);
    } catch (err: any) {
      const msg =
        err.response?.data?.message || "Kullanıcı adı veya şifre hatalı!";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-gray-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full p-8">
        {/* Logo & Başlık */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-emerald-700 p-3.5 rounded-2xl shadow-md mb-4">
            <Home className="h-8 w-8 text-emerald-100" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            Çiftlik Takip Sistemi
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Yönetim paneline erişmek için giriş yapın
          </p>
        </div>

        {/* Giriş Formu */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Kullanıcı Adı
            </label>
            <div className="relative">
              <User className="h-4 w-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                autoComplete="username"
                placeholder="Kullanıcı adınız"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Şifre
            </label>
            <div className="relative">
              <Lock className="h-4 w-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            <LogIn className="h-4 w-4" />
            {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      </div>
    </div>
  );
};
