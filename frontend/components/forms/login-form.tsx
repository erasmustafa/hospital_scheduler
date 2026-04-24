"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

const DASHBOARD_LOADING_KEY = "medishift-dashboard-loading";

type LoginFormProps = {
  onSubmitStart?: () => void;
  onSubmitError?: () => void;
};

export function LoginForm({ onSubmitStart, onSubmitError }: LoginFormProps) {
  const router = useRouter();
  const { login, loading } = useAuth();
  const [rememberMe, setRememberMe] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.sessionStorage.removeItem(DASHBOARD_LOADING_KEY);
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    onSubmitStart?.();
    window.sessionStorage.setItem(DASHBOARD_LOADING_KEY, "1");

    const ok = await login(username, password);
    if (!ok) {
      window.sessionStorage.removeItem(DASHBOARD_LOADING_KEY);
      onSubmitError?.();
      setError("Giris basarisiz. Bilgileri kontrol edip tekrar deneyin.");
      return;
    }

    document.cookie = "hwm_session=1; Path=/; SameSite=Lax";
    router.push("/dashboard");
  };

  return (
    <form className="space-y-3.5" onSubmit={onSubmit}>
      <div>
        <label className="mb-2 block text-[15px] font-bold text-[#52627d]">Kullanıcı adı</label>
        <div className="relative">
          <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#88a0c6]" />
          <Input
            name="username"
            autoComplete="username"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="username"
            className="h-[58px] rounded-[16px] border-[#dfe6f2] bg-white pl-[52px] pr-4 text-base text-[#27364d] shadow-[0_4px_12px_rgba(34,56,101,0.04)] placeholder:text-[#9ca8bb] focus-visible:ring-[#7ca0ff]/50"
          />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-[15px] font-bold text-[#52627d]">Şifre</label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#88a0c6]" />
          <Input
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="password"
            className="h-[58px] rounded-[16px] border-[#dfe6f2] bg-white pl-[52px] pr-12 text-base text-[#27364d] shadow-[0_4px_12px_rgba(34,56,101,0.04)] placeholder:text-[#9ca8bb] focus-visible:ring-[#7ca0ff]/50"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94a1b6] transition hover:text-[#6f7d96]"
            aria-label={showPassword ? "Sifreyi gizle" : "Sifreyi goster"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <div className="mb-[18px] mt-3 flex items-center justify-between gap-4 text-sm">
        <label className="flex items-center gap-2.5 text-[#5c6b84]">
          <input
            type="checkbox"
            name="remember_me"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="h-[18px] w-[18px] rounded border-slate-300 text-[#3f66ea] focus:ring-[#3f66ea]"
          />
          <span>Beni hatırla</span>
        </label>
        <button type="button" className="font-bold text-[#3f66ea] hover:underline">
          Şifremi unuttum?
        </button>
      </div>
      {error ? (
        <p className="rounded-xl border border-[#f3c9c9] bg-[#fff4f4] px-4 py-3 text-sm text-[#b94a48]">
          {error}
        </p>
      ) : null}
      <Button
        className="h-[58px] w-full rounded-[16px] bg-[linear-gradient(180deg,#4a72ef_0%,#3d65e8_100%)] text-[19px] font-bold shadow-[0_14px_30px_rgba(63,102,234,0.24)] hover:brightness-105"
        type="submit"
        disabled={loading}
      >
        {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
      </Button>
      <div className="relative my-1 text-center text-sm text-[#a1aec1]">
        <span className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-[#dfe6f2]" />
        <span className="relative bg-white px-3 font-semibold tracking-[0.06em]">veya</span>
      </div>
      <button
        type="button"
        className="flex h-[54px] w-full items-center justify-center gap-2.5 rounded-[16px] border border-[#dfe6f2] bg-white text-base font-bold text-[#34445e] transition hover:bg-[#f8faff]"
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ea4335_0%,#fbbc05_48%,#34a853_100%)] text-xs font-extrabold text-white">
          G
        </span>
        <span>Google ile Giriş Yap</span>
      </button>
      <button
        type="button"
        className="flex h-[54px] w-full items-center justify-center gap-2.5 rounded-[16px] border border-[#dfe6f2] bg-white text-base font-bold text-[#34445e] transition hover:bg-[#f8faff]"
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[linear-gradient(135deg,#4477f4_0%,#3058d8_100%)] text-xs font-extrabold text-white">
        S
        </span>
        <span>SSO ile Giriş Yap</span>
      </button>
      <p className="pt-1 text-center text-[15px] text-[#73829a]">
        Hesabınız yok mu?{" "}
        <button type="button" className="font-bold text-[#3f66ea] hover:underline">
          Kayıt Ol
        </button>
      </p>
    </form>
  );
}
