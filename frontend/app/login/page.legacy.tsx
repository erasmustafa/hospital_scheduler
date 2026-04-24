"use client";

import Image from "next/image";
import { useState } from "react";
import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  const [showAuthLoading, setShowAuthLoading] = useState(false);

  return (
    <main className="relative min-h-[100vh] min-h-[100dvh] overflow-hidden bg-[linear-gradient(135deg,#3f66ea_0%,#4c75ee_48%,#78a4ff_100%)] p-3 md:p-5">
      <div className="pointer-events-none absolute -right-[120px] -top-[120px] h-[520px] w-[520px] rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-[140px] -left-[80px] h-[420px] w-[420px] rounded-full bg-white/10" />

      <section
        className="relative z-10 mx-auto grid w-full max-w-[1180px] grid-cols-1 overflow-hidden rounded-[38px] border border-white/15 bg-white/10 shadow-[0_36px_90px_rgba(40,74,158,0.24)] backdrop-blur-[12px] lg:grid-cols-[1.18fr_0.82fr]"
        style={{ minHeight: "min(760px, calc(100dvh - 32px))" }}
      >
        <section
          className="relative flex flex-col justify-between bg-[linear-gradient(160deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_100%)] text-white"
          style={{ padding: "clamp(28px, 4vh, 56px) clamp(28px, 3.6vw, 54px) clamp(26px, 3.2vh, 42px)" }}
        >
          <div className="pointer-events-none absolute inset-[34px] hidden rounded-[30px] border border-white/20 lg:block" />

          <div className="relative z-10 max-w-[520px]">
            <div className="mb-6 inline-flex items-center gap-3.5 md:mb-8">
              <Image
                src="/icons/medishift-brand.png"
                alt="MediShift logo"
                width={44}
                height={44}
                unoptimized
              />
              <span className="font-['Plus_Jakarta_Sans','Aptos','Segoe_UI',sans-serif] text-[30px] font-extrabold tracking-[-0.04em]">
                MediShift
              </span>
            </div>
            <h1
              style={{
                margin: "0 0 18px",
                fontFamily: '"Plus Jakarta Sans", "Aptos", "Segoe UI", sans-serif',
                fontSize: "clamp(34px, 4vw, 52px)",
                lineHeight: 1.08,
                fontWeight: 800,
                letterSpacing: "-0.05em",
                maxWidth: 560,
              }}
            >
              Akıllı vardiya planlama, dengeli bir çalışma düzeni.
            </h1>
            <p
              style={{
                margin: 0,
                maxWidth: 500,
                fontSize: "clamp(16px, 2vw, 20px)",
                lineHeight: 1.3,
                color: "rgba(244, 248, 255, 0.86)",
              }}
            >
              Hastane ekiplerinin zamanını daha verimli yönetin, vardiya dağılımını
              kolaylaştırın ve operasyon akışına tek merkezden hakim olun.
            </p>
          </div>

          <div className="relative z-10 mt-3 flex items-end">
            <div className="w-full max-w-[740px] overflow-hidden rounded-[30px] drop-shadow-[0_24px_38px_rgba(34,61,136,0.16)]">
              <Image
                src="/images/medishift-login-preview.png"
                alt="MediShift vardiya plani onizleme"
                width={1024}
                height={768}
                className="h-auto w-full"
                priority
              />
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-4 left-2 hidden h-[66px] w-[96px] bg-[radial-gradient(rgba(255,255,255,0.42)_1.5px,transparent_1.5px)] [background-size:12px_12px] opacity-65 md:block" />
        </section>

        <section className="flex items-center justify-center bg-white px-5 py-6 md:px-7 md:py-8">
          <div className="w-full max-w-[350px]">
            <div className="mb-6 flex items-center gap-3">
              <Image
                src="/icons/medishift-brand.png"
                alt="MediShift logo"
                width={38}
                height={38}
                unoptimized
              />
              <span className="font-['Plus_Jakarta_Sans','Aptos','Segoe_UI',sans-serif] text-[34px] font-extrabold tracking-[-0.05em] text-[#27459f]">
                MediShift
              </span>
            </div>

            <div className="mb-5">
              <h2 className="font-['Plus_Jakarta_Sans','Aptos','Segoe_UI',sans-serif] text-[40px] font-extrabold leading-[1.05] tracking-[-0.05em] text-[#1f3152]">
                Tekrar hoş geldiniz!
              </h2>
              <p className="mt-2 text-[17px] leading-[1.5] text-[#73829a]">
                Hesabınıza giriş yaparak vardiya planlama paneline devam edin.
              </p>
            </div>

            <LoginForm
              onSubmitStart={() => setShowAuthLoading(true)}
              onSubmitError={() => setShowAuthLoading(false)}
            />
          </div>
        </section>
      </section>

      <div
        className={`auth-loading-overlay fixed inset-0 z-[9999] flex items-center justify-center bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.10),transparent_22%),linear-gradient(135deg,rgba(47,84,219,0.92)_0%,rgba(63,102,234,0.94)_54%,rgba(107,151,255,0.96)_100%)] p-6 backdrop-blur-[10px] transition duration-300 ${
          showAuthLoading ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
        }`}
        aria-hidden={!showAuthLoading}
      >
        <div className="auth-loading-card w-full max-w-[420px] rounded-[30px] border border-white/25 bg-white/15 px-7 py-7 text-center text-white shadow-[0_26px_60px_rgba(18,42,104,0.24)]">
          <div className="auth-loading-brand inline-flex items-center gap-3 font-['Plus_Jakarta_Sans','Aptos','Segoe_UI',sans-serif] text-[28px] font-extrabold tracking-[-0.04em]">
            <Image
              src="/icons/medishift-brand.png"
              alt="MediShift"
              width={40}
              height={40}
              className="animate-spin [animation-duration:2.8s]"
              unoptimized
            />
            <span>MediShift</span>
          </div>
          <div className="auth-loading-title mt-4 font-['Plus_Jakarta_Sans','Aptos','Segoe_UI',sans-serif] text-2xl font-extrabold tracking-[-0.04em]">
            Yükleniyor...
          </div>
          <p className="auth-loading-copy mt-2 text-[15px] leading-[1.55] text-[rgba(244,248,255,0.84)]">
            Vardiya planlama ekranı yüklenirken kücük bir hazırlık yapıyoruz.
          </p>
          <div className="login-loader-bar mt-5 h-2.5 overflow-hidden rounded-[999px] bg-white/20">
            <span className="block h-full w-[42%] rounded-[inherit] bg-[linear-gradient(90deg,rgba(255,255,255,0.35),#fff,rgba(255,255,255,0.35))]" />
          </div>
        </div>
      </div>
    </main>
  );
}
