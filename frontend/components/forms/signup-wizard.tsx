"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, ReactNode, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Calendar,
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
  User,
  Users,
} from "lucide-react";

import { ApiError } from "@/lib/api";
import { register, type RegisterPayload } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    title: "Kişisel Takvim",
    description: "Kendi çalışma listenizi ve tercihlerinizi yönetirsiniz.",
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
    title: "Adil & Dengeli",
    description: "Fairness analizleri ile herkes için adil dağılım.",
    icon: User,
  },
  {
    title: "Akıllı Öneriler",
    description: "Swap önerileri ile listeleri iyileştirin.",
    icon: Calendar,
  },
  {
    title: "Güvenli & Güvenilir",
    description: "Verileriniz güvenle korunur.",
    icon: ShieldCheck,
  },
] as const;

const FOOTER_FEATURES = [
  {
    title: "Uyumlu Kurallar",
    description: "Yasal ve kurumsal kurallara uyumlu.",
    icon: ShieldCheck,
  },
  {
    title: "Zaman Tasarrufu",
    description: "Otomasyon ile saatler süren işleri dakikalara indirin.",
    icon: Clock3,
  },
  {
    title: "Detaylı Raporlama",
    description: "Performans panelleri ile tüm verilere hakim olun.",
    icon: CalendarClock,
  },
  {
    title: "Her Yerden Erişim",
    description: "Web ve mobil ile her zaman yanınızda.",
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
      personal:
        "Kendi takviminizi oluşturup OCR veya manuel veri ile ilerleyeceksiniz.",
      manager:
        "Birim oluşturup vardiya tipleri, kurallar ve personel akışını kuracaksınız.",
      invite:
        "Davet kodu ile mevcut birime bağlanıp çalışan olarak devam edeceksiniz.",
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
      setError("Lütfen kullanım amacını seçin.");
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
    <main className="relative min-h-[100dvh] overflow-hidden bg-[linear-gradient(135deg,#edf4ff_0%,#f8fbff_50%,#eef3ff_100%)] px-3 py-4 sm:px-5 lg:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(76,117,238,0.12),transparent_68%)]" />

      <Link
        href="/"
        className="absolute left-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#dce7ff] bg-white/85 text-[#4568e6] shadow-[0_12px_30px_rgba(74,105,196,0.12)] transition hover:-translate-y-0.5"
        aria-label="Landing sayfasına dön"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      <section className="mx-auto grid h-[calc(100dvh-32px)] w-full max-w-[1380px] overflow-hidden rounded-[32px] border border-[#dfe8ff] bg-white shadow-[0_32px_90px_rgba(53,85,176,0.12)] lg:grid-cols-[0.96fr_1.04fr]">
        <aside className="relative hidden overflow-hidden bg-[#f7fbff] lg:flex">
          <Image
            src="/images/signup/left-panel-background.png"
            alt="MediPlan tanıtım arka planı"
            fill
            className="pointer-events-none object-cover object-center"
            sizes="(min-width: 1024px) 560px, 100vw"
            priority
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.65),transparent_34%),radial-gradient(circle_at_center_right,rgba(97,139,237,0.12),transparent_42%)]" />

          <div className="relative z-10 flex h-full w-full flex-col justify-between px-10 py-8">
            <div className="space-y-10">
              <div className="flex items-start gap-5">
                <Image
                  src="/icons/medishift-brand.png"
                  alt="MediPlan"
                  width={118}
                  height={118}
                  unoptimized
                  className="h-[118px] w-[118px] shrink-0"
                />
                <div className="space-y-1.5 pt-2">
                  <div className="text-[52px] font-extrabold leading-none tracking-[-0.05em] text-[#1f57e7]">
                    MediPlan
                  </div>
                  <p className="max-w-[280px] text-[22px] leading-[1.28] text-[#223768]">
                    Hastane Personel Organizasyon Sistemi
                  </p>
                </div>
              </div>

              <div className="max-w-[460px] space-y-6">
                <h2 className="text-[clamp(56px,6vw,80px)] font-extrabold leading-[0.98] tracking-[-0.06em] text-[#1b3271]">
                  Daha adil,
                  <br />
                  daha dengeli,
                  <br />
                  daha verimli çalışma listeleri.
                </h2>
                <p className="max-w-[430px] text-[18px] leading-9 text-[#506387]">
                  Bireysel takvim yönetimi, birim organizasyonu ve akıllı analizlerle
                  adil vardiya planlaması şimdi çok daha kolay.
                </p>
                <div className="h-1.5 w-14 rounded-full bg-[#2759e7]" />
              </div>

              <div className="space-y-6">
                {SIDE_FEATURES.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex items-start gap-5">
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[28px] border border-[#dbe6ff] bg-[#f4f8ff] text-[#2759e7] shadow-[0_16px_40px_rgba(39,89,231,0.08)]">
                        <Icon className="h-11 w-11 stroke-[1.7]" />
                      </div>
                      <div className="pt-1">
                        <div className="text-[28px] font-bold tracking-[-0.03em] text-[#2140a5]">
                          {item.title}
                        </div>
                        <p className="mt-1 max-w-[290px] text-[16px] leading-8 text-[#536585]">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-8">
              <div className="max-w-[470px] rounded-[28px] border border-[#dbe6ff] bg-[#f6faff] px-6 py-6 shadow-[0_18px_50px_rgba(39,89,231,0.08)]">
                <div className="flex items-center gap-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#edf4ff] text-[#2759e7]">
                    <Users className="h-8 w-8 stroke-[1.8]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[30px] font-bold tracking-[-0.03em] text-[#2140a5]">
                      Hemen başla!
                    </div>
                    <p className="text-[16px] leading-7 text-[#5b6d8e]">
                      Daha iyi bir vardiya planlaması sizi bekliyor.
                    </p>
                  </div>
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#2759e7] text-white shadow-[0_18px_34px_rgba(39,89,231,0.26)]">
                    <ArrowRight className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="grid max-w-[860px] grid-cols-4 overflow-hidden rounded-[28px] border border-[#dbe6ff] bg-white/92 shadow-[0_18px_44px_rgba(39,89,231,0.08)] backdrop-blur-sm">
                {FOOTER_FEATURES.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className={cn(
                        "flex flex-col gap-3 px-6 py-6",
                        index !== FOOTER_FEATURES.length - 1 &&
                          "border-r border-[#e6edff]",
                      )}
                    >
                      <Icon className="h-10 w-10 text-[#2759e7] stroke-[1.75]" />
                      <div className="text-[18px] font-bold tracking-[-0.02em] text-[#263a67]">
                        {item.title}
                      </div>
                      <p className="text-[14px] leading-6 text-[#60708e]">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <Image
              src="/images/signup/left-panel-asset.svg"
              alt=""
              width={620}
              height={760}
              className="pointer-events-none absolute bottom-0 right-0 z-0 h-auto w-[58%] max-w-[620px]"
            />
          </div>
        </aside>

        <section className="flex min-w-0 flex-col overflow-y-auto bg-white px-3 py-3 sm:px-5 lg:px-6 lg:py-5">
          <div className="mx-auto flex w-full max-w-[450px] flex-1 flex-col justify-center">
            <div className="mb-6 grid grid-cols-4 gap-2 sm:gap-3">
              {STEPS.map((item) => {
                const isActive = step === item.id;
                const isDone = step > item.id || (item.id === 4 && createdUsername);
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition",
                        isActive || isDone
                          ? "border-[#2659e7] bg-[#2659e7] text-white"
                          : "border-[#d9e4ff] bg-white text-[#7d8dab]",
                      )}
                    >
                      {isDone ? <Check className="h-4 w-4" /> : item.id}
                    </div>
                    <div className="hidden min-w-0 sm:block">
                      <div
                        className={cn(
                          "text-[13px] font-semibold",
                          isActive ? "text-[#2441a3]" : "text-[#7d8dab]",
                        )}
                      >
                        {item.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {createdUsername ? (
              <div className="rounded-[24px] border border-[#deebff] bg-[#f8fbff] p-5 shadow-[0_20px_60px_rgba(53,85,176,0.08)] sm:p-6">
                <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#e9f1ff] text-[#2759e7]">
                  <Check className="h-5 w-5" />
                </div>
                <h1 className="text-[34px] font-extrabold tracking-[-0.05em] text-[#1d2e52]">
                  Hesabınız hazır
                </h1>
                <p className="mt-2 max-w-[460px] text-[15px] leading-7 text-[#607190]">
                  Kayıt tamamlandı. Giriş ekranında kullanıcı adı olarak e-posta
                  adresinizi kullanabilirsiniz.
                </p>
                <div className="mt-5 rounded-[18px] border border-[#dbe7ff] bg-white p-4">
                  <div className="text-xs font-semibold text-[#70809d]">Giriş bilgisi</div>
                  <div className="mt-1.5 text-[18px] font-bold text-[#1d2e52]">
                    {createdUsername}
                  </div>
                  <p className="mt-1.5 text-[13px] leading-5 text-[#667792]">{accountSummary}</p>
                </div>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <Link
                    href="/login"
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-[#2759e7] px-6 text-sm font-bold text-white shadow-[0_14px_32px_rgba(39,89,231,0.28)]"
                  >
                    Giriş Yap
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-[#d7e3ff] px-6 text-sm font-semibold text-[#2b467e]"
                  >
                    Landing Sayfasına Dön
                  </Link>
                </div>
              </div>
            ) : (
              <form
                className="rounded-[24px] border border-[#e1e9ff] bg-white px-3.5 py-4 shadow-[0_24px_70px_rgba(53,85,176,0.08)] sm:px-5 sm:py-5 lg:px-6 lg:py-6"
                onSubmit={handleSubmit}
              >
                <div className="mb-4">
                  <h1 className="text-[clamp(22px,3.2vw,32px)] font-extrabold tracking-[-0.05em] text-[#1d2e52]">
                    {step === 1
                      ? "Hesap oluşturun"
                      : step === 2
                        ? "Kullanım amacınızı seçin"
                        : step === 3
                          ? "Kurulum detaylarını tamamlayın"
                          : "Kurulumu gözden geçirin"}
                  </h1>
                  <p className="mt-1.5 text-[12px] leading-5 text-[#6c7c98]">
                    {step === 1 &&
                      "MediPlan'a hoş geldiniz. Temel hesap bilgilerinizi girerek başlayın."}
                    {step === 2 &&
                      "Sistemi hangi bağlamda kullanacağınızı seçin. Bu seçim sonraki akışı belirler."}
                    {step === 3 &&
                      "Seçtiğiniz kullanım amacına göre gerekli alanları tamamlayın."}
                    {step === 4 &&
                      "Kaydı tamamlamadan önce yol haritanızı ve seçtiğiniz akışı kontrol edin."}
                  </p>
                </div>

                {step === 1 && (
                  <div className="space-y-4">
                    <Field label="Ad Soyad" icon={User}>
                      <Input
                        value={form.fullName}
                        onChange={(event) => setField("fullName", event.target.value)}
                        placeholder="Adınızı ve soyadınızı girin"
                        className="h-[46px] rounded-[14px] border-[#dfe7f7] pl-4 text-sm"
                      />
                    </Field>
                    <Field label="E-posta" icon={Mail}>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(event) => setField("email", event.target.value)}
                        placeholder="ornek@email.com"
                        className="h-[46px] rounded-[14px] border-[#dfe7f7] pl-4 text-sm"
                      />
                    </Field>
                    <Field label="Telefon Numarası (Opsiyonel)" icon={Phone}>
                      <Input
                        value={form.phone}
                        onChange={(event) => setField("phone", event.target.value)}
                        placeholder="+90 (5XX) XXX XX XX"
                        className="h-[46px] rounded-[14px] border-[#dfe7f7] pl-4 text-sm"
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
                    <div className="rounded-[14px] border border-[#e4ebfb] bg-[#f8fbff] px-3 py-2 text-[12px] text-[#5f7092]">
                      Şifreniz en az 8 karakter içermelidir.
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="grid gap-3 md:grid-cols-3">
                    {PURPOSE_CARDS.map((item) => {
                      const Icon = item.icon;
                      const active = form.purpose === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setField("purpose", item.id)}
                          className={cn(
                            "rounded-[20px] border p-4 text-left transition",
                            active
                              ? "border-[#295ae7] bg-[#f5f8ff] shadow-[0_18px_36px_rgba(41,90,231,0.12)]"
                              : "border-[#e0e8f8] bg-white hover:border-[#bfd0ff]",
                          )}
                        >
                          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef3ff] text-[#2859e7]">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="text-[17px] font-bold text-[#20325b]">{item.title}</div>
                          <p className="mt-1.5 text-[13px] leading-5 text-[#677892]">
                            {item.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}

                {step === 3 && form.purpose === "personal" && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Meslek / Görev" icon={BriefcaseBusiness}>
                      <Input
                        value={form.profession}
                        onChange={(event) => setField("profession", event.target.value)}
                        placeholder="Hemşire, doktor, tekniker..."
                        className="h-[46px] rounded-[14px] border-[#dfe7f7] pl-4 text-sm"
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
                    <div className="rounded-[18px] border border-[#dce8ff] bg-[#f8fbff] p-4 text-[13px] leading-6 text-[#5e6f90]">
                      Bu akış sonunda kişisel takviminiz, OCR içe aktarma ve fairness
                      analizi için hazır olacaktır.
                    </div>
                  </div>
                )}

                {step === 3 && form.purpose === "manager" && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Kurum Adı" icon={Building2}>
                      <Input
                        value={form.organizationName}
                        onChange={(event) =>
                          setField("organizationName", event.target.value)
                        }
                        placeholder="Ör. Gölhisar Devlet Hastanesi"
                        className="h-[46px] rounded-[14px] border-[#dfe7f7] pl-4 text-sm"
                      />
                    </Field>
                    <Field label="Birim Adı" icon={Users}>
                      <Input
                        value={form.unitName}
                        onChange={(event) => setField("unitName", event.target.value)}
                        placeholder="Ör. Ameliyathane"
                        className="h-[46px] rounded-[14px] border-[#dfe7f7] pl-4 text-sm"
                      />
                    </Field>
                    <Field label="Birim Türü" icon={BriefcaseBusiness}>
                      <Input
                        value={form.unitType}
                        onChange={(event) => setField("unitType", event.target.value)}
                        placeholder="Anestezi / Acil / Yoğun Bakım"
                        className="h-[46px] rounded-[14px] border-[#dfe7f7] pl-4 text-sm"
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
                  <div className="grid gap-4 md:grid-cols-[1fr_240px]">
                    <Field label="Davet Kodu" icon={Users}>
                      <Input
                        value={form.inviteCode}
                        onChange={(event) => setField("inviteCode", event.target.value)}
                        placeholder="Ör. MEDI-2026-ACIL"
                        className="h-[56px] rounded-[18px] border-[#dfe7f7] pl-5 text-base"
                      />
                    </Field>
                    <div className="rounded-[18px] border border-[#dce8ff] bg-[#f8fbff] p-4 text-[13px] leading-6 text-[#5e6f90]">
                      Davet kodu ile mevcut birime çalışan olarak katılırsınız. Yetkileriniz
                      birim daveti üzerinden tanımlanır.
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4">
                    <div className="rounded-[20px] border border-[#dce6ff] bg-[#f8fbff] p-4">
                      <div className="text-xs font-semibold text-[#6c7a95]">Seçilen akış</div>
                      <div className="mt-1.5 text-[20px] font-bold text-[#20325b]">
                        {PURPOSE_CARDS.find((item) => item.id === form.purpose)?.title ?? "—"}
                      </div>
                      <p className="mt-1.5 text-[13px] leading-6 text-[#607190]">{accountSummary}</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[1fr_200px]">
                      <div className="rounded-[20px] border border-[#e1e9ff] bg-white p-4">
                        <div className="mb-2.5 text-xs font-semibold text-[#6c7a95]">
                          Hesap özeti
                        </div>
                        <dl className="space-y-3 text-sm text-[#435473]">
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

                      <div className="overflow-hidden rounded-[20px] border border-[#e1e9ff] bg-white p-2.5">
                        <div className="relative aspect-[1680/945] w-full overflow-hidden rounded-[14px]">
                          <Image
                            src="/images/signup/signup-architecture-diagram.png"
                            alt="Mimari diyagram"
                            fill
                            className="object-cover object-left-top"
                            sizes="200px"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {error ? (
                  <p className="mt-4 rounded-[14px] border border-[#f7d1d1] bg-[#fff5f5] px-3.5 py-2.5 text-[13px] text-[#b24c4c]">
                    {error}
                  </p>
                ) : null}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[13px] text-[#74839d]">
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
                        className="h-10 rounded-[14px] border-[#d9e4ff] px-5 text-sm text-[#355287]"
                      >
                        Geri
                      </Button>
                    )}

                    {step === 1 && (
                      <Button
                        type="button"
                        onClick={nextStep}
                        disabled={!canProceedStep1}
                        className="h-10 rounded-[14px] bg-[#295ae7] px-5 text-sm font-bold"
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
                        className="h-10 rounded-[14px] bg-[#295ae7] px-5 text-sm font-bold"
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
                        className="h-10 rounded-[14px] bg-[#295ae7] px-5 text-sm font-bold"
                      >
                        Özeti Gör
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}

                    {step === 4 && (
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="h-10 rounded-[14px] bg-[#295ae7] px-5 text-sm font-bold"
                      >
                        {submitting ? "Kaydediliyor..." : "Kayıt Ol"}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            )}
          </div>
        </section>
      </section>
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
        className="h-[46px] rounded-[14px] border-[#dfe7f7] pl-4 pr-10 text-sm"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c99b0]"
        aria-label={visible ? "Şifreyi gizle" : "Şifreyi göster"}
      >
        {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
      className="h-[46px] w-full rounded-[14px] border border-[#dfe7f7] bg-white px-4 text-sm text-[#24365b] outline-none"
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
    <div className="grid gap-2.5 md:grid-cols-[48px_1fr] md:items-end">
      <div className="hidden h-[46px] w-[46px] items-center justify-center rounded-[14px] border border-[#e2e9fb] bg-[#f7faff] text-[#295ae7] md:flex">
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-1.5">
        <label className="text-[13px] font-semibold text-[#31456e]">{label}</label>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[16px] border border-[#edf2ff] bg-[#fbfcff] px-4 py-3">
      <dt className="font-medium text-[#6d7f9f]">{label}</dt>
      <dd className="text-right font-semibold text-[#20325b]">{value}</dd>
    </div>
  );
}
