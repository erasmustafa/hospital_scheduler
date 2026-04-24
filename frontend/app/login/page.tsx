"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  const [showAuthLoading, setShowAuthLoading] = useState(false);

  return (
    <main className="relative grid min-h-[100vh] min-h-[100dvh] place-items-center overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.18),transparent_24%),linear-gradient(135deg,#3f66ea_0%,#4c75ee_48%,#78a4ff_100%)] px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-7">
      <div className="pointer-events-none absolute -right-[120px] -top-[120px] h-[520px] w-[520px] rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-[140px] -left-[80px] h-[420px] w-[420px] rounded-full bg-white/10" />
      <Link
        href="/"
        aria-label="Ürün tanıtım sayfasına dön"
        className="
          absolute left-4 top-4 z-20
          flex items-center justify-center
          h-12 w-12
          rounded-md
          
          text-[#dde3f0]
          transition
          hover:bg-[#E5E7EB]
          hover:text-[#374151]
          hover:scale-105 active:scale-95
          
        "
      >
        <ArrowLeft className="h-6 w-6 stroke-[2.2]" />
      </Link>
      <section className="relative z-10 grid w-full max-w-[560px] grid-cols-1 overflow-hidden rounded-[28px] border border-white/15 bg-white/10 shadow-[0_36px_90px_rgba(40,74,158,0.24)] backdrop-blur-[12px] md:rounded-[34px] lg:max-w-[1180px] lg:grid-cols-[minmax(0,1.18fr)_minmax(420px,0.82fr)] lg:rounded-[38px] lg:min-h-[min(760px,calc(100dvh-32px))] lg:max-h-[calc(100dvh-24px)]">
        

        <section
          className="relative order-2 flex flex-col justify-between bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_28%),linear-gradient(160deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_100%)] text-white max-lg:min-h-0 lg:order-1"
          style={{ padding: "clamp(28px, 4vh, 56px) clamp(28px, 3.6vw, 54px) clamp(26px, 3.2vh, 42px)" }}
        >
          <div className="pointer-events-none absolute inset-[34px] hidden rounded-[30px] border border-white/20 lg:block" />

          <div className="relative z-10 max-w-[560px] max-lg:mx-auto max-lg:w-full">
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
              Akıllı vardiya planlama, dengeli bir çalışma düzeni
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
              Hastane ekiplerinin zamanını daha verimli yönetin, vardiya dağılımını kolaylaştırın ve operasyon akışına tek merkezden hakim olun.
            </p>
          </div>

          <div className="relative z-10 mt-8 flex items-end justify-center max-[720px]:hidden lg:mt-4 lg:justify-start">
            <div className="relative ml-[10px] w-full max-w-[760px] overflow-hidden rounded-[36px] drop-shadow-[0_24px_38px_rgba(34,61,136,0.16)] drop-shadow-[0_0_18px_rgba(170,206,255,0.18)]">
              <div className="relative aspect-[760/508] w-full">
                <Image
                  src="/images/medishift-login-preview.png"
                  alt="MediShift vardiya planı önizleme"
                  fill
                  sizes="(min-width: 1024px) 760px, 100vw"
                  className="object-contain object-left-bottom"
                  priority
                />
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-5 left-0 hidden h-[66px] w-[96px] bg-[radial-gradient(rgba(255,255,255,0.42)_1.5px,transparent_1.5px)] [background-size:12px_12px] opacity-65 md:block" />
        </section>

        <section
          className="order-1 flex items-center justify-center bg-white lg:order-2"
          style={{ padding: "clamp(28px, 4vh, 54px) clamp(24px, 3.2vw, 48px)" }}
        >
          <div className="w-full max-w-[410px] max-lg:mx-auto">
            <div className="mb-6 flex items-center gap-3.5">
              <Image
                src="/icons/medishift-brand.png"
                alt="MediShift logo"
                width={40}
                height={40}
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
            Vardiya planlama ekranı yüklenirken küçük bir hazırlık yapıyoruz.
          </p>
          <div className="login-loader-bar mt-5 h-2.5 overflow-hidden rounded-[999px] bg-white/20">
            <span className="block h-full w-[42%] rounded-[inherit] bg-[linear-gradient(90deg,rgba(255,255,255,0.35),#fff,rgba(255,255,255,0.35))]" />
          </div>
        </div>
      </div>
    </main>
  );
}
