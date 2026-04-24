import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  Clock3,
  Cloud,
  Headphones,
  LockKeyhole,
  MessageSquareMore,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

import { HeroPreviewCarousel } from "@/components/landing/hero-preview-carousel";
import { TypewriterHeading } from "@/components/landing/typewriter-heading";

const features: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: "Zaman Kazand\u0131r\u0131r",
    description:
      "Otomatik planlama ile saatler s\u00fcren i\u015flemleri dakikalara indirir.",
    icon: Clock3,
  },
  {
    title: "Adil ve \u015eeffaf",
    description:
      "N\u00f6bet ve izin da\u011f\u0131l\u0131m\u0131n\u0131 adil \u015fekilde yapar. Herkes s\u00fcreci g\u00f6rebilir.",
    icon: Users,
  },
  {
    title: "Hata ve \u00c7ak\u0131\u015fma Azalt\u0131r",
    description:
      "Otomatik kontroller sayesinde \u00e7ak\u0131\u015fmalar ve hatal\u0131 planlamalar \u00f6nlenir.",
    icon: ShieldCheck,
  },
  {
    title: "Veriye Dayal\u0131 Y\u00f6netim",
    description:
      "Detayl\u0131 raporlar ve analizlerle daha iyi kararlar al\u0131n, performans\u0131 art\u0131r\u0131n.",
    icon: BarChart3,
  },
  {
    title: "Etkili \u0130leti\u015fim",
    description:
      "Ekip i\u00e7i ileti\u015fimi g\u00fc\u00e7lendirir, bilgi ak\u0131\u015f\u0131n\u0131 kolayla\u015ft\u0131r\u0131r, i\u015f birli\u011fini art\u0131r\u0131r.",
    icon: MessageSquareMore,
  },
];

const teamHours = [
  { name: "Mehmet Kaya", hours: 208, width: "88%" },
  { name: "Ay\u015fe Demir", hours: 192, width: "81%" },
  { name: "Deniz Arslan", hours: 180, width: "74%" },
  { name: "Mustafa Bedir", hours: 176, width: "70%" },
  { name: "Zeynep Aksoy", hours: 160, width: "63%" },
];

const steps = [
  {
    step: "1",
    title: "Kay\u0131t Olun",
    description:
      "Y\u00f6netici olarak sisteme kaydolun ve ilk y\u00f6netici hesab\u0131n\u0131z\u0131 olu\u015fturun.",
    icon: UserPlus,
  },
  {
    step: "2",
    title: "Birim Olu\u015fturun",
    description:
      "Hastanenize ait birimi olu\u015fturun ve ekibinizi sisteme davet edin.",
    icon: Building2,
  },
  {
    step: "3",
    title: "Planlamaya Ba\u015flay\u0131n",
    description:
      "Vardiya, n\u00f6bet ve izin planlamalar\u0131n\u0131z\u0131 kolayca olu\u015fturun ve y\u00f6netin.",
    icon: CalendarDays,
  },
];

const footerHighlights = [
  {
    title: "G\u00fcvenli ve KVKK Uyumlu",
    description: "Verileriniz en y\u00fcksek g\u00fcvenlik standartlar\u0131nda korunur.",
    icon: LockKeyhole,
  },
  {
    title: "Bulut Tabanl\u0131",
    description: "\u0130nternetin oldu\u011fu her yerden eri\u015fim sa\u011flay\u0131n.",
    icon: Cloud,
  },
  {
    title: "7/24 Destek",
    description: "Ekibimiz her zaman yan\u0131n\u0131zda, kesintisiz destek sa\u011flar.",
    icon: Headphones,
  },
  {
    title: "S\u00fcrekli G\u00fcncel",
    description: "Yeni \u00f6zellikler ve iyile\u015ftirmelerle sistem her g\u00fcn daha iyi.",
    icon: Sparkles,
  },
];

const heroPreviewItems = [
  {
    src: "/images/hero-schedule-board-v7.svg",
    alt: "MediShift vardiya planı önizlemesi",
    title: "Vardiya planı genel görünümü",
    width: 440,
    height: 350,
  },
  {
    src: "/images/hero-preview-chat.png",
    alt: "MediShift mesajlaşma ekranı önizlemesi",
    title: "Ekip içi iletişim",
    width: 1536,
    height: 1024,
  },
  {
    src: "/images/hero-preview-analytics.png",
    alt: "MediShift analiz paneli önizlemesi",
    title: "Canlı analiz ve performans",
    width: 1536,
    height: 1024,
  },
  {
    src: "/images/hero-preview-swap.png",
    alt: "MediShift vardiya değişim ekranı önizlemesi",
    title: "Vardiya değişim akışı",
    width: 1536,
    height: 1024,
  },
] as const;

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#d8e2ff] bg-[#eef3ff] px-3 py-1 text-xs font-semibold text-[#4d6be5]">
      {children}
    </span>
  );
}

function FeatureCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-[24px] border border-[#e8eefc] bg-white p-6 text-center shadow-[0_18px_45px_rgba(60,88,177,0.08)]">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#4d6be5]">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-3 text-xl font-bold text-[#18284d]">{title}</h3>
      <p className="text-sm leading-7 text-[#6d7b9c]">{description}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="overflow-x-hidden bg-[#f6f8fe] text-[#14213d]">
      <div className="-ml-[5%] [width:110%] [zoom:1.1]">
        <section className="min-h-[100svh] overflow-hidden rounded-b-[36px] bg-[linear-gradient(135deg,#4f6df7_0%,#5d7cff_42%,#7ea0ff_100%)] text-white">
          <div className="mx-auto flex min-h-[100svh] w-full max-w-[1280px] flex-col px-5 pb-10 pt-4 sm:px-6 md:pb-12 lg:px-8 lg:pb-16 lg:pt-6">
            <header className="flex items-center justify-between gap-4 py-4 lg:py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/14">
                  <Image
                    src="/icons/medishift-icon-selected.svg"
                    alt="MediShift logo"
                    width={28}
                    height={28}
                    className="navbar-logo-spin h-7 w-7"
                  />
                </div>
                <span className="text-[30px] font-extrabold tracking-tight">MediShift</span>
              </div>

              <nav className="hidden items-center gap-10 text-sm font-medium text-white/90 md:flex">
                <a href="#features" className="transition hover:text-white">
                  {"\u00d6zellikler"}
                </a>
                <a href="#how-it-works" className="transition hover:text-white">
                  {"Nas\u0131l \u00c7al\u0131\u015f\u0131r?"}
                </a>
                <a href="#about" className="transition hover:text-white">
                  {"Hakk\u0131m\u0131zda"}
                </a>
                <a href="#faq" className="transition hover:text-white">
                  SSS
                </a>
              </nav>

              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/25 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {"Giri\u015f Yap"}
              </Link>
            </header>


            <div className="grid flex-1 content-center items-center gap-10 py-8 md:gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:py-12">
              <div className="max-w-[560px]">
                <div className="mb-6">
                  <SectionEyebrow>{"Yeni Nesil Vardiya Y\u00f6netimi"}</SectionEyebrow>
                </div>

                <h1 className="max-w-[560px] text-[clamp(42px,5vw,74px)] font-black leading-[0.96] tracking-tight">
                  <TypewriterHeading
                    prefixText={"Ak\u0131ll\u0131 vardiya planlama, "}
                    transientText={"m\u00fckemmel bir "}
                    finalText={"dengeli bir \u00e7al\u0131\u015fma d\u00fczeni"}
                    typingSpeedMs={46}
                    deletingSpeedMs={28}
                    pauseMs={760}
                  />
                </h1>

                <p className="mt-7 max-w-[520px] text-[clamp(16px,2vw,22px)] leading-8 text-white/88">
                  {
                    "MediShift, hastanelerde vardiya planlamay\u0131 kolayla\u015ft\u0131r\u0131r. Adil, \u015feffaf ve verimli bir sistemle hem y\u00f6neticilerin i\u015f y\u00fck\u00fcn\u00fc azalt\u0131r hem de \u00e7al\u0131\u015fan memnuniyetini art\u0131r\u0131r."
                  }
                </p>

                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <Link
                    href="/login"
                    className="inline-flex h-14 items-center justify-center rounded-2xl bg-white px-8 text-base font-bold text-[#3f63ea] shadow-[0_18px_35px_rgba(28,52,125,0.25)] transition hover:-translate-y-0.5"
                  >
                    {"Hemen Kay\u0131t Ol"}
                  </Link>
                  <a
                    href="#how-it-works"
                    className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/30 px-8 text-base font-semibold text-white transition hover:bg-white/10"
                  >
                    {"Nas\u0131l \u00c7al\u0131\u015f\u0131r?"}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>

                <div className="mt-10 flex flex-wrap gap-x-7 gap-y-4 text-sm font-medium text-white/90">
                  <span className="flex items-center gap-2">
                    <LockKeyhole className="h-4 w-4" />
                    {"KVKK Uyumlu"}
                  </span>
                  <span className="flex items-center gap-2">
                    <Headphones className="h-4 w-4" />
                    {"7/24 Destek"}
                  </span>
                  <span className="flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    {"Bulut Tabanl\u0131"}
                  </span>
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    {"G\u00fcvenli Altyap\u0131"}
                  </span>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-[620px]">
                <div className="hero-board-glow absolute left-[-2%] top-[58%] h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                <div className="hero-board-float relative">
                  <div className="hero-board-glass rounded-[23px] p-2 md:p-3">
                    <HeroPreviewCarousel items={[...heroPreviewItems]} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="mx-auto w-full max-w-[1280px] px-5 py-20 sm:px-6 lg:px-8"
        >
          <div className="text-center">
            <SectionEyebrow>{"Neden MediShift?"}</SectionEyebrow>
            <h2 className="mx-auto mt-5 max-w-[760px] text-[clamp(30px,4vw,52px)] font-black leading-tight text-[#16274d]">
              {"Y\u00f6neticiler i\u00e7in g\u00fc\u00e7l\u00fc, ekipler i\u00e7in adil bir sistem"}
            </h2>
            <p className="mx-auto mt-5 max-w-[760px] text-lg leading-8 text-[#67789f]">
              {
                "MediShift, vardiya planlaman\u0131n t\u00fcm zorluklar\u0131n\u0131 \u00e7\u00f6zer. Zaman kazand\u0131r\u0131r, hatalar\u0131 azalt\u0131r ve herkese e\u015fit f\u0131rsatlar sunar."
              }
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </section>

        <section id="about" className="bg-white pb-10 pt-10">
          <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 lg:px-8">
            <div className="text-center">
              <SectionEyebrow>
                {"Performans\u0131 Anlay\u0131n, Y\u00f6netimi G\u00fc\u00e7lendirin"}
              </SectionEyebrow>
              <h2 className="mx-auto mt-5 max-w-[820px] text-[clamp(30px,4vw,52px)] font-black leading-tight text-[#16274d]">
                {"Birim ve personel performans\u0131n\u0131 anl\u0131k takip edin"}
              </h2>
              <p className="mx-auto mt-5 max-w-[760px] text-lg leading-8 text-[#67789f]">
                {
                  "Ger\u00e7ek zamanl\u0131 verilerle daha do\u011fru kararlar al\u0131n, kaynaklar\u0131 en verimli \u015fekilde y\u00f6netin."
                }
              </p>
            </div>

            <div className="mt-14 grid gap-5 xl:grid-cols-3">
              <div className="flex h-full flex-col rounded-[28px] border border-[#e8eefc] bg-[#fdfefe] p-6 shadow-[0_18px_45px_rgba(60,88,177,0.08)]">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#18284d]">
                    {"Birim Performans\u0131"}
                  </h3>
                  <span className="rounded-xl border border-[#dce4fb] bg-white px-3 py-2 text-xs font-semibold text-[#7b88a8]">
                    {"Bu Ay"}
                  </span>
                </div>

                <div className="flex flex-1 flex-col justify-center">
                  <div className="flex flex-col items-center gap-8 sm:flex-row">
                    <div className="relative h-40 w-40 rounded-full bg-[conic-gradient(#5a6ff6_0_35%,#8f67ff_35%_60%,#19c2b0_60%_80%,#62a4ff_80%_100%)] p-5">
                      <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white text-center">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#98a4c4]">
                          {"Toplam"}
                        </span>
                        <strong className="mt-1 text-[34px] font-black text-[#16274d]">
                          2.288
                        </strong>
                        <span className="text-sm text-[#6c7b9f]">{"Saat"}</span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-3 text-sm text-[#5f7095]">
                      <div className="flex justify-between">
                        <span className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#5a6ff6]" />
                          {"Ameliyathane"}
                        </span>
                        <span>35%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#8f67ff]" />
                          {"Yo\u011fun Bak\u0131m"}
                        </span>
                        <span>25%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#19c2b0]" />
                          {"Acil Servis"}
                        </span>
                        <span>20%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#62a4ff]" />
                          {"Poliklinik"}
                        </span>
                        <span>20%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-[#e8eefc] bg-[#fdfefe] p-6 shadow-[0_18px_45px_rgba(60,88,177,0.08)]">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#18284d]">
                    {"Personel Performans\u0131"}
                  </h3>
                  <span className="rounded-xl border border-[#dce4fb] bg-white px-3 py-2 text-xs font-semibold text-[#7b88a8]">
                    {"Bu Ay"}
                  </span>
                </div>
                <div className="space-y-5">
                  {teamHours.map((person) => (
                    <div key={person.name}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-semibold text-[#22345c]">{person.name}</span>
                        <span className="text-[#7080a5]">{person.hours} saat</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#edf2fd]">
                        <div
                          className="h-2 rounded-full bg-[linear-gradient(90deg,#5d72fb_0%,#7f68ff_100%)]"
                          style={{ width: person.width }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-[#e8eefc] bg-[#fdfefe] p-6 shadow-[0_18px_45px_rgba(60,88,177,0.08)]">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#18284d]">
                    {"N\u00f6bet Da\u011f\u0131l\u0131m\u0131"}
                  </h3>
                  <span className="rounded-xl border border-[#dce4fb] bg-white px-3 py-2 text-xs font-semibold text-[#7b88a8]">
                    {"Bu Ay"}
                  </span>
                </div>

                <div className="mb-5 flex gap-5 text-xs font-semibold text-[#7b88a8]">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#6d77ff]" />
                    {"Planlanan"}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#61c6ff]" />
                    {"Ger\u00e7ekle\u015fen"}
                  </span>
                </div>

                <div className="relative h-[240px] overflow-hidden rounded-[15px] bg-[linear-gradient(180deg,#f8faff_0%,#eef3ff_100%)] p-4">
                  <div className="absolute inset-x-4 top-4 border-t border-dashed border-[#d9e2fb]" />
                  <div className="absolute inset-x-4 top-16 border-t border-dashed border-[#d9e2fb]" />
                  <div className="absolute inset-x-4 top-28 border-t border-dashed border-[#d9e2fb]" />
                  <div className="absolute inset-x-4 top-40 border-t border-dashed border-[#d9e2fb]" />
                  <svg viewBox="0 10 320 150" className="h-full w-full">
                    <path
                      d="M10 120 C 45 60, 75 45, 110 75 S 175 145, 210 98 S 265 40, 310 86"
                      fill="none"
                      stroke="#6d77ff"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <path
                      d="M10 148 C 45 132, 75 112, 110 126 S 175 155, 210 116 S 265 95, 310 128"
                      fill="none"
                      stroke="#61c6ff"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="mt-0 flex justify-between px-2 text-[11px] font-semibold text-[#95a3c5]">
                    <span>1.Hafta</span>
                    <span>2.Hafta</span>
                    <span>3.Hafta</span>
                    <span>4.Hafta</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-0 pt-0">
          <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 lg:px-8">
            <div className="relative">
              <div className="pointer-events-none absolute inset-x-[0.4%] inset-y-[0.9%] -z-10 rounded-[28px] bg-[radial-gradient(circle_at_center,rgba(223,231,255,1)_0%,rgba(213,224,255,0.96)_36%,rgba(194,210,255,0.7)_60%,rgba(194,210,255,0.22)_82%,rgba(194,210,255,0)_100%)] blur-[28px]" />
              <Image
                src="/images/landing-communication-section.png"
                alt={"MediShift ileti\u015fim b\u00f6l\u00fcm\u00fc"}
                width={1600}
                height={900}
                className="relative z-10 block h-auto w-full"
              />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-10">
          <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 lg:px-8">
            <div className="text-center">
              <SectionEyebrow>{"Nas\u0131l \u00c7al\u0131\u015f\u0131r?"}</SectionEyebrow>
              <h2 className="mx-auto mt-5 max-w-[760px] text-[clamp(30px,4vw,52px)] font-black leading-tight text-[#16274d]">
                {"3 ad\u0131mda sisteme ba\u015flay\u0131n"}
              </h2>
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {steps.map((step) => (
                <div
                  key={step.step}
                  className="relative rounded-[26px] border border-[#e8eefc] bg-white p-8 text-center shadow-[0_18px_45px_rgba(60,88,177,0.08)]"
                >
                  <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#4f6df7] text-sm font-bold text-white">
                    {step.step}
                  </div>
                  <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#4d6be5]">
                    <step.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#18284d]">{step.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[#6d7b9c]">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-20 py-10">
          <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[30px] text-white shadow-[0_28px_70px_rgba(63,102,241,0.28)]">
              <Image
                src="/images/landing-cta-background-v3.png"
                alt={"MediShift CTA arka plan g\u00f6rseli"}
                fill
                sizes="(min-width: 1024px) 1280px, 100vw"
                className="object-cover object-left"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(67,102,239,0.16)_0%,rgba(63,102,241,0.10)_34%,rgba(63,102,241,0.08)_100%)]" />
              <div className="relative grid min-h-[208px] gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[260px_minmax(0,1fr)_auto] lg:items-center lg:px-12">
                <div className="hidden lg:block" />

                <div className="flex h-full items-center justify-center lg:justify-start">
                  <div className="max-w-[620px] text-center lg:text-left">
                    <h2 className="text-[clamp(30px,4vw,43px)] font-black leading-[1.03] tracking-[-0.04em]">
                      {"Ekibiniz i\u00e7in daha iyi bir \u00e7al\u0131\u015fma d\u00fczeni olu\u015fturun"}
                    </h2>
                    <p className="mt-3 max-w-[560px] text-lg leading-8 text-white/88 lg:max-w-[520px]">
                      {
                        "MediShift ile vardiya planlamay\u0131 kolayla\u015ft\u0131r\u0131n, \u00e7al\u0131\u015fan memnuniyetini art\u0131r\u0131n ve y\u00f6netimde fark yarat\u0131n."
                      }
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-1 lg:items-start">
                  <Link
                    href="/login"
                    className="inline-flex h-14 min-w-[175px] items-center justify-center gap-3 rounded-xl bg-white px-8 text-base font-bold text-[#4366ef] transition hover:-translate-y-0.5"
                  >
                    {"Hemen Kay\u0131t Ol"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <p className="text-center text-sm text-white/82 lg:text-left">
                    {"\u00dccretsiz deneyin, fark g\u00f6r\u00fcn."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-6">
          <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 lg:px-8">
            <div className="grid gap-4 rounded-[28px] border border-[#e3eafb] bg-[#f7f9ff] p-5 md:grid-cols-2 xl:grid-cols-4">
              {footerHighlights.map((item) => (
                <div
                  key={item.title}
                  className="flex min-h-[156px] items-center gap-4 rounded-[20px] bg-white px-5 py-5"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#4d6be5]">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className="flex min-h-[108px] flex-col justify-center">
                    <h3 className="text-base font-bold text-[#18284d]">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#6d7b9c]">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer id="faq" className="pb-10 pt-6">
          <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 lg:px-8">
            <div className="grid gap-10 rounded-[28px] bg-white px-8 py-10 shadow-[0_18px_45px_rgba(60,88,177,0.08)] lg:grid-cols-[1.2fr_repeat(4,0.8fr)]">
              <div>
                <div className="flex items-center gap-3 text-[#4165ef]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef3ff]">
                    <Image
                      src="/icons/medishift-icon-selected.svg"
                      alt="MediShift logo"
                      width={24}
                      height={24}
                      className="h-6 w-6"
                    />
                  </div>
                  <span className="text-[28px] font-extrabold tracking-tight">MediShift</span>
                </div>
                <p className="mt-5 max-w-[300px] text-sm leading-7 text-[#6d7b9c]">
                  {"Hastaneler i\u00e7in ak\u0131ll\u0131 vardiya planlama ve y\u00f6netim sistemi."}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#95a3c5]">
                  {"\u00dcr\u00fcn"}
                </h4>
                <ul className="mt-5 space-y-3 text-sm text-[#60739d]">
                  <li>
                    <a href="#features">{"\u00d6zellikler"}</a>
                  </li>
                  <li>
                    <a href="#how-it-works">{"Nas\u0131l \u00c7al\u0131\u015f\u0131r?"}</a>
                  </li>
                  <li>
                    <a href="#">{"Fiyatland\u0131rma"}</a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#95a3c5]">
                  {"\u015eirket"}
                </h4>
                <ul className="mt-5 space-y-3 text-sm text-[#60739d]">
                  <li>
                    <a href="#about">{"Hakk\u0131m\u0131zda"}</a>
                  </li>
                  <li>
                    <a href="#">Blog</a>
                  </li>
                  <li>
                    <a href="#">{"\u0130leti\u015fim"}</a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#95a3c5]">
                  {"Yard\u0131m"}
                </h4>
                <ul className="mt-5 space-y-3 text-sm text-[#60739d]">
                  <li>
                    <a href="#">SSS</a>
                  </li>
                  <li>
                    <a href="#">{"Kullan\u0131m K\u0131lavuzu"}</a>
                  </li>
                  <li>
                    <a href="#">Destek</a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#95a3c5]">
                  {"B\u00fcltene Abone Ol"}
                </h4>
                <p className="mt-5 text-sm leading-7 text-[#6d7b9c]">
                  {"Yeniliklerden haberdar olun."}
                </p>
                <div className="mt-4 flex overflow-hidden rounded-2xl border border-[#dce4fb] bg-[#f7f9ff]">
                  <input
                    type="email"
                    placeholder={"E-posta adresiniz"}
                    className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-[#95a3c5]"
                  />
                  <button className="flex h-12 w-12 items-center justify-center bg-[#4d6be5] text-white">
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-between gap-4 px-2 pb-2 pt-6 text-sm text-[#8b98b8] md:flex-row">
              <span>{"\u00a9 2026 MediShift. T\u00fcm haklar\u0131 sakl\u0131d\u0131r."}</span>
              <div className="flex flex-wrap items-center gap-6">
                <a href="#">KVKK</a>
                <a href="#">{"Gizlilik Politikas\u0131"}</a>
                <a href="#">{"Kullan\u0131m \u015eartlar\u0131"}</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
