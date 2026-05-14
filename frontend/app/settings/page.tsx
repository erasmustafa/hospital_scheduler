"use client";

import type React from "react";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Clock,
  DatabaseBackup,
  Globe2,
  HardDrive,
  HelpCircle,
  Moon,
  Palette,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

const tabs = [
  { label: "Genel Ayarlar", icon: Settings, active: true },
  { label: "Bildirim Ayarları", icon: Bell },
  { label: "Güvenlik", icon: ShieldCheck },
  { label: "Yedekleme", icon: DatabaseBackup },
  { label: "Entegrasyonlar", icon: Globe2 },
];

const workingDays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const colors = ["#4f46e5", "#a855f7", "#22c55e", "#f97316", "#e2e8f0"];

export default function SettingsPage() {
  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Ayarlar</h1>
          <p style={styles.subtitle}>Sistem ve uygulama ayarlarınızı yönetin.</p>
        </div>
        <div style={styles.search}><Search size={17} /><span>Ara...</span><kbd>⌘K</kbd></div>
      </header>

      <nav style={styles.tabs}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.label} style={{ ...styles.tab, ...(tab.active ? styles.tabActive : {}) }}>
              <Icon size={17} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <section style={styles.layout}>
        <div style={styles.mainColumn}>
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Genel Ayarlar</h2>
            <p style={styles.cardText}>Sistem genelinde kullanılan temel ayarları düzenleyin.</p>
            <div style={styles.settingList}>
              <SettingRow icon={HardDrive} tone="#4f46e5" bg="#eef2ff" title="Sistem Adı" text="Uygulama genelinde görüntülenecek sistem adını düzenleyin.">
                <input style={styles.input} defaultValue="MediPlan Hastane Yönetim Sistemi" />
              </SettingRow>
              <SettingRow icon={Clock} tone="#16a34a" bg="#ecfdf3" title="Varsayılan Vardiya Başlangıcı" text="Vardiya programlarında varsayılan başlangıç saatini belirleyin.">
                <div style={styles.field}>08:00 <Clock size={16} /></div>
              </SettingRow>
              <SettingRow icon={CalendarDays} tone="#f97316" bg="#fff7ed" title="Haftalık Çalışma Günleri" text="Varsayılan haftalık çalışma günlerini seçin.">
                <div style={styles.dayGroup}>{workingDays.map((day, index) => <button key={day} style={{ ...styles.day, ...(index < 5 ? styles.dayActive : {}) }}>{day}</button>)}</div>
              </SettingRow>
              <SettingRow icon={Clock} tone="#a855f7" bg="#f5edff" title="Haftalık Çalışma Saati" text="Personel için varsayılan haftalık çalışma saatini belirleyin.">
                <div style={styles.field}>45 saat</div>
              </SettingRow>
              <SettingRow icon={CalendarDays} tone="#ef4444" bg="#fff1f2" title="Tatil Günleri Takvimi" text="Resmi tatil günlerini ve özel günleri yönetin.">
                <button style={styles.outlineButton}>Tatil Günlerini Yönet <ChevronRight size={16} /></button>
              </SettingRow>
            </div>
          </section>

          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Görünüm Ayarları</h2>
            <p style={styles.cardText}>Uygulama görünümü ve tercihlerinizi özelleştirin.</p>
            <div style={styles.settingList}>
              <SettingRow icon={Palette} tone="#4f46e5" bg="#eef2ff" title="Tema" text="Uygulama tema rengini seçin.">
                <div style={styles.colorGroup}>{colors.map((color, index) => <button key={color} style={{ ...styles.colorDot, background: color }}>{index === 0 ? "✓" : ""}</button>)}</div>
              </SettingRow>
              <SettingRow icon={Moon} tone="#64748b" bg="#f1f5f9" title="Koyu Mod" text="Koyu tema tercihini yönetin.">
                <button style={styles.toggle}><span /></button>
              </SettingRow>
              <SettingRow icon={Globe2} tone="#16a34a" bg="#ecfdf3" title="Dil" text="Uygulama dilini seçin.">
                <div style={styles.field}>Türkçe</div>
              </SettingRow>
            </div>
            <button style={styles.primaryButton}><CalendarDays size={17} />Değişiklikleri Kaydet</button>
          </section>
        </div>

        <aside style={styles.sideColumn}>
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Sistem Bilgileri</h2>
            <InfoRow label="Sürüm" value="v2.4.1" />
            <InfoRow label="Son Güncelleme" value="10.05.2026 14:30" />
            <InfoRow label="Lisans Durumu" value="Aktif" success />
            <InfoRow label="Kullanıcı Lisansı" value="Limitsiz" />
            <button style={styles.wideOutline}><ShieldCheck size={16} />Sistem Lisansını Yönet <ChevronRight size={16} /></button>
          </section>

          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Hızlı İşlemler</h2>
            {[
              { title: "Önbelleği Temizle", text: "Sistemdeki geçici verileri temizleyin.", icon: Rocket },
              { title: "Oturumları Yönet", text: "Aktif oturumları görüntüleyin ve yönetin.", icon: Users },
              { title: "Sistem Logları", text: "Sistem loglarını görüntüleyin.", icon: HardDrive },
              { title: "Destek Talebi Oluştur", text: "Teknik destek talebi oluşturun.", icon: HelpCircle },
            ].map((item) => {
              const Icon = item.icon;
              return (
              <button key={item.title} style={styles.actionCard}>
                <span style={styles.actionIcon}><Icon size={18} /></span>
                <span><strong>{item.title}</strong><em>{item.text}</em></span>
              </button>
              );
            })}
          </section>

          <section style={{ ...styles.card, ...styles.helpCard }}>
            <h2 style={styles.cardTitle}>Yardıma mı ihtiyacınız var?</h2>
            <p style={styles.cardText}>Ayarlar hakkında daha fazla bilgi için dokümantasyonu inceleyebilirsiniz.</p>
            <button style={styles.softButton}>Dokümantasyona Git <ChevronRight size={16} /></button>
          </section>
        </aside>
      </section>
    </main>
  );
}

function SettingRow({
  icon: Icon,
  tone,
  bg,
  title,
  text,
  children,
}: {
  icon: React.ElementType;
  tone: string;
  bg: string;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div style={styles.settingRow}>
      <span style={{ ...styles.settingIcon, color: tone, background: bg }}><Icon size={20} /></span>
      <div style={styles.settingMeta}><strong>{title}</strong><span>{text}</span></div>
      <div style={styles.settingControl}>{children}</div>
    </div>
  );
}

function InfoRow({ label, value, success = false }: { label: string; value: string; success?: boolean }) {
  return (
    <div style={styles.infoRow}>
      <span>{label}</span>
      <strong style={success ? styles.successPill : undefined}>{value}</strong>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100%", overflow: "auto", padding: 30, background: "linear-gradient(135deg,#f8fbff,#f3f7ff)", color: "#101a36" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  title: { margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: "-0.035em" },
  subtitle: { margin: "8px 0 0", color: "#5f6d88", fontSize: 14, fontWeight: 600 },
  search: { width: 290, height: 44, border: "1px solid #dfe7f5", borderRadius: 12, background: "#fff", display: "flex", alignItems: "center", gap: 12, padding: "0 14px", color: "#71809e" },
  tabs: { display: "grid", gridTemplateColumns: "repeat(5,1fr)", background: "rgba(255,255,255,.88)", border: "1px solid #e4ebf7", borderRadius: 14, overflow: "hidden", marginBottom: 18 },
  tab: { height: 58, border: 0, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#53617e", fontWeight: 700, cursor: "pointer" },
  tabActive: { color: "#4f46e5", background: "#f7f9ff", borderBottom: "2px solid #4f46e5" },
  layout: { display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 },
  mainColumn: { display: "flex", flexDirection: "column", gap: 18 },
  sideColumn: { display: "flex", flexDirection: "column", gap: 18 },
  card: { border: "1px solid #e0e7f3", borderRadius: 18, background: "rgba(255,255,255,.94)", padding: 24, boxShadow: "0 18px 46px rgba(23,37,84,.07)" },
  cardTitle: { margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" },
  cardText: { margin: "10px 0 22px", color: "#64748b", fontSize: 14, fontWeight: 600 },
  settingList: { borderTop: "1px solid #edf2f7" },
  settingRow: { display: "grid", gridTemplateColumns: "52px minmax(0,1fr) 360px", gap: 18, alignItems: "center", padding: "18px 0", borderBottom: "1px solid #edf2f7" },
  settingIcon: { width: 42, height: 42, borderRadius: 12, display: "inline-flex", alignItems: "center", justifyContent: "center" },
  settingMeta: { display: "flex", flexDirection: "column", gap: 5 },
  settingControl: { display: "flex", justifyContent: "flex-end", alignItems: "center" },
  input: { width: "100%", height: 42, border: "1px solid #dbe5f6", borderRadius: 10, padding: "0 14px", color: "#334155", fontWeight: 600 },
  field: { minWidth: 150, height: 42, border: "1px solid #dbe5f6", borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", color: "#334155", fontWeight: 700, background: "#fff" },
  dayGroup: { display: "flex", gap: 8 },
  day: { width: 42, height: 38, borderRadius: 9, border: 0, background: "#eef2f7", color: "#475569", fontWeight: 700 },
  dayActive: { background: "#4f46e5", color: "#fff", boxShadow: "0 12px 24px rgba(79,70,229,.22)" },
  outlineButton: { height: 42, border: "1px solid #dbe5f6", borderRadius: 10, background: "#fff", color: "#4f46e5", fontWeight: 700, padding: "0 14px", display: "inline-flex", alignItems: "center", gap: 8 },
  colorGroup: { display: "flex", gap: 14 },
  colorDot: { width: 38, height: 38, borderRadius: 999, border: "3px solid #fff", color: "#fff", fontWeight: 800, boxShadow: "0 12px 24px rgba(15,23,42,.12)" },
  toggle: { width: 52, height: 30, border: 0, borderRadius: 999, background: "#cbd5e1", padding: 4, display: "flex", justifyContent: "flex-start" },
  primaryButton: { marginTop: 20, height: 44, border: 0, borderRadius: 10, background: "#4f46e5", color: "#fff", fontWeight: 700, padding: "0 18px", display: "inline-flex", alignItems: "center", gap: 10, boxShadow: "0 16px 30px rgba(79,70,229,.24)" },
  infoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", color: "#58657f", fontSize: 13, fontWeight: 600 },
  successPill: { background: "#dcfce7", color: "#16a34a", padding: "5px 10px", borderRadius: 999 },
  wideOutline: { width: "100%", height: 44, border: "1px solid #dbe5f6", borderRadius: 10, background: "#fff", color: "#4f46e5", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", marginTop: 12 },
  actionCard: { width: "100%", minHeight: 64, border: "1px solid #e5ebf5", borderRadius: 12, background: "#fff", display: "flex", alignItems: "center", gap: 12, padding: 12, marginTop: 10, textAlign: "left", cursor: "pointer" },
  actionIcon: { width: 38, height: 38, borderRadius: 11, background: "#eef2ff", color: "#4f46e5", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  helpCard: { background: "linear-gradient(135deg,#f7f8ff,#eef4ff)" },
  softButton: { height: 40, border: 0, borderRadius: 10, background: "#fff", color: "#4f46e5", fontWeight: 700, padding: "0 14px", display: "inline-flex", alignItems: "center", gap: 8 },
};
