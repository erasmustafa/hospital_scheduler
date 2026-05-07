"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, ReactNode, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  Check,
  Clock3,
  Eye,
  EyeOff,
  FileUp,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { register, type RegisterPayload } from "@/lib/auth";
import { ApiError } from "@/lib/api";

type Purpose = "personal" | "manager" | "invite";
type Step = 1 | 2 | 3 | 4;

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  purpose: Purpose | null;
  profession: string;
  workModel: string;
  importMethod: string;
  organizationName: string;
  unitName: string;
  unitType: string;
  inviteCode: string;
};

const STEPS = [
  { id: 1, label: "Hesap OluÅŸturma" },
  { id: 2, label: "AmaÃ§ SeÃ§imi" },
  { id: 3, label: "Bilgiler" },
  { id: 4, label: "Tamamla" },
] as const;

const PURPOSE_CARDS: Array<{
  id: Purpose;
  title: string;
  description: string;
  icon: typeof User;
}> = [
  {
    id: "personal",
    title: "Bireysel KullanÄ±m",
    description: "Kendi takviminizi, tercihlerinizi ve listenizi yÃ¶netirsiniz.",
    icon: User,
  },
  {
    id: "manager",
    title: "Birim YÃ¶netimi",
    description: "Birim kurar, vardiya tipleri ve plan akÄ±ÅŸÄ±nÄ± yÃ¶netirsiniz.",
    icon: Building2,
  },
  {
    id: "invite",
    title: "Davet ile KatÄ±lÄ±m",
    description: "Mevcut birime davet kodu ile Ã§alÄ±ÅŸan olarak katÄ±lÄ±rsÄ±nÄ±z.",
    icon: Users,
  },
] as const;

const SIDE_FEATURES = [
  {
    title: "AkÄ±llÄ± Planlama",
    description: "Personel ihtiyaÃ§larÄ±nÄ± Ã¶ngÃ¶rÃ¼n ve planlamanÄ±zÄ± kolayca yapÄ±n.",
    icon: CalendarClock,
  },
  {
    title: "Veriye DayalÄ± Kararlar",
    description: "Analiz ve raporlarla doÄŸru kararlar alÄ±n, performansÄ± artÄ±rÄ±n.",
    icon: Sparkles,
  },
  {
    title: "GÃ¼venli ve EriÅŸilebilir",
    description: "Verileriniz gÃ¼vende, sisteminiz her yerden eriÅŸilebilir.",
    icon: ShieldCheck,
  },
] as const;

const FOOTER_FEATURES = [
  {
    title: "KVKK Uyumlu",
    description: "KiÅŸisel verileriniz mevzuata uygun ÅŸekilde korunur.",
    icon: ShieldCheck,
  },
  {
    title: "GÃ¼venli EriÅŸim",
    description: "EndÃ¼stri standartlarÄ±nda ÅŸifreleme ile verileriniz gÃ¼vende.",
    icon: Lock,
  },
  {
    title: "7/24 Destek",
    description: "Her zaman yanÄ±nÄ±zdayÄ±z. Destek ekibimizle iletiÅŸime geÃ§in.",
    icon: Phone,
  },
] as const;

const initialState: FormState = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  purpose: null,
  profession: "",
  workModel: "Karma",
  importMethod: "Åimdilik boÅŸ baÅŸla",
  organizationName: "",
  unitName: "",
  unitType: "",
  inviteCode: "",
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function SignupWizard() {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUsername, setCreatedUsername] = useState<string | null>(null);

  const canProceedStep1 = useMemo(
    () =>
      form.fullName.trim().length >= 3 &&
      form.email.trim().length > 5 &&
      form.password.length >= 8 &&
      form.password === form.confirmPassword,
    [form],
  );

  const canProceedStep2 = Boolean(form.purpose);
  const showPasswordHint = form.password.length > 0 && form.password.length < 8;

  const canProceedStep3 = useMemo(() => {
    if (form.purpose === "personal") return form.profession.trim().length > 1;
    if (form.purpose === "manager") {
      return (
        form.organizationName.trim().length > 1 &&
        form.unitName.trim().length > 1 &&
        form.unitType.trim().length > 1
      );
    }
    if (form.purpose === "invite") return form.inviteCode.trim().length >= 4;
    return false;
  }, [form]);

  const accountSummary = useMemo(() => {
    const map: Record<Purpose, string> = {
      personal: "Bireysel takviminizi kurup kiÅŸisel planlama ile devam edeceksiniz.",
      manager: "Birim, personel, kural ve vardiya yapÄ±sÄ±nÄ± siz yÃ¶neteceksiniz.",
      invite: "Davet kodu ile mevcut birime Ã§alÄ±ÅŸan olarak baÄŸlanacaksÄ±nÄ±z.",
    };
    return form.purpose ? map[form.purpose] : "";
  }, [form.purpose]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const nextStep = () => {
    setError(null);
    setStep((current) => Math.min(4, current + 1) as Step);
  };

  const prevStep = () => {
    setError(null);
    setStep((current) => Math.max(1, current - 1) as Step);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.purpose) {
      setError("LÃ¼tfen kullanÄ±m amacÄ±nÄ±zÄ± seÃ§in.");
      return;
    }

    const payload: RegisterPayload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
      purpose: form.purpose,
      metadata: {
        profession: form.profession.trim(),
        workModel: form.workModel,
        importMethod: form.importMethod,
        organizationName: form.organizationName.trim(),
        unitName: form.unitName.trim(),
        unitType: form.unitType.trim(),
        inviteCode: form.inviteCode.trim(),
      },
    };

    setSubmitting(true);
    try {
      const response = await register(payload);
      setCreatedUsername(response.user.username);
      setStep(4);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
      } else if (caught instanceof Error) {
        setError(caught.message);
      } else {
        setError("KayÄ±t sÄ±rasÄ±nda beklenmeyen bir hata oluÅŸtu.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#edf3ff]">
      <Image
        src="/images/signup/main-background.png"
        alt=""
        fill
        priority
        className="pointer-events-none object-cover object-center"
        sizes="100vw"
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(242,247,255,0.28),rgba(255,255,255,0.16),rgba(237,244,255,0.3))]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1320px] items-center justify-center p-2 sm:p-4 xl:p-6">
        <Link
          href="/"
          className="absolute left-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#dce7ff] bg-white/90 text-[#4568e6] shadow-[0_12px_30px_rgba(74,105,196,0.12)] transition hover:-translate-y-0.5 sm:left-5 sm:top-5"
          aria-label="Ana sayfaya dÃ¶n"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <section className="relative grid h-[min(82vh,1080px)] w-full max-w-[1060px] overflow-hidden rounded-[26px] border border-[#dfe8ff] bg-white/18 shadow-[0_22px_56px_rgba(53,85,176,0.14)] xl:grid-cols-[0.92fr_0.84fr]">
          <Image
            src="/images/signup/signup-background.png"
            alt=""
            fill
            priority
            quality={100}
            unoptimized
            className="pointer-events-none object-cover object-center"
            sizes="1060px"
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01),rgba(255,255,255,0))]" />

          <aside className="relative hidden overflow-hidden xl:flex">

            <div className="ml-2 relative z-10 flex h-full w-full flex-col px-5 pb-3 pt-4">
              <div className="ml-3 flex items-center gap-3">
                <Image
                  src="/icons/medishift-brand-blue.png"
                  alt="MediPlan"
                  width={54}
                  height={54}
                  unoptimized
                  className="h-9 w-auto shrink-0 object-contain"
                />
                <div>
                  <div className="text-[38px] font-black tracking-[-0.04em] text-[#1e55e6]">
                    MediPlan
                  </div>
                </div>
              </div>

              <div className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-[#dce8ff] bg-white/72 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.05em] text-[#295ae7]">
                <ShieldCheck className="h-5 w-5" />
                Hastane Personel Organizasyon Sistemi
              </div>

              <div className="mt-5 max-w-[350px]">
                <h1 className="text-[50px] font-black leading-[1] tracking-[-0.06em] text-[#19316f]">
                  Daha dÃ¼zenli,
                  <br />
                  daha verimli,
                  <br />
                  <span className="text-[#2c63f2]">daha iyi bir saÄŸlÄ±k yÃ¶netimi.</span>
                </h1>
                <p className="mt-2.5 max-w-[400px] text-[13px] leading-5 text-[#536786]">
                  MediPlan ile personel planlamanÄ±zÄ± kolaylaÅŸtÄ±rÄ±n, sÃ¼reÃ§lerinizi optimize edin,
                  veriye dayalÄ± kararlarla fark yaratÄ±n.
                </p>
              </div>

              <div className="mt-4 h-1 w-10 rounded-full bg-[#295ae7]" />

              <div className="mt-4 grid gap-0 sm:grid-cols-3">
                {SIDE_FEATURES.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className={cn(
                        "flex min-w-0 items-center gap-2.5 px-2 py-1.5",
                        item.title !== SIDE_FEATURES[SIDE_FEATURES.length - 1].title &&
                          "sm:border-r sm:border-[#d9e5ff]",
                      )}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] border border-[#dce7ff] bg-white/88 text-[#2a5ae8] shadow-[0_8px_18px_rgba(39,89,231,0.08)]">
                        <Icon className="h-4 w-4 stroke-[1.7]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold tracking-[-0.03em] text-[#23418f]">
                          {item.title}
                        </div>
                        <p className="mt-0.5 text-[9px] leading-4 text-[#60718e]">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </aside>

          <section className="relative flex min-w-0 flex-col bg-white/8 px-3 py-3 sm:px-4 sm:py-4 xl:px-5 xl:py-5">
            <div className="mb-3 grid grid-cols-4 gap-2 rounded-[16px] border border-[#e3ebff] bg-white/66 px-3 py-2 shadow-[0_10px_24px_rgba(53,85,176,0.06)]">
              {STEPS.map((item) => {
                const isActive = step === item.id;
                const isDone = step > item.id || (item.id === 4 && createdUsername);
                return (
                  <div key={item.id} className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold transition",
                        isActive || isDone
                          ? "border-[#2659e7] bg-[#2659e7] text-white"
                          : "border-[#d9e4ff] bg-white text-[#7d8dab]",
                      )}
                    >
                      {isDone ? <Check className="h-4 w-4" /> : item.id}
                    </div>
                    <div className="min-w-0 text-[9px] font-semibold leading-3.5 text-[#6d7f9f]">
                      <span className={isActive ? "text-[#2441a3]" : undefined}>{item.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-[#dfe8ff] bg-white/84 px-3.5 py-3.5 shadow-[0_18px_42px_rgba(53,85,176,0.08)] sm:px-4 sm:py-4">
              {createdUsername ? (
                <div className="flex h-full flex-col justify-center">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e9f1ff] text-[#2759e7]">
                    <Check className="h-5 w-5" />
                  </div>
                    <h2 className="text-[26px] font-extrabold tracking-[-0.05em] text-[#1d2e52]">
                    HesabÄ±nÄ±z hazÄ±r
                  </h2>
                    <p className="mt-1.5 max-w-[320px] text-[12px] leading-5 text-[#607190]">
                    KayÄ±t tamamlandÄ±. GiriÅŸ ekranÄ±nda kullanÄ±cÄ± adÄ± olarak e-posta adresinizi
                    kullanabilirsiniz.
                  </p>
                  <div className="mt-3 rounded-[14px] border border-[#dbe7ff] bg-[#fbfdff] p-3">
                    <div className="text-xs font-semibold text-[#70809d]">GiriÅŸ bilgisi</div>
                    <div className="mt-1 text-[15px] font-bold text-[#1d2e52]">
                      {createdUsername}
                    </div>
                    <p className="mt-1.5 text-[11px] leading-4 text-[#667792]">{accountSummary}</p>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href="/login"
                      className="inline-flex h-8 items-center justify-center rounded-xl bg-[#2759e7] px-3.5 text-[12px] font-bold text-white shadow-[0_14px_32px_rgba(39,89,231,0.28)]"
                    >
                      GiriÅŸ Yap
                    </Link>
                    <Link
                      href="/"
                      className="inline-flex h-8 items-center justify-center rounded-xl border border-[#d7e3ff] px-3.5 text-[12px] font-semibold text-[#2b467e]"
                    >
                      Ana Sayfaya DÃ¶n
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                    <div className="mb-3">
                    <h2 className="text-[24px] font-extrabold tracking-[-0.05em] text-[#1d2e52]">
                      {step === 1
                        ? "Hesap oluÅŸturun"
                        : step === 2
                          ? "AmaÃ§ seÃ§in"
                          : step === 3
                            ? "Bilgileri tamamlayÄ±n"
                            : "KaydÄ± gÃ¶zden geÃ§irin"}
                    </h2>
                    <p className="mt-1 text-[11px] leading-4 text-[#667792]">
                      {step === 1 &&
                        "MediPlan'a hoÅŸ geldiniz. Temel hesap bilgilerinizi girerek baÅŸlayÄ±n."}
                      {step === 2 &&
                        "Sistemi hangi baÄŸlamda kullanacaÄŸÄ±nÄ±zÄ± seÃ§in. Sonraki adÄ±mlar bu seÃ§ime gÃ¶re ÅŸekillenir."}
                      {step === 3 &&
                        "SeÃ§tiÄŸiniz kullanÄ±m amacÄ±na gÃ¶re gerekli alanlarÄ± tamamlayÄ±n."}
                      {step === 4 &&
                        "KayÄ±t tamamlanmadan Ã¶nce seÃ§tiÄŸiniz akÄ±ÅŸÄ± ve hesap Ã¶zetini kontrol edin."}
                    </p>
                  </div>

                    <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
                    {step === 1 && (
                      <div className="space-y-2">
                        <Field label="Ad Soyad" icon={User}>
                          <Input
                            value={form.fullName}
                            onChange={(event) => setField("fullName", event.target.value)}
                            placeholder="AdÄ±nÄ±zÄ± ve soyadÄ±nÄ±zÄ± girin"
                            className="h-[36px] rounded-[12px] border-[#dfe7f7] pl-3 text-[12px]"
                          />
                        </Field>
                        <Field label="E-posta" icon={Mail}>
                          <Input
                            type="email"
                            value={form.email}
                            onChange={(event) => setField("email", event.target.value)}
                            placeholder="ornek@email.com"
                            className="h-[36px] rounded-[12px] border-[#dfe7f7] pl-3 text-[12px]"
                          />
                        </Field>
                        <Field label="Telefon NumarasÄ± (Opsiyonel)" icon={Phone}>
                          <Input
                            value={form.phone}
                            onChange={(event) => setField("phone", event.target.value)}
                            placeholder="+90 (5XX) XXX XX XX"
                            className="h-[36px] rounded-[12px] border-[#dfe7f7] pl-3 text-[12px]"
                          />
                        </Field>
                        <Field label="Åifre" icon={Lock}>
                          <PasswordInput
                            value={form.password}
                            onChange={(value) => setField("password", value)}
                            visible={showPassword}
                            onToggle={() => setShowPassword((current) => !current)}
                            placeholder="En az 8 karakter"
                          />
                        </Field>
                        {showPasswordHint ? (
                          <p className="-mt-0.5 text-[10px] text-[#b24c4c]">
                            Åifreniz en az 8 karakter iÃ§ermelidir.
                          </p>
                        ) : null}
                        <Field label="Åifre (Tekrar)" icon={Lock}>
                          <PasswordInput
                            value={form.confirmPassword}
                            onChange={(value) => setField("confirmPassword", value)}
                            visible={showConfirmPassword}
                            onToggle={() => setShowConfirmPassword((current) => !current)}
                            placeholder="Åifrenizi tekrar girin"
                          />
                        </Field>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="grid gap-3">
                        {PURPOSE_CARDS.map((item) => {
                          const Icon = item.icon;
                          const active = form.purpose === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setField("purpose", item.id)}
                              className={cn(
                                "rounded-[16px] border p-3 text-left transition",
                                active
                                  ? "border-[#295ae7] bg-[#f5f8ff] shadow-[0_18px_36px_rgba(41,90,231,0.12)]"
                                  : "border-[#e0e8f8] bg-white hover:border-[#bfd0ff]",
                              )}
                            >
                              <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef3ff] text-[#2859e7]">
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <div className="text-[13px] font-bold text-[#20325b]">{item.title}</div>
                              <p className="mt-1 text-[11px] leading-4 text-[#677892]">
                                {item.description}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {step === 3 && form.purpose === "personal" && (
                      <div className="grid gap-3">
                        <Field label="Meslek / GÃ¶rev" icon={BriefcaseBusiness}>
                          <Input
                            value={form.profession}
                            onChange={(event) => setField("profession", event.target.value)}
                            placeholder="HemÅŸire, doktor, tekniker..."
                            className="h-[36px] rounded-[12px] border-[#dfe7f7] pl-3 text-[12px]"
                          />
                        </Field>
                        <Field label="Ã‡alÄ±ÅŸma Modeli" icon={Clock3}>
                          <SelectField
                            value={form.workModel}
                            onChange={(value) => setField("workModel", value)}
                            options={["Mesaili", "NÃ¶betli", "Karma"]}
                          />
                        </Field>
                        <Field label="Liste Aktarma YÃ¶ntemi" icon={FileUp}>
                          <SelectField
                            value={form.importMethod}
                            onChange={(value) => setField("importMethod", value)}
                            options={[
                              "Åimdilik boÅŸ baÅŸla",
                              "FotoÄŸraf yÃ¼kle",
                              "PDF / Excel yÃ¼kle",
                              "Manuel takvimden ekle",
                            ]}
                          />
                        </Field>
                      </div>
                    )}

                    {step === 3 && form.purpose === "manager" && (
                      <div className="grid gap-3">
                        <Field label="Kurum AdÄ±" icon={Building2}>
                          <Input
                            value={form.organizationName}
                            onChange={(event) => setField("organizationName", event.target.value)}
                            placeholder="Ã–r. GÃ¶lhisar Devlet Hastanesi"
                            className="h-[36px] rounded-[12px] border-[#dfe7f7] pl-3 text-[12px]"
                          />
                        </Field>
                        <Field label="Birim AdÄ±" icon={Users}>
                          <Input
                            value={form.unitName}
                            onChange={(event) => setField("unitName", event.target.value)}
                            placeholder="Ã–r. Ameliyathane"
                            className="h-[36px] rounded-[12px] border-[#dfe7f7] pl-3 text-[12px]"
                          />
                        </Field>
                        <Field label="Birim TÃ¼rÃ¼" icon={BriefcaseBusiness}>
                          <Input
                            value={form.unitType}
                            onChange={(event) => setField("unitType", event.target.value)}
                            placeholder="Anestezi / Acil / YoÄŸun BakÄ±m"
                            className="h-[36px] rounded-[12px] border-[#dfe7f7] pl-3 text-[12px]"
                          />
                        </Field>
                        <Field label="Ã‡alÄ±ÅŸma Modeli" icon={CalendarClock}>
                          <SelectField
                            value={form.workModel}
                            onChange={(value) => setField("workModel", value)}
                            options={[
                              "24 saat nÃ¶bet + 8 saat mesai",
                              "Standart vardiyalÄ± Ã§alÄ±ÅŸma",
                              "Esnek karma sistem",
                            ]}
                          />
                        </Field>
                      </div>
                    )}

                    {step === 3 && form.purpose === "invite" && (
                      <div className="grid gap-3">
                        <Field label="Davet Kodu" icon={Users}>
                          <Input
                            value={form.inviteCode}
                            onChange={(event) => setField("inviteCode", event.target.value)}
                            placeholder="Ã–r. MEDI-2026-ACIL"
                            className="h-[36px] rounded-[12px] border-[#dfe7f7] pl-3 text-[12px]"
                          />
                        </Field>
                        <div className="rounded-[12px] border border-[#dce8ff] bg-[#f8fbff] p-3 text-[11px] leading-4 text-[#5e6f90]">
                          Davet kodu ile mevcut birime Ã§alÄ±ÅŸan olarak katÄ±lÄ±rsÄ±nÄ±z. Yetkileriniz
                          davet yapÄ±sÄ±na gÃ¶re tanÄ±mlanÄ±r.
                        </div>
                      </div>
                    )}

                    {step === 4 && (
                      <div className="space-y-4">
                        <div className="rounded-[14px] border border-[#dce6ff] bg-[#f8fbff] p-3">
                          <div className="text-xs font-semibold text-[#6c7a95]">SeÃ§ilen akÄ±ÅŸ</div>
                          <div className="mt-1 text-[14px] font-bold text-[#20325b]">
                            {PURPOSE_CARDS.find((item) => item.id === form.purpose)?.title ?? "â€”"}
                          </div>
                          <p className="mt-1.5 text-[11px] leading-4 text-[#607190]">{accountSummary}</p>
                        </div>

                        <div className="rounded-[14px] border border-[#e1e9ff] bg-white p-3">
                          <div className="mb-2 text-xs font-semibold text-[#6c7a95]">Hesap Ã¶zeti</div>
                            <dl className="space-y-2 text-[12px] text-[#435473]">
                            <Row label="Ad Soyad" value={form.fullName} />
                            <Row label="E-posta" value={form.email} />
                            <Row label="Telefon" value={form.phone || "Belirtilmedi"} />
                            {form.purpose === "personal" && (
                              <>
                                <Row label="Meslek" value={form.profession} />
                                <Row label="Ã‡alÄ±ÅŸma modeli" value={form.workModel} />
                                <Row label="Ä°Ã§e aktarma" value={form.importMethod} />
                              </>
                            )}
                            {form.purpose === "manager" && (
                              <>
                                <Row label="Kurum" value={form.organizationName} />
                                <Row label="Birim" value={form.unitName} />
                                <Row label="Birim tÃ¼rÃ¼" value={form.unitType} />
                              </>
                            )}
                            {form.purpose === "invite" && (
                              <Row label="Davet kodu" value={form.inviteCode} />
                            )}
                          </dl>
                        </div>
                      </div>
                    )}
                  </div>

                  {error ? (
                    <p className="mt-2.5 rounded-[10px] border border-[#f7d1d1] bg-[#fff5f5] px-3 py-1.5 text-[11px] text-[#b24c4c]">
                      {error}
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#eef2ff] pt-2.5">
                    <div className="text-[11px] text-[#74839d]">
                      Zaten hesabÄ±nÄ±z var mÄ±?{" "}
                      <Link href="/login" className="font-semibold text-[#295ae7]">
                        GiriÅŸ Yap
                      </Link>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {step > 1 && step < 4 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={prevStep}
                          className="h-8 rounded-[10px] border-[#d9e4ff] px-3 text-[12px] text-[#355287]"
                        >
                          Geri
                        </Button>
                      )}

                      {step === 1 && (
                        <Button
                          type="button"
                          onClick={nextStep}
                          disabled={!canProceedStep1}
                          className="h-8 rounded-[10px] bg-[#295ae7] px-3 text-[12px] font-bold"
                        >
                          Devam Et
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}

                      {step === 2 && (
                        <Button
                          type="button"
                          onClick={nextStep}
                          disabled={!canProceedStep2}
                          className="h-8 rounded-[10px] bg-[#295ae7] px-3 text-[12px] font-bold"
                        >
                          Devam Et
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}

                      {step === 3 && (
                        <Button
                          type="button"
                          onClick={nextStep}
                          disabled={!canProceedStep3}
                          className="h-8 rounded-[10px] bg-[#295ae7] px-3 text-[12px] font-bold"
                        >
                          Ã–zeti GÃ¶r
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}

                      {step === 4 && (
                        <Button
                          type="submit"
                          disabled={submitting}
                          className="h-8 rounded-[10px] bg-[#295ae7] px-3 text-[12px] font-bold"
                        >
                          {submitting ? "Kaydediliyor..." : "KayÄ±t Ol"}
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
              )}
            </div>

            <div className="mt-3 grid gap-2 rounded-[18px] border border-[#e6ecfb] bg-white/62 px-3 py-2.5 sm:grid-cols-3">
              {FOOTER_FEATURES.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-[#f3f7ff] text-[#2759e7]">
                      <Icon className="h-3.5 w-3.5 stroke-[1.8]" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-[#223768]">{item.title}</div>
                      <p className="mt-0.5 text-[9px] leading-3.5 text-[#60708e]">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function PasswordInput({
  value,
  onChange,
  visible,
  onToggle,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-[36px] rounded-[12px] border-[#dfe7f7] pl-3 pr-10 text-[12px]"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c99b0]"
        aria-label={visible ? "Åifreyi gizle" : "Åifreyi gÃ¶ster"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function SelectField({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-[36px] w-full rounded-[12px] border border-[#dfe7f7] bg-white px-3 text-[12px] text-[#24365b] outline-none"
    >
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: typeof User;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5 md:grid-cols-[28px_1fr] md:items-start">
      <div className="hidden h-[28px] w-[28px] items-center justify-center rounded-[10px] border border-[#e2e9fb] bg-[#f7faff] text-[#295ae7] md:flex md:translate-y-[23px]">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="space-y-1.5">
        <label className="text-[12px] font-semibold text-[#31456e]">{label}</label>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[12px] border border-[#edf2ff] bg-[#fbfcff] px-3 py-2">
      <dt className="text-[11px] font-medium text-[#6d7f9f]">{label}</dt>
      <dd className="text-right text-[11px] font-semibold text-[#20325b]">{value}</dd>
    </div>
  );
}

