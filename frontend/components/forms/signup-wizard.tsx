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
  { id: 1, label: "Hesap Oluşturma" },
  { id: 2, label: "Amaç Seçimi" },
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
    title: "Bireysel Kullanım",
    description: "Kendi takviminizi, tercihlerinizi ve listenizi yönetirsiniz.",
    icon: User,
  },
  {
    id: "manager",
    title: "Birim Yönetimi",
    description: "Birim kurar, vardiya tipleri ve plan akışını yönetirsiniz.",
    icon: Building2,
  },
  {
    id: "invite",
    title: "Davet ile Katılım",
    description: "Mevcut birime davet kodu ile çalışan olarak katılırsınız.",
    icon: Users,
  },
] as const;

const SIDE_FEATURES = [
  {
    title: "Akıllı Planlama",
    description: "Personel ihtiyaçlarını öngörün ve planlamanızı kolayca yapın.",
    icon: CalendarClock,
  },
  {
    title: "Veriye Dayalı Kararlar",
    description: "Analiz ve raporlarla doğru kararlar alın, performansı artırın.",
    icon: Sparkles,
  },
  {
    title: "Güvenli ve Erişilebilir",
    description: "Verileriniz güvende, sisteminiz her yerden erişilebilir.",
    icon: ShieldCheck,
  },
] as const;

const FOOTER_FEATURES = [
  {
    title: "KVKK Uyumlu",
    description: "Kişisel verileriniz mevzuata uygun şekilde korunur.",
    icon: ShieldCheck,
  },
  {
    title: "Güvenli Erişim",
    description: "Endüstri standartlarında şifreleme ile verileriniz güvende.",
    icon: Lock,
  },
  {
    title: "7/24 Destek",
    description: "Her zaman yanınızdayız. Destek ekibimizle iletişime geçin.",
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
  importMethod: "Şimdilik boş başla",
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
      personal: "Bireysel takviminizi kurup kişisel planlama ile devam edeceksiniz.",
      manager: "Birim, personel, kural ve vardiya yapısını siz yöneteceksiniz.",
      invite: "Davet kodu ile mevcut birime çalışan olarak bağlanacaksınız.",
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
      setError("Lütfen kullanım amacınızı seçin.");
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
        setError("Kayıt sırasında beklenmeyen bir hata oluştu.");
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
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(242,247,255,0.88),rgba(255,255,255,0.78),rgba(237,244,255,0.92))]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1320px] items-center justify-center p-2 sm:p-4 xl:p-6">
        <Link
          href="/"
          className="absolute left-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#dce7ff] bg-white/90 text-[#4568e6] shadow-[0_12px_30px_rgba(74,105,196,0.12)] transition hover:-translate-y-0.5 sm:left-5 sm:top-5"
          aria-label="Ana sayfaya dön"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <section className="grid h-[min(82vh,780px)] w-full max-w-[1060px] overflow-hidden rounded-[26px] border border-[#dfe8ff] bg-white/88 shadow-[0_22px_56px_rgba(53,85,176,0.14)] backdrop-blur-xl xl:grid-cols-[0.92fr_0.84fr]">
          <aside className="relative hidden overflow-hidden xl:flex">
            <Image
              src="/images/signup/signup-background.png"
              alt=""
              fill
              className="pointer-events-none object-cover object-center"
              sizes="(min-width: 1280px) 640px, 0px"
            />
            <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.22),rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />

            <div className="relative z-10 flex h-full w-full flex-col px-5 pb-3 pt-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/icons/medishift-brand.png"
                  alt="MediPlan"
                  width={44}
                  height={44}
                  unoptimized
                  className="h-8 w-8 shrink-0"
                />
                <div>
                  <div className="text-[28px] font-black tracking-[-0.04em] text-[#1e55e6]">
                    MediPlan
                  </div>
                </div>
              </div>

              <div className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-full border border-[#dce8ff] bg-white/72 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.05em] text-[#295ae7]">
                <ShieldCheck className="h-3 w-3" />
                Hastane Personel Organizasyon Sistemi
              </div>

              <div className="mt-5 max-w-[260px]">
                <h1 className="text-[28px] font-black leading-[1] tracking-[-0.06em] text-[#19316f]">
                  Daha düzenli,
                  <br />
                  daha verimli,
                  <br />
                  <span className="text-[#2c63f2]">daha iyi bir sağlık yönetimi.</span>
                </h1>
                <p className="mt-2.5 max-w-[270px] text-[11px] leading-5 text-[#536786]">
                  MediPlan ile personel planlamanızı kolaylaştırın, süreçlerinizi optimize edin,
                  veriye dayalı kararlarla fark yaratın.
                </p>
              </div>

              <div className="mt-4 h-1 w-10 rounded-full bg-[#295ae7]" />

              <div className="mt-4 space-y-3">
                {SIDE_FEATURES.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex items-start gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] border border-[#dce7ff] bg-white/76 text-[#2a5ae8] shadow-[0_10px_20px_rgba(39,89,231,0.08)]">
                        <Icon className="h-4 w-4 stroke-[1.7]" />
                      </div>
                      <div className="pt-0.5">
                        <div className="text-[12px] font-bold tracking-[-0.03em] text-[#23418f]">
                          {item.title}
                        </div>
                        <p className="mt-0.5 max-w-[210px] text-[10px] leading-4 text-[#60718e]">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </aside>

          <section className="flex min-w-0 flex-col bg-white/52 px-3 py-3 sm:px-4 sm:py-4 xl:px-5 xl:py-5">
            <div className="mb-3 grid grid-cols-4 gap-2 rounded-[16px] border border-[#e3ebff] bg-white/86 px-3 py-2 shadow-[0_10px_24px_rgba(53,85,176,0.06)]">
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

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-[#dfe8ff] bg-white/96 px-3.5 py-3.5 shadow-[0_18px_42px_rgba(53,85,176,0.08)] sm:px-4 sm:py-4">
              {createdUsername ? (
                <div className="flex h-full flex-col justify-center">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e9f1ff] text-[#2759e7]">
                    <Check className="h-5 w-5" />
                  </div>
                    <h2 className="text-[26px] font-extrabold tracking-[-0.05em] text-[#1d2e52]">
                    Hesabınız hazır
                  </h2>
                    <p className="mt-1.5 max-w-[320px] text-[12px] leading-5 text-[#607190]">
                    Kayıt tamamlandı. Giriş ekranında kullanıcı adı olarak e-posta adresinizi
                    kullanabilirsiniz.
                  </p>
                  <div className="mt-3 rounded-[14px] border border-[#dbe7ff] bg-[#fbfdff] p-3">
                    <div className="text-xs font-semibold text-[#70809d]">Giriş bilgisi</div>
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
                      Giriş Yap
                    </Link>
                    <Link
                      href="/"
                      className="inline-flex h-8 items-center justify-center rounded-xl border border-[#d7e3ff] px-3.5 text-[12px] font-semibold text-[#2b467e]"
                    >
                      Ana Sayfaya Dön
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                    <div className="mb-3">
                    <h2 className="text-[24px] font-extrabold tracking-[-0.05em] text-[#1d2e52]">
                      {step === 1
                        ? "Hesap oluşturun"
                        : step === 2
                          ? "Amaç seçin"
                          : step === 3
                            ? "Bilgileri tamamlayın"
                            : "Kaydı gözden geçirin"}
                    </h2>
                    <p className="mt-1 text-[11px] leading-4 text-[#667792]">
                      {step === 1 &&
                        "MediPlan'a hoş geldiniz. Temel hesap bilgilerinizi girerek başlayın."}
                      {step === 2 &&
                        "Sistemi hangi bağlamda kullanacağınızı seçin. Sonraki adımlar bu seçime göre şekillenir."}
                      {step === 3 &&
                        "Seçtiğiniz kullanım amacına göre gerekli alanları tamamlayın."}
                      {step === 4 &&
                        "Kayıt tamamlanmadan önce seçtiğiniz akışı ve hesap özetini kontrol edin."}
                    </p>
                  </div>

                    <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
                    {step === 1 && (
                      <div className="space-y-2">
                        <Field label="Ad Soyad" icon={User}>
                          <Input
                            value={form.fullName}
                            onChange={(event) => setField("fullName", event.target.value)}
                            placeholder="Adınızı ve soyadınızı girin"
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
                        <Field label="Telefon Numarası (Opsiyonel)" icon={Phone}>
                          <Input
                            value={form.phone}
                            onChange={(event) => setField("phone", event.target.value)}
                            placeholder="+90 (5XX) XXX XX XX"
                            className="h-[36px] rounded-[12px] border-[#dfe7f7] pl-3 text-[12px]"
                          />
                        </Field>
                        <Field label="Şifre" icon={Lock}>
                          <PasswordInput
                            value={form.password}
                            onChange={(value) => setField("password", value)}
                            visible={showPassword}
                            onToggle={() => setShowPassword((current) => !current)}
                            placeholder="En az 8 karakter"
                          />
                        </Field>
                        <Field label="Şifre (Tekrar)" icon={Lock}>
                          <PasswordInput
                            value={form.confirmPassword}
                            onChange={(value) => setField("confirmPassword", value)}
                            visible={showConfirmPassword}
                            onToggle={() => setShowConfirmPassword((current) => !current)}
                            placeholder="Şifrenizi tekrar girin"
                          />
                        </Field>
                        <div className="rounded-[10px] border border-[#e4ebfb] bg-[#f8fbff] px-3 py-2 text-[10px] text-[#5f7092]">
                          Şifreniz en az 8 karakter içermelidir.
                        </div>
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
                        <Field label="Meslek / Görev" icon={BriefcaseBusiness}>
                          <Input
                            value={form.profession}
                            onChange={(event) => setField("profession", event.target.value)}
                            placeholder="Hemşire, doktor, tekniker..."
                            className="h-[36px] rounded-[12px] border-[#dfe7f7] pl-3 text-[12px]"
                          />
                        </Field>
                        <Field label="Çalışma Modeli" icon={Clock3}>
                          <SelectField
                            value={form.workModel}
                            onChange={(value) => setField("workModel", value)}
                            options={["Mesaili", "Nöbetli", "Karma"]}
                          />
                        </Field>
                        <Field label="Liste Aktarma Yöntemi" icon={FileUp}>
                          <SelectField
                            value={form.importMethod}
                            onChange={(value) => setField("importMethod", value)}
                            options={[
                              "Şimdilik boş başla",
                              "Fotoğraf yükle",
                              "PDF / Excel yükle",
                              "Manuel takvimden ekle",
                            ]}
                          />
                        </Field>
                      </div>
                    )}

                    {step === 3 && form.purpose === "manager" && (
                      <div className="grid gap-3">
                        <Field label="Kurum Adı" icon={Building2}>
                          <Input
                            value={form.organizationName}
                            onChange={(event) => setField("organizationName", event.target.value)}
                            placeholder="Ör. Gölhisar Devlet Hastanesi"
                            className="h-[36px] rounded-[12px] border-[#dfe7f7] pl-3 text-[12px]"
                          />
                        </Field>
                        <Field label="Birim Adı" icon={Users}>
                          <Input
                            value={form.unitName}
                            onChange={(event) => setField("unitName", event.target.value)}
                            placeholder="Ör. Ameliyathane"
                            className="h-[36px] rounded-[12px] border-[#dfe7f7] pl-3 text-[12px]"
                          />
                        </Field>
                        <Field label="Birim Türü" icon={BriefcaseBusiness}>
                          <Input
                            value={form.unitType}
                            onChange={(event) => setField("unitType", event.target.value)}
                            placeholder="Anestezi / Acil / Yoğun Bakım"
                            className="h-[36px] rounded-[12px] border-[#dfe7f7] pl-3 text-[12px]"
                          />
                        </Field>
                        <Field label="Çalışma Modeli" icon={CalendarClock}>
                          <SelectField
                            value={form.workModel}
                            onChange={(value) => setField("workModel", value)}
                            options={[
                              "24 saat nöbet + 8 saat mesai",
                              "Standart vardiyalı çalışma",
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
                            placeholder="Ör. MEDI-2026-ACIL"
                            className="h-[36px] rounded-[12px] border-[#dfe7f7] pl-3 text-[12px]"
                          />
                        </Field>
                        <div className="rounded-[12px] border border-[#dce8ff] bg-[#f8fbff] p-3 text-[11px] leading-4 text-[#5e6f90]">
                          Davet kodu ile mevcut birime çalışan olarak katılırsınız. Yetkileriniz
                          davet yapısına göre tanımlanır.
                        </div>
                      </div>
                    )}

                    {step === 4 && (
                      <div className="space-y-4">
                        <div className="rounded-[14px] border border-[#dce6ff] bg-[#f8fbff] p-3">
                          <div className="text-xs font-semibold text-[#6c7a95]">Seçilen akış</div>
                          <div className="mt-1 text-[14px] font-bold text-[#20325b]">
                            {PURPOSE_CARDS.find((item) => item.id === form.purpose)?.title ?? "—"}
                          </div>
                          <p className="mt-1.5 text-[11px] leading-4 text-[#607190]">{accountSummary}</p>
                        </div>

                        <div className="rounded-[14px] border border-[#e1e9ff] bg-white p-3">
                          <div className="mb-2 text-xs font-semibold text-[#6c7a95]">Hesap özeti</div>
                            <dl className="space-y-2 text-[12px] text-[#435473]">
                            <Row label="Ad Soyad" value={form.fullName} />
                            <Row label="E-posta" value={form.email} />
                            <Row label="Telefon" value={form.phone || "Belirtilmedi"} />
                            {form.purpose === "personal" && (
                              <>
                                <Row label="Meslek" value={form.profession} />
                                <Row label="Çalışma modeli" value={form.workModel} />
                                <Row label="İçe aktarma" value={form.importMethod} />
                              </>
                            )}
                            {form.purpose === "manager" && (
                              <>
                                <Row label="Kurum" value={form.organizationName} />
                                <Row label="Birim" value={form.unitName} />
                                <Row label="Birim türü" value={form.unitType} />
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
                      Zaten hesabınız var mı?{" "}
                      <Link href="/login" className="font-semibold text-[#295ae7]">
                        Giriş Yap
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
                          Özeti Gör
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}

                      {step === 4 && (
                        <Button
                          type="submit"
                          disabled={submitting}
                          className="h-8 rounded-[10px] bg-[#295ae7] px-3 text-[12px] font-bold"
                        >
                          {submitting ? "Kaydediliyor..." : "Kayıt Ol"}
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
              )}
            </div>

            <div className="mt-3 grid gap-2 rounded-[18px] border border-[#e6ecfb] bg-white/88 px-3 py-2.5 sm:grid-cols-3">
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
        className="h-[50px] rounded-[16px] border-[#dfe7f7] pl-4 pr-11 text-[15px]"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8c99b0]"
        aria-label={visible ? "Şifreyi gizle" : "Şifreyi göster"}
      >
        {visible ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
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
      className="h-[50px] w-full rounded-[16px] border border-[#dfe7f7] bg-white px-4 text-[15px] text-[#24365b] outline-none"
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
    <div className="grid gap-2.5 md:grid-cols-[50px_1fr] md:items-end">
      <div className="hidden h-[50px] w-[50px] items-center justify-center rounded-[16px] border border-[#e2e9fb] bg-[#f7faff] text-[#295ae7] md:flex">
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-1.5">
        <label className="text-[14px] font-semibold text-[#31456e]">{label}</label>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[14px] border border-[#edf2ff] bg-[#fbfcff] px-3.5 py-2.5">
      <dt className="font-medium text-[#6d7f9f]">{label}</dt>
      <dd className="text-right font-semibold text-[#20325b]">{value}</dd>
    </div>
  );
}
