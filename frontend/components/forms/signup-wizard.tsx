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
    title: "Kişisel Takvim",
    description: "Kendi çalışma listemi takip etmek istiyorum.",
    icon: User,
  },
  {
    id: "manager",
    title: "Birim Yönetimi",
    description: "Ekibimin vardiya planlamasını yönetmek istiyorum.",
    icon: Building2,
  },
  {
    id: "invite",
    title: "Davet ile Katılım",
    description: "Bir birime davet kodu ile katılmak istiyorum.",
    icon: Users,
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

export function SignupWizard() {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUsername, setCreatedUsername] = useState<string | null>(null);

  const canProceedStep1 = useMemo(() => {
    return (
      form.fullName.trim().length >= 3 &&
      form.email.trim().length > 5 &&
      form.password.length >= 8 &&
      form.password === form.confirmPassword
    );
  }, [form]);

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

      <section className="mx-auto grid min-h-[calc(100dvh-32px)] w-full max-w-[1380px] overflow-hidden rounded-[32px] border border-[#dfe8ff] bg-white shadow-[0_32px_90px_rgba(53,85,176,0.12)] lg:grid-cols-[0.96fr_1.04fr]">
        <aside className="relative hidden overflow-hidden lg:block">
          <Image
            src="/images/signup/signup-panel-bg.png"
            alt="MediPlan arka plan görseli"
            fill
            className="pointer-events-none object-cover object-center"
            sizes="(min-width: 1024px) 560px, 100vw"
            priority
          />
        </aside>

        <section className="flex min-w-0 flex-col justify-center bg-white px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto w-full max-w-[760px]">
            <div className="mb-8 grid grid-cols-4 gap-2 sm:gap-4">
              {STEPS.map((item) => {
                const isActive = step === item.id;
                const isDone = step > item.id || (item.id === 4 && createdUsername);
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition",
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
                          "text-[15px] font-semibold",
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
              <div className="rounded-[30px] border border-[#deebff] bg-[#f8fbff] p-8 shadow-[0_20px_60px_rgba(53,85,176,0.08)]">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9f1ff] text-[#2759e7]">
                  <Check className="h-7 w-7" />
                </div>
                <h1 className="text-[44px] font-extrabold tracking-[-0.05em] text-[#1d2e52]">
                  Hesabınız hazır
                </h1>
                <p className="mt-3 max-w-[560px] text-lg leading-8 text-[#607190]">
                  Kayıt tamamlandı. Giriş ekranında kullanıcı adı olarak e-posta
                  adresinizi kullanabilirsiniz.
                </p>
                <div className="mt-6 rounded-[22px] border border-[#dbe7ff] bg-white p-5">
                  <div className="text-sm font-semibold text-[#70809d]">Giriş bilgisi</div>
                  <div className="mt-2 text-[22px] font-bold text-[#1d2e52]">
                    {createdUsername}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#667792]">{accountSummary}</p>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/login"
                    className="inline-flex h-14 items-center justify-center rounded-2xl bg-[#2759e7] px-8 text-base font-bold text-white shadow-[0_14px_32px_rgba(39,89,231,0.28)]"
                  >
                    Giriş Yap
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex h-14 items-center justify-center rounded-2xl border border-[#d7e3ff] px-8 text-base font-semibold text-[#2b467e]"
                  >
                    Landing Sayfasına Dön
                  </Link>
                </div>
              </div>
            ) : (
              <form
                className="rounded-[32px] border border-[#e1e9ff] bg-white px-5 py-6 shadow-[0_24px_70px_rgba(53,85,176,0.08)] sm:px-8 lg:px-10 lg:py-8"
                onSubmit={handleSubmit}
              >
                <div className="mb-8">
                  <h1 className="text-[clamp(38px,5vw,62px)] font-extrabold tracking-[-0.05em] text-[#1d2e52]">
                    {step === 1
                      ? "Hesap oluşturun"
                      : step === 2
                        ? "Kullanım amacınızı seçin"
                        : step === 3
                          ? "Kurulum detaylarını tamamlayın"
                          : "Kurulumu gözden geçirin"}
                  </h1>
                  <p className="mt-3 text-[17px] leading-7 text-[#6c7c98]">
                    {step === 1 &&
                      "MediPlan’a hoş geldiniz. Temel hesap bilgilerinizi girerek başlayın."}
                    {step === 2 &&
                      "Sistemi hangi bağlamda kullanacağınızı seçin. Bu seçim sonraki akışı belirler."}
                    {step === 3 &&
                      "Seçtiğiniz kullanım amacına göre gerekli alanları tamamlayın."}
                    {step === 4 &&
                      "Kaydı tamamlamadan önce yol haritanızı ve seçtiğiniz akışı kontrol edin."}
                  </p>
                </div>

                {step === 1 && (
                  <div className="space-y-5">
                    <Field label="Ad Soyad" icon={User}>
                      <Input
                        value={form.fullName}
                        onChange={(event) => setField("fullName", event.target.value)}
                        placeholder="Adınızı ve soyadınızı girin"
                        className="h-[60px] rounded-[18px] border-[#dfe7f7] pl-5 text-base"
                      />
                    </Field>
                    <Field label="E-posta" icon={Mail}>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(event) => setField("email", event.target.value)}
                        placeholder="ornek@email.com"
                        className="h-[60px] rounded-[18px] border-[#dfe7f7] pl-5 text-base"
                      />
                    </Field>
                    <Field label="Telefon Numarası (Opsiyonel)" icon={Phone}>
                      <Input
                        value={form.phone}
                        onChange={(event) => setField("phone", event.target.value)}
                        placeholder="+90 (5XX) XXX XX XX"
                        className="h-[60px] rounded-[18px] border-[#dfe7f7] pl-5 text-base"
                      />
                    </Field>
                    <Field label="Şifre" icon={Lock}>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          onChange={(event) => setField("password", event.target.value)}
                          placeholder="En az 8 karakter"
                          className="h-[60px] rounded-[18px] border-[#dfe7f7] pl-5 pr-12 text-base"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8c99b0]"
                          aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </Field>
                    <Field label="Şifre (Tekrar)" icon={Lock}>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          value={form.confirmPassword}
                          onChange={(event) =>
                            setField("confirmPassword", event.target.value)
                          }
                          placeholder="Şifrenizi tekrar giriniz"
                          className="h-[60px] rounded-[18px] border-[#dfe7f7] pl-5 pr-12 text-base"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((current) => !current)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8c99b0]"
                          aria-label={
                            showConfirmPassword ? "Şifreyi gizle" : "Şifreyi göster"
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </Field>
                    <div className="rounded-[18px] border border-[#e4ebfb] bg-[#f8fbff] px-4 py-3 text-sm text-[#5f7092]">
                      Şifreniz en az 8 karakter içermelidir.
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="grid gap-4 md:grid-cols-3">
                    {PURPOSE_CARDS.map((item) => {
                      const Icon = item.icon;
                      const active = form.purpose === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setField("purpose", item.id)}
                          className={cn(
                            "rounded-[24px] border p-5 text-left transition",
                            active
                              ? "border-[#295ae7] bg-[#f5f8ff] shadow-[0_18px_36px_rgba(41,90,231,0.12)]"
                              : "border-[#e0e8f8] bg-white hover:border-[#bfd0ff]",
                          )}
                        >
                          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#2859e7]">
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="text-xl font-bold text-[#20325b]">{item.title}</div>
                          <p className="mt-2 text-sm leading-6 text-[#677892]">
                            {item.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}

                {step === 3 && form.purpose === "personal" && (
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Meslek / Görev" icon={BriefcaseBusiness}>
                      <Input
                        value={form.profession}
                        onChange={(event) => setField("profession", event.target.value)}
                        placeholder="Hemşire, doktor, tekniker..."
                        className="h-[56px] rounded-[18px] border-[#dfe7f7] pl-5 text-base"
                      />
                    </Field>
                    <Field label="Çalışma Modeli" icon={Clock3}>
                      <select
                        value={form.workModel}
                        onChange={(event) => setField("workModel", event.target.value)}
                        className="h-[56px] w-full rounded-[18px] border border-[#dfe7f7] bg-white px-5 text-base text-[#24365b] outline-none"
                      >
                        <option>Mesaili</option>
                        <option>Nöbetli</option>
                        <option>Karma</option>
                      </select>
                    </Field>
                    <Field label="Liste Aktarma Yöntemi" icon={FileUp}>
                      <select
                        value={form.importMethod}
                        onChange={(event) => setField("importMethod", event.target.value)}
                        className="h-[56px] w-full rounded-[18px] border border-[#dfe7f7] bg-white px-5 text-base text-[#24365b] outline-none"
                      >
                        <option>Şimdilik boş başla</option>
                        <option>Fotoğraf yükle</option>
                        <option>PDF / Excel yükle</option>
                        <option>Manuel takvimden ekle</option>
                      </select>
                    </Field>
                    <div className="rounded-[22px] border border-[#dce8ff] bg-[#f8fbff] p-5 text-sm leading-7 text-[#5e6f90]">
                      Bu akış sonunda kişisel takviminiz, OCR içe aktarma ve fairness
                      analizi için hazır olacaktır.
                    </div>
                  </div>
                )}

                {step === 3 && form.purpose === "manager" && (
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Kurum Adı" icon={Building2}>
                      <Input
                        value={form.organizationName}
                        onChange={(event) =>
                          setField("organizationName", event.target.value)
                        }
                        placeholder="Ör. Gölhisar Devlet Hastanesi"
                        className="h-[56px] rounded-[18px] border-[#dfe7f7] pl-5 text-base"
                      />
                    </Field>
                    <Field label="Birim Adı" icon={Users}>
                      <Input
                        value={form.unitName}
                        onChange={(event) => setField("unitName", event.target.value)}
                        placeholder="Ör. Ameliyathane"
                        className="h-[56px] rounded-[18px] border-[#dfe7f7] pl-5 text-base"
                      />
                    </Field>
                    <Field label="Birim Türü" icon={BriefcaseBusiness}>
                      <Input
                        value={form.unitType}
                        onChange={(event) => setField("unitType", event.target.value)}
                        placeholder="Anestezi / Acil / Yoğun Bakım"
                        className="h-[56px] rounded-[18px] border-[#dfe7f7] pl-5 text-base"
                      />
                    </Field>
                    <Field label="Çalışma Modeli" icon={CalendarClock}>
                      <select
                        value={form.workModel}
                        onChange={(event) => setField("workModel", event.target.value)}
                        className="h-[56px] w-full rounded-[18px] border border-[#dfe7f7] bg-white px-5 text-base text-[#24365b] outline-none"
                      >
                        <option>24 saat nöbet + 8 saat mesai</option>
                        <option>Standart vardiyalı çalışma</option>
                        <option>Esnek karma sistem</option>
                      </select>
                    </Field>
                  </div>
                )}

                {step === 3 && form.purpose === "invite" && (
                  <div className="grid gap-5 md:grid-cols-[1fr_320px]">
                    <Field label="Davet Kodu" icon={Users}>
                      <Input
                        value={form.inviteCode}
                        onChange={(event) => setField("inviteCode", event.target.value)}
                        placeholder="Ör. MEDI-2026-ACIL"
                        className="h-[56px] rounded-[18px] border-[#dfe7f7] pl-5 text-base"
                      />
                    </Field>
                    <div className="rounded-[22px] border border-[#dce8ff] bg-[#f8fbff] p-5 text-sm leading-7 text-[#5e6f90]">
                      Davet kodu ile mevcut birime çalışan olarak katılırsınız. Yetkileriniz
                      birim daveti üzerinden tanımlanır.
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-5">
                    <div className="rounded-[24px] border border-[#dce6ff] bg-[#f8fbff] p-5">
                      <div className="text-sm font-semibold text-[#6c7a95]">Seçilen akış</div>
                      <div className="mt-2 text-2xl font-bold text-[#20325b]">
                        {PURPOSE_CARDS.find((item) => item.id === form.purpose)?.title ?? "—"}
                      </div>
                      <p className="mt-2 text-sm leading-7 text-[#607190]">{accountSummary}</p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-[1fr_260px]">
                      <div className="rounded-[24px] border border-[#e1e9ff] bg-white p-5">
                        <div className="mb-3 text-sm font-semibold text-[#6c7a95]">
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

                      <div className="overflow-hidden rounded-[24px] border border-[#e1e9ff] bg-white p-3">
                        <div className="relative aspect-[1680/945] w-full overflow-hidden rounded-[16px]">
                          <Image
                            src="/images/signup/signup-architecture-diagram.png"
                            alt="Mimari diyagram"
                            fill
                            className="object-cover object-left-top"
                            sizes="260px"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {error ? (
                  <p className="mt-5 rounded-[16px] border border-[#f7d1d1] bg-[#fff5f5] px-4 py-3 text-sm text-[#b24c4c]">
                    {error}
                  </p>
                ) : null}

                <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-[#74839d]">
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
                        className="h-12 rounded-[16px] border-[#d9e4ff] px-6 text-[#355287]"
                      >
                        Geri
                      </Button>
                    )}

                    {step === 1 && (
                      <Button
                        type="button"
                        onClick={nextStep}
                        disabled={!canProceedStep1}
                        className="h-12 rounded-[16px] bg-[#295ae7] px-6 text-base font-bold"
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
                        className="h-12 rounded-[16px] bg-[#295ae7] px-6 text-base font-bold"
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
                        className="h-12 rounded-[16px] bg-[#295ae7] px-6 text-base font-bold"
                      >
                        Özeti Gör
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}

                    {step === 4 && (
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="h-12 rounded-[16px] bg-[#295ae7] px-8 text-base font-bold"
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
    <div>
      <label className="mb-2 block text-[15px] font-bold text-[#4e6187]">{label}</label>
      <div className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#f3f7ff] text-[#295ae7]">
          <Icon className="h-6 w-6" />
        </div>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[#74839d]">{label}</dt>
      <dd className="text-right font-semibold text-[#20325b]">{value}</dd>
    </div>
  );
}

export default SignupWizard;
