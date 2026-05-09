"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ElementType, type ReactNode } from "react";
import {
  ArrowRight,
  Ambulance,
  Baby,
  BarChart3,
  Building2,
  CalendarDays,
  Check,
  Clock3,
  Cloud,
  Headphones,
  Info,
  LockKeyhole,
  Megaphone,
  MessageCircle,
  MessageSquareMore,
  Microscope,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserPlus,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { HeroPreviewCarousel } from "@/components/landing/hero-preview-carousel";
import { TypewriterHeading } from "@/components/landing/typewriter-heading";
import { DynamicNavigation } from "@/components/lightswind/dynamic-navigation";

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

const navigationLinks = [
  { id: "features", label: "\u00d6zellikler", href: "#features", icon: <Sparkles /> },
  { id: "how", label: "Nas\u0131l \u00c7al\u0131\u015f\u0131r?", href: "#how-it-works", icon: <CalendarDays /> },
  { id: "about", label: "Hakk\u0131m\u0131zda", href: "#about", icon: <Info /> },
  { id: "contact", label: "\u0130leti\u015fim", href: "#faq", icon: <Headphones /> },
];

type Announcement = {
  icon: ElementType;
  title: string;
  time: string;
  active?: boolean;
};

type ChatMessage = {
  name: string;
  text: string;
  time: string;
  avatar: string;
};

type DemoChatMessage = ChatMessage & {
  role: string;
};

type DemoChatGroup = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  unread: number;
  online: number;
  accent: string;
  messages: DemoChatMessage[];
};

const announcements: Announcement[] = [
  {
    icon: Megaphone,
    title: "Yıllık izin planlamaları başladı.",
    time: "Bugün, 09:15",
    active: true,
  },
  {
    icon: CalendarDays,
    title: "Eğitim toplantısı yapılacaktır.",
    time: "Dün, 14:30",
  },
  {
    icon: Wrench,
    title: "Sistem bakımı yapılacaktır.",
    time: "2 gün önce",
  },
];

const messages: ChatMessage[] = [
  {
    name: "Zeynep Erdem",
    text: "Yeni vardiya planı yayınlandı.",
    time: "10:24",
    avatar: "ZE",
  },
  {
    name: "Burak Yılmaz",
    text: "Teşekkürler, gördüm.",
    time: "10:25",
    avatar: "BY",
  },
  {
    name: "Merve Aksoy",
    text: "Ben de inceledim, her şey net.",
    time: "10:26",
    avatar: "MA",
  },
  {
    name: "Ahmet Kılıç",
    text: "Bilgi için teşekkürler.",
    time: "10:27",
    avatar: "AK",
  },
];

const demoChatGroups: DemoChatGroup[] = [
  {
    id: "anestezi",
    title: "Anestezi",
    description: "Ameliyathane koordinasyonu",
    icon: Stethoscope,
    unread: 3,
    online: 8,
    accent: "#4772e8",
    messages: [
      {
        name: "Elif \u00d6mercik",
        role: "Anestezi Uzm.",
        text: "Saat 11:00 vakas\u0131 i\u00e7in ekip haz\u0131r, preop notu eklendi.",
        time: "10:18",
        avatar: "E\u00d6",
      },
      {
        name: "Tayfun \u00c7etin",
        role: "Sor. Hem\u015fire",
        text: "Yo\u011fun bak\u0131m transferini onaylad\u0131m. Sedasyon ekibi beklemede.",
        time: "10:19",
        avatar: "T\u00c7",
      },
      {
        name: "Meryem Bing\u00f6l",
        role: "Planlama",
        text: "N\u00f6bet listesinde \u00e7ak\u0131\u015fma yok. \u0130kinci ekip 12:30'da devral\u0131yor.",
        time: "10:21",
        avatar: "MB",
      },
      {
        name: "H\u00fcseyin \u00d6zmen",
        role: "Doktor",
        text: "Tamam, ekip bilgisini duyuruya da sabitliyorum.",
        time: "10:22",
        avatar: "H\u00d6",
      },
    ],
  },
  {
    id: "acil-servis",
    title: "Acil Servis",
    description: "Triyaj ve n\u00f6bet ak\u0131\u015f\u0131",
    icon: Ambulance,
    unread: 5,
    online: 14,
    accent: "#ef4444",
    messages: [
      {
        name: "Demet \u00c7elik",
        role: "Acil Servis",
        text: "K\u0131rm\u0131z\u0131 alan i\u00e7in ek personel talebi olu\u015fturdum.",
        time: "10:24",
        avatar: "D\u00c7",
      },
      {
        name: "Emir Oral",
        role: "N\u00f6bet\u00e7i",
        text: "Ben 15 dakika i\u00e7inde destek verebilirim.",
        time: "10:25",
        avatar: "EO",
      },
      {
        name: "Yusuf Do\u011fan",
        role: "Birim Yetkilisi",
        text: "Talebi onaylad\u0131m. G\u00fcncel liste acil servis kanal\u0131nda.",
        time: "10:26",
        avatar: "YD",
      },
    ],
  },
  {
    id: "pediatri",
    title: "Pediatri",
    description: "G\u00fcnl\u00fck ekip mesajlar\u0131",
    icon: Baby,
    unread: 2,
    online: 11,
    accent: "#8b5cf6",
    messages: [
      {
        name: "Zeynep Aksoy",
        role: "Pediatri",
        text: "Poliklinik yo\u011funlu\u011fu 14:00 sonras\u0131 artacak gibi g\u00f6r\u00fcn\u00fcyor.",
        time: "10:28",
        avatar: "ZA",
      },
      {
        name: "Ay\u015fe Demir",
        role: "Hem\u015fire",
        text: "A\u015f\u0131 odas\u0131 i\u00e7in ikinci personeli plana ekledim.",
        time: "10:29",
        avatar: "AD",
      },
      {
        name: "Mehmet Kaya",
        role: "Uzman Dr.",
        text: "G\u00fczel. Vardiya sonu raporunu da pediatri kanal\u0131na atal\u0131m.",
        time: "10:31",
        avatar: "MK",
      },
    ],
  },
  {
    id: "laboratuvar",
    title: "Laboratuvar",
    description: "Sonu\u00e7 ve numune takibi",
    icon: Microscope,
    unread: 1,
    online: 6,
    accent: "#14b8a6",
    messages: [
      {
        name: "Murat \u015eahin",
        role: "Laboratuvar",
        text: "Acil numuneler i\u015flendi. Kritik de\u011ferler sisteme d\u00fc\u015ft\u00fc.",
        time: "10:33",
        avatar: "M\u015e",
      },
      {
        name: "G\u00fcl\u015fen Ora\u00e7k\u0131",
        role: "Teknisyen",
        text: "Raporlar\u0131 ilgili birimlere ilettim.",
        time: "10:34",
        avatar: "GO",
      },
    ],
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
    action: "Kay\u0131t Ol",
    href: "/signup",
  },
  {
    step: "2",
    title: "Birim Olu\u015fturun",
    description:
      "Hastanenize ait birimi olu\u015fturun ve ekibinizi sisteme davet edin.",
    icon: Building2,
    action: "Birim Olu\u015ftur",
    href: "/dashboard/units",
  },
  {
    step: "3",
    title: "Planlamaya Ba\u015flay\u0131n",
    description:
      "Vardiya, n\u00f6bet ve izin planlamalar\u0131n\u0131z\u0131 kolayca olu\u015fturun ve y\u00f6netin.",
    icon: CalendarDays,
    action: "Planlamaya Git",
    href: "/calendar",
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

function CommunicationShowcase() {
  return (
    <section className="mt-12 pb-0 pt-0">
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 lg:px-8">
        <div className="relative flex min-h-[442px] items-center overflow-hidden rounded-[28px] bg-[#eef2ff] px-7 py-7 shadow-[0_32px_100px_rgba(31,67,160,0.18)] sm:px-10 lg:px-16 lg:py-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,rgba(67,103,240,0.14),transparent_32%),radial-gradient(circle_at_8%_18%,rgba(255,255,255,0.85),transparent_30%)]" />

          <div className="relative z-10 grid w-full items-start gap-8 lg:grid-cols-[0.95fr_1.55fr] lg:gap-12">
            <div className="max-w-[350px]">
              <SectionEyebrow>
                {"Etkin İletişim"}
              </SectionEyebrow>

              <h2 className="mb-4 mt-10 text-[clamp(28px,3.5vw,36px)] font-black leading-[1.16] tracking-[-0.045em] text-[#14204a]">
                Kurum içi iletişimi tek platformda güçlendirin
              </h2>

              <p className="mb-6 max-w-[470px] text-base font-medium leading-7 text-[#66708c] lg:text-[16px]">
                Duyurular, hatırlatmalar ve hızlı mesajlaşma ile ekipler her zaman aynı bilgiye, aynı anda ulaşır.
              </p>

              <div className="space-y-3">
                {[
                  "Anlık duyuru ve bilgilendirme",
                  "Hızlı ve güvenli mesajlaşma",
                  "Okundu bilgisi ile tam kontrol",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-4">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#4772e8] text-white shadow-[0_8px_18px_rgba(71,114,232,0.3)]">
                      <Check className="h-4 w-4 stroke-[3]" />
                    </div>
                    <span className="text-base font-semibold text-[#303a58] lg:text-[16px]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="grid min-h-[408px] overflow-hidden rounded-[24px] border border-white/80 bg-white/90 shadow-[0_28px_80px_rgba(45,72,145,0.16)] backdrop-blur-xl md:grid-cols-[0.72fr_1.18fr]">
                <DemoChatPanel />
                <div className="hidden border-b border-[#edf1fb] p-5 md:border-b-0 md:border-r lg:p-6">
                  <h3 className="mb-4 text-[20px] font-black tracking-[-0.035em] text-[#172044]">Duyurular</h3>

                  <div className="space-y-2.5">
                    {announcements.map((item, index) => {
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.title}
                          className={[
                            "flex items-center gap-4 rounded-[12px] px-4 py-3 transition",
                            item.active ? "bg-[#eef1ff] shadow-sm" : "bg-transparent",
                            index !== announcements.length - 1 && !item.active ? "border-b border-[#eef1f7]" : "",
                          ].join(" ")}
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#4772e8] text-[#4772e8]">
                            <Icon className="h-[18px] w-[18px]" />
                          </div>

                          <div>
                            <p className="text-[15px] font-bold text-[#303853]">{item.title}</p>
                            <p className="mt-1.5 text-[12px] font-semibold text-[#8c94a8]">{item.time}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="relative hidden flex-col p-5">
                  <div className="mb-4 flex items-center gap-4 border-b border-[#eef1f7] pb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef2ff] text-[#4772e8]">
                      <Users className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="text-[20px] font-black tracking-[-0.035em] text-[#1b2344]">Genel Sohbet</h3>
                      <p className="text-sm font-semibold text-[#8b93a7]">12 üye</p>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2.5">
                    {messages.map((message) => (
                      <div key={message.name} className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eaf0ff] text-[12px] font-black text-[#4772e8] ring-2 ring-white">
                          {message.avatar}
                        </div>

                        <div className="flex min-h-[49px] flex-1 items-center justify-between rounded-[12px] bg-[#f4f6fb] px-4 py-2.5">
                          <div>
                            <p className="text-[15px] font-black text-[#202846]">{message.name}</p>
                            <p className="mt-1 text-[14px] font-semibold text-[#39415d]">{message.text}</p>
                          </div>

                          <span className="ml-4 text-[14px] font-semibold text-[#9299aa]">{message.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex h-[49px] items-center gap-4 rounded-full border border-[#e7ebf3] bg-white px-5 shadow-sm">
                    <div className="h-full flex-1 bg-transparent text-[15px] font-medium leading-[49px] text-[#9aa2b6]">
                      Mesaj yazın...
                    </div>

                    <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4772e8] text-white shadow-[0_12px_24px_rgba(71,114,232,0.32)] transition hover:scale-105 hover:bg-[#315fdf]">
                      <Send className="h-[18px] w-[18px]" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DemoChatPanel() {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const panel = panelRef.current;

    if (!panel) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      {
        threshold: 0.35,
      },
    );

    observer.observe(panel);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setTick((current) => current + 1);
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isInView]);

  const activeGroupIndex = Math.floor(tick / 5) % demoChatGroups.length;
  const activeGroup = demoChatGroups[activeGroupIndex];
  const ActiveGroupIcon = activeGroup.icon;
  const visibleMessageCount = Math.min(3, (tick % activeGroup.messages.length) + 1);
  const visibleMessages = useMemo(
    () => activeGroup.messages.slice(0, visibleMessageCount),
    [activeGroup, visibleMessageCount],
  );

  return (
    <>
      <aside className="flex min-h-[408px] flex-col border-b border-[#edf1fb] bg-white/70 p-4 md:border-b-0 md:border-r lg:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-[18px] font-bold tracking-[-0.035em] text-[#172044]">Birim Kanalları</h3>
            <p className="mt-1 text-[12px] font-semibold text-[#8b93a7]">Canlı ekip akışı</p>
          </div>

          <span className="rounded-full bg-[#edf4ff] px-2.5 py-1 text-[11px] font-black text-[#4772e8]">
            {demoChatGroups.length}
          </span>
        </div>

        <div className="space-y-2">
          {demoChatGroups.map((group, index) => {
            const isActive = index === activeGroupIndex;
            const GroupIcon = group.icon;

            return (
              <div
                key={group.id}
                className={[
                  "flex items-center gap-3 rounded-[14px] border px-3 py-2.5 transition-all duration-300",
                  isActive
                    ? "border-[#cddaff] bg-[#eef3ff] shadow-[0_12px_32px_rgba(71,114,232,0.13)]"
                    : "border-transparent bg-transparent hover:bg-[#f7f9ff]",
                ].join(" ")}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                  style={{ backgroundColor: group.accent }}
                >
                  <GroupIcon className="h-[17px] w-[17px]" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13px] font-bold text-[#202846]">{group.title}</p>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <p className="mt-0.5 truncate text-[11px] font-semibold text-[#8b93a7]">{group.description}</p>
                </div>

                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-2 text-[11px] font-black text-[#4772e8] shadow-sm">
                  {group.unread}
                </span>
              </div>
            );
          })}
        </div>

      </aside>

      <div ref={panelRef} className="relative flex min-h-[408px] flex-col bg-[linear-gradient(180deg,#ffffff_0%,#f7f9ff_100%)] p-4 lg:p-5">
        <div className="mb-4 flex items-center justify-between border-b border-[#eef1f7] pb-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm"
              style={{ backgroundColor: activeGroup.accent }}
            >
              <ActiveGroupIcon className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-[16px] font-bold tracking-[-0.035em] text-[#1b2344]">{activeGroup.title}</h3>
              <p className="text-[11px] font-semibold text-[#8b93a7]">{activeGroup.online} çevrimiçi personel</p>
            </div>
          </div>

          <span
            className={[
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black transition-colors",
              isInView ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400",
            ].join(" ")}
          >
            <span
              className={[
                "h-1.5 w-1.5 rounded-full",
                isInView ? "animate-pulse bg-emerald-500" : "bg-slate-300",
              ].join(" ")}
            />
            {isInView ? "Canlı" : "Pasif"}
          </span>
        </div>

        <div className="h-[248px] space-y-2.5 overflow-hidden">
          {visibleMessages.map((message, index) => (
            <div
              key={`${activeGroup.id}-${message.name}-${index}`}
              className="flex animate-[messageIn_360ms_ease-out] items-start gap-3"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eaf0ff] text-[10px] font-black text-[#4772e8] ring-2 ring-white">
                {message.avatar}
              </div>

              <div className="min-w-0 flex-1 rounded-[14px] border border-[#e6ecf8] bg-white px-4 py-2.5 shadow-[0_10px_28px_rgba(45,72,145,0.08)]">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-[13px] font-bold text-[#202846]">
                    {message.name}
                    <span className="ml-1 font-semibold text-[#8b93a7]">/ {message.role}</span>
                  </p>

                  <span className="shrink-0 text-[11px] font-bold text-[#9aa2b6]">{message.time}</span>
                </div>

                <p className="mt-1 text-[12px] font-semibold leading-4 text-[#39415d]">{message.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto flex h-[36px] items-center gap-2.5 rounded-full border border-[#e7ebf3] bg-white px-3 shadow-sm">
          <div className="h-full flex-1 bg-transparent text-[11px] font-medium leading-[36px] text-[#9aa2b6]">
            Birim mesajı yazın...
          </div>

          <button className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4772e8] text-white shadow-[0_10px_20px_rgba(71,114,232,0.28)] transition hover:scale-105 hover:bg-[#315fdf]">
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>

        <style jsx global>{`
          @keyframes messageIn {
            from {
              opacity: 0;
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </>
  );
}

export default function LandingPage() {
  return (
    <main className="overflow-x-hidden bg-[#f6f8fe] text-[#14213d]">
      <div className="-ml-[5%] [width:110%] [zoom:1.1]">
        <section id="hero" className="min-h-[100svh] overflow-hidden rounded-b-[36px] bg-[linear-gradient(135deg,#4f6df7_0%,#5d7cff_42%,#7ea0ff_100%)] text-white">
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

              <DynamicNavigation links={navigationLinks} theme="dark" glowIntensity={5} />

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
                href="/signup"
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

        <CommunicationShowcase />

        <section id="how-it-works" className="py-16">
          <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 lg:px-8">
            <h2 className="mx-auto text-center text-[clamp(38px,5vw,64px)] font-black leading-tight tracking-[-0.045em] text-[#16274d]">
              {"3 ad\u0131mda sisteme ba\u015flay\u0131n"}
            </h2>

            <div className="mt-24 grid gap-8 lg:grid-cols-3 lg:gap-10">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isFirstStep = index === 0;

                return (
                  <div key={step.step} className="relative">
                    <div
                      className={[
                        "flex min-h-[386px] flex-col items-center justify-center rounded-[26px] border bg-white/96 px-8 py-10 text-center shadow-[0_24px_70px_rgba(45,72,145,0.10)] transition",
                        isFirstStep
                          ? "border-[#5372ff] shadow-[0_24px_76px_rgba(79,109,247,0.16)]"
                          : "border-[#dfe6f3]",
                      ].join(" ")}
                    >
                      <div className="mb-11 flex h-[92px] w-[92px] items-center justify-center rounded-full bg-[#eef2ff] text-[#4f6df7] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                        <Icon className="h-11 w-11 stroke-[2.4]" />
                      </div>

                      <h3
                        className={[
                          "text-[25px] font-black tracking-[-0.035em]",
                          isFirstStep ? "text-[#4f6df7]" : "text-[#16274d]",
                        ].join(" ")}
                      >
                        {step.step}. {step.title}
                      </h3>

                      <p className="mt-8 max-w-[310px] text-[18px] font-medium leading-9 text-[#62708f]">
                        {step.description}
                      </p>

                      <Link
                        href={step.href}
                        className={[
                          "mt-10 inline-flex h-[58px] min-w-[168px] items-center justify-center rounded-[8px] px-8 text-[20px] font-black transition",
                          isFirstStep
                            ? "bg-[#4167f4] text-white shadow-[0_14px_28px_rgba(65,103,244,0.24)] hover:bg-[#3159e8]"
                            : "border-2 border-[#4f6df7] bg-white text-[#4f6df7] hover:bg-[#f4f7ff]",
                        ].join(" ")}
                      >
                        {step.action}
                      </Link>
                    </div>

                  </div>
                );
              })}
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
                    href="/signup"
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
