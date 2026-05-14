"use client";

import type React from "react";
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BriefcaseMedical,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileText,
  HeartPulse,
  ListChecks,
  ScanLine,
  Search,
  Settings,
  ShieldCheck,
  UploadCloud,
  Users,
} from "lucide-react";

const metrics = [
  { label: "Toplam Birim", value: "18", note: "Aktif 16 • Pasif 2", icon: Users, tone: "#4f46e5", bg: "#eef2ff" },
  { label: "Toplam Personel", value: "142", note: "Dolu 126 • Boş 16", icon: Users, tone: "#16a34a", bg: "#ecfdf3" },
  { label: "Toplam İhtiyaç", value: "158", note: "Dolu 142 • Karşılanmayan 16", icon: ClipboardList, tone: "#2563eb", bg: "#eef5ff" },
  { label: "Genel Karşılama Oranı", value: "89%", note: "Geçen aya göre ↑ 6%", icon: BarChart3, tone: "#f59e0b", bg: "#fff7ed" },
];

const tabs = ["Genel Bakış", "Personel", "İhtiyaç Planlaması", "Vardiya Dağılımı", "Performans", "Belgeler"];

const departmentStaff = [
  ["Elif Ömercik", "Hemşire", "Gündüz", "Aktif"],
  ["Ahmet Soylu", "Teknisyen", "Nöbet", "Aktif"],
  ["Demet Çelik Gelen", "Hemşire", "Mesai", "Aktif"],
  ["Emir Oral", "Hemşire", "Gece", "Aktif"],
];

const staffingNeeds = [
  ["Hekim", "6", "6", "Karşılandı"],
  ["Hemşire", "9", "8", "1 eksik"],
  ["ATT / Paramedik", "3", "3", "Karşılandı"],
  ["Destek Personeli", "1", "0", "1 eksik"],
];

const shiftDistributionRows = [
  ["Gündüz", "08:00 - 16:00", "8 kişi", "#22c55e"],
  ["Akşam", "16:00 - 00:00", "4 kişi", "#6366f1"],
  ["Gece", "00:00 - 08:00", "2 kişi", "#1e40af"],
];

const performanceRows = [
  ["Doluluk oranı", "92%", "Çok iyi"],
  ["Plan uyumu", "89%", "İyi"],
  ["Eksik ihtiyaç", "2", "İyileştirilmeli"],
  ["Fazla mesai riski", "Düşük", "Kontrol altında"],
];

const documentRows = [
  ["Acil Servis Personel Listesi.xlsx", "Personel listesi", "12.05.2026"],
  ["Haftalık İhtiyaç Planı.pdf", "İhtiyaç planlaması", "11.05.2026"],
  ["Vardiya Dağılım Raporu.xlsx", "Vardiya dağılımı", "10.05.2026"],
];
const requirementRows = [
  ["Hekim", "6 / 6", 100, "#16a34a"],
  ["Hemşire", "8 / 9", 89, "#2563eb"],
  ["ATT / Paramedik", "3 / 3", 100, "#16a34a"],
  ["Sekreterya", "2 / 2", 100, "#16a34a"],
  ["Güvenlik", "1 / 2", 50, "#f59e0b"],
  ["Destek Personeli", "0 / 1", 0, "#fb7185"],
];

const operations = [
  ["Vardiya Güncellendi", "13 Mayıs 2026 tarihli vardiya planı güncellendi.", "Admin", "13.05.2026 14:30"],
  ["Personel Eklendi", "Yeni personel Ayşe Yılmaz birime eklendi.", "Admin", "12.05.2026 10:15"],
  ["İhtiyaç Planı Güncellendi", "Haftalık ihtiyaç planı güncellendi.", "Admin", "11.05.2026 16:45"],
];

export default function DepartmentControlPage() {
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Birim Kontrolü <ShieldCheck size={19} color="#4f46e5" /></h1>
          <p style={styles.subtitle}>Birimlerin ihtiyaçlarını, mevcut durumlarını ve personel dağılımını yönetin.</p>
        </div>
        <button style={styles.primaryButton}>+ Yeni Birim Ekle</button>
      </header>

      <section style={styles.filterCard}>
        <label><span>Birim Ara</span><div style={styles.input}>Birim adı ara...<Search size={15} /></div></label>
        <label><span>Kategori</span><div style={styles.select}>Tümü</div></label>
        <label><span>Grup</span><div style={styles.select}>Tümü</div></label>
        <label><span>Durum</span><div style={styles.select}>Tümü</div></label>
        <button style={styles.clearButton}>Filtreleri Temizle</button>
      </section>

      <section style={styles.content}>
        <div style={styles.mainColumn}>
          <section style={styles.metricsGrid}>
            {metrics.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.label} style={styles.metricCard}>
                  <span style={{ ...styles.metricIcon, color: item.tone, background: item.bg }}><Icon size={24} /></span>
                  <div>
                    <p>{item.label}</p>
                    <strong>{item.value}</strong>
                    <em>{item.note}</em>
                  </div>
                </article>
              );
            })}
          </section>

          <section style={styles.departmentCard}>
            <div style={styles.departmentHeader}>
              <div style={styles.departmentTitle}>
                <span style={styles.heartIcon}><HeartPulse size={24} /></span>
                <div>
                  <h2>Acil Servis <small>Aktif</small></h2>
                  <p>Klinik › Acil Birimler</p>
                  <span>7/24 acil sağlık hizmeti sunan birim. Hasta kabul, triyaj, müdahale ve gözlem hizmetleri.</span>
                </div>
              </div>
              <div style={styles.departmentActions}>
                <button style={styles.outlineButton}><Settings size={16} />Birim Ayarları</button>
                <button style={styles.primarySmall}><FileText size={16} />Raporla</button>
              </div>
            </div>

            <nav style={styles.tabBar}>
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  style={activeTab === tab ? styles.activeTab : styles.tab}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </nav>

            <DepartmentTabContent activeTab={activeTab} />

            <section style={styles.operationsCard}>
              <div style={styles.operationsHeader}><h3>Son İşlemler</h3><button>Tümünü Görüntüle <ChevronRight size={14} /></button></div>
              <table style={styles.operationsTable}>
                <thead><tr><th>İşlem</th><th>Açıklama</th><th>İşlemi Yapan</th><th>Tarih</th></tr></thead>
                <tbody>{operations.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody>
              </table>
            </section>
          </section>
        </div>

        <aside style={styles.sideColumn}>
          <section style={styles.sideCard}>
            <h2>İhtiyaç Özeti</h2>
            <div style={styles.summaryDonut}><strong>158</strong></div>
            <Legend color="#22c55e" title="Dolu" value="142" percent="89%" />
            <Legend color="#2563eb" title="Boş" value="16" percent="10%" />
            <Legend color="#f43f5e" title="Karşılanmayan" value="16" percent="10%" />
          </section>

          <section style={styles.sideCard}>
            <div style={styles.ocrHeader}>
              <span style={styles.ocrIcon}><ScanLine size={22} /></span>
              <div>
                <h2>Belge Okuma</h2>
                <p>OCR ile liste ve ihtiyaç verilerini sisteme aktarın.</p>
              </div>
            </div>
            <div style={styles.uploadBox}>
              <UploadCloud size={28} />
              <strong>Liste dosyası yükle</strong>
              <span>Excel, PDF veya görsel formatındaki personel listelerini okuyabilir.</span>
            </div>
            {[
              "Mevcut vardiya listesini tanı",
              "Birim personel ihtiyacını çıkar",
              "Çalışan bilgilerini eşleştir",
            ].map((item) => (
              <div key={item} style={styles.ocrStep}>
                <ListChecks size={15} />
                <span>{item}</span>
              </div>
            ))}
            <button style={styles.ocrButton}>Belgeyi Tara</button>
          </section>

          <section style={styles.sideCard}>
            <h2>Hızlı İşlemler</h2>
            {[
              { title: "Birim İhtiyaç Planlama", text: "Birim ihtiyaçlarını planlayın", icon: CalendarDays },
              { title: "Personel Dağılım Raporu", text: "Birim bazlı personel raporunu görüntüleyin", icon: Users },
              { title: "Karşılanmayan İhtiyaçlar", text: "Karşılanmayan ihtiyaçları görüntüleyin", icon: AlertTriangle },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.title} style={styles.quickButton}><Icon size={18} /><span><strong>{item.title}</strong><em>{item.text}</em></span></button>
              );
            })}
          </section>
        </aside>
      </section>
    </main>
  );
}

function DepartmentTabContent({ activeTab }: { activeTab: string }) {
  if (activeTab === "Personel") {
    return (
      <section style={styles.tabPanel}>
        <PanelHeader
          title="Birim Personeli"
          text="Bu birimde görev alan aktif personel ve çalışma durumları."
        />
        <DataTable
          headers={["Personel", "Ünvan", "Planlanan Vardiya", "Durum"]}
          rows={departmentStaff}
        />
      </section>
    );
  }

  if (activeTab === "İhtiyaç Planlaması") {
    return (
      <section style={styles.tabPanel}>
        <PanelHeader
          title="İhtiyaç Planlaması"
          text="Rol bazında gerekli ve karşılanan personel ihtiyacı."
        />
        <DataTable
          headers={["Rol", "Gerekli", "Mevcut", "Durum"]}
          rows={staffingNeeds}
        />
      </section>
    );
  }

  if (activeTab === "Vardiya Dağılımı") {
    return (
      <section style={styles.tabPanel}>
        <PanelHeader
          title="Vardiya Dağılımı"
          text="Birimdeki vardiya türlerinin saat ve kişi bazlı dağılımı."
        />
        <div style={styles.shiftCards}>
          {shiftDistributionRows.map(([name, hours, count, color]) => (
            <article key={name} style={{ ...styles.shiftDistributionCard, borderLeftColor: color }}>
              <span style={{ ...styles.shiftDot, background: color }} />
              <div>
                <strong>{name}</strong>
                <p>{hours}</p>
              </div>
              <em>{count}</em>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (activeTab === "Performans") {
    return (
      <section style={styles.tabPanel}>
        <PanelHeader
          title="Performans"
          text="Birim verimliliği ve planlama uyum göstergeleri."
        />
        <div style={styles.performanceGrid}>
          {performanceRows.map(([label, value, note]) => (
            <article key={label} style={styles.performanceCard}>
              <span>{label}</span>
              <strong>{value}</strong>
              <em>{note}</em>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (activeTab === "Belgeler") {
    return (
      <section style={styles.tabPanel}>
        <PanelHeader
          title="Belgeler"
          text="Birimle ilişkili personel, ihtiyaç ve vardiya belgeleri."
        />
        <DataTable
          headers={["Belge", "Tür", "Tarih"]}
          rows={documentRows}
        />
      </section>
    );
  }

  return (
    <>
      <div style={styles.overviewGrid}>
        <MiniStat title="Toplam Personel" value="18" note="Dolu 16 • Boş 2" icon={Users} />
        <MiniStat title="Bugünkü Vardiyalı" value="14" note="Gündüz 8 • Gece 6" icon={CalendarDays} />
        <MiniStat title="Toplam İhtiyaç" value="22" note="Dolu 20 • Karşılanmayan 2" icon={ClipboardList} />
        <MiniStat title="Karşılama Oranı" value="92%" note="Çok iyi" icon={Activity} />
      </div>

      <div style={styles.analysisGrid}>
        <section style={styles.innerPanel}>
          <h3>İhtiyaç Karşılama Durumu</h3>
          {requirementRows.map(([label, count, width, color]) => (
            <div key={String(label)} style={styles.requirementRow}>
              <span>{label}</span>
              <strong>{count}</strong>
              <div style={styles.bar}><i style={{ width: `${width}%`, background: String(color) }} /></div>
              <em>{width}%</em>
            </div>
          ))}
          <button style={styles.outlineButton}>Detaylı Görüntüle</button>
        </section>

        <section style={styles.innerPanel}>
          <h3>Vardiya Dağılımı</h3>
          <div style={styles.donutWrap}>
            <div style={styles.donut}><strong>14</strong><span>Kişi</span></div>
            <div style={styles.legend}>
              <Legend color="#22c55e" title="Gündüz (08:00 - 16:00)" value="8 kişi" percent="57%" />
              <Legend color="#6366f1" title="Akşam (16:00 - 00:00)" value="4 kişi" percent="29%" />
              <Legend color="#1e40af" title="Gece (00:00 - 08:00)" value="2 kişi" percent="14%" />
            </div>
          </div>
          <div style={styles.noteBox}>
            <strong>Notlar</strong>
            <span>Pazartesi günü için hemşire ihtiyacı 1 kişi olarak planlanmıştır.</span>
          </div>
        </section>
      </div>
    </>
  );
}

function PanelHeader({ title, text }: { title: string; text: string }) {
  return (
    <div style={styles.panelHeader}>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <table style={styles.tabTable}>
      <thead>
        <tr>
          {headers.map((header) => <th key={header}>{header}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.join("-")}>
            {row.map((cell, index) => (
              <td key={`${cell}-${index}`}>
                {index === row.length - 1 ? <span style={styles.statusPill}>{cell}</span> : cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MiniStat({ title, value, note, icon: Icon }: { title: string; value: string; note: string; icon: React.ElementType }) {
  return (
    <article style={styles.miniStat}>
      <span><Icon size={20} /></span>
      <div><p>{title}</p><strong>{value}</strong><em>{note}</em></div>
    </article>
  );
}

function Legend({ color, title, value, percent }: { color: string; title: string; value: string; percent: string }) {
  return (
    <div style={styles.legendRow}><span style={{ background: color }} /><p>{title}</p><strong>{value}</strong><em>{percent}</em></div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { height: "100%", overflow: "auto", padding: 28, background: "linear-gradient(135deg,#f8fbff,#f3f7ff)", color: "#101a36" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: "-0.035em" },
  subtitle: { margin: "8px 0 0", color: "#5f6d88", fontSize: 14, fontWeight: 600 },
  primaryButton: { height: 44, border: 0, borderRadius: 10, background: "#4f46e5", color: "#fff", fontWeight: 700, padding: "0 18px", boxShadow: "0 16px 30px rgba(79,70,229,.22)" },
  filterCard: { display: "grid", gridTemplateColumns: "1.3fr .8fr .8fr .8fr 150px", gap: 14, border: "1px solid #e0e7f3", borderRadius: 16, background: "rgba(255,255,255,.92)", padding: 18, marginBottom: 18, boxShadow: "0 16px 38px rgba(23,37,84,.06)" },
  input: { height: 40, border: "1px solid #dbe5f6", borderRadius: 10, padding: "0 12px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#8a96ad", background: "#fff" },
  select: { height: 40, border: "1px solid #dbe5f6", borderRadius: 10, padding: "0 12px", display: "flex", alignItems: "center", background: "#fff", fontWeight: 700 },
  clearButton: { alignSelf: "end", height: 40, border: 0, borderRadius: 10, background: "#eef2ff", color: "#4f46e5", fontWeight: 700 },
  content: { display: "grid", gridTemplateColumns: "1fr 330px", gap: 20 },
  mainColumn: { minWidth: 0 },
  sideColumn: { display: "flex", flexDirection: "column", gap: 16 },
  metricsGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 16 },
  metricCard: { minHeight: 104, border: "1px solid #e0e7f3", borderRadius: 16, background: "#fff", padding: 18, display: "flex", alignItems: "center", gap: 16, boxShadow: "0 16px 38px rgba(23,37,84,.06)" },
  metricIcon: { width: 52, height: 52, borderRadius: 14, display: "inline-flex", alignItems: "center", justifyContent: "center" },
  departmentCard: { border: "1px solid #e0e7f3", borderRadius: 18, background: "#fff", overflow: "hidden", boxShadow: "0 16px 38px rgba(23,37,84,.07)" },
  departmentHeader: { display: "flex", justifyContent: "space-between", padding: 20, borderBottom: "1px solid #e9eef7" },
  departmentTitle: { display: "flex", gap: 16 },
  heartIcon: { width: 48, height: 48, borderRadius: 14, background: "#f1edff", color: "#6d5dfc", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  departmentActions: { display: "flex", gap: 10, alignItems: "center" },
  outlineButton: { height: 40, border: "1px solid #dbe5f6", borderRadius: 10, background: "#fff", color: "#334155", fontWeight: 700, padding: "0 14px", display: "inline-flex", alignItems: "center", gap: 8 },
  primarySmall: { height: 40, border: 0, borderRadius: 10, background: "#2563eb", color: "#fff", fontWeight: 700, padding: "0 14px", display: "inline-flex", alignItems: "center", gap: 8 },
  tabBar: { display: "grid", gridTemplateColumns: "repeat(6,1fr)", padding: "0 18px", borderBottom: "1px solid #e9eef7" },
  tab: { height: 48, border: 0, background: "transparent", color: "#53617e", fontWeight: 700, cursor: "pointer", transition: "color 160ms ease, background 160ms ease" },
  activeTab: { height: 48, border: 0, background: "linear-gradient(180deg,#f8faff,#fff)", color: "#4f46e5", fontWeight: 700, borderBottom: "2px solid #4f46e5", cursor: "pointer" },
  tabPanel: { padding: 18 },
  panelHeader: { marginBottom: 14 },
  tabTable: { width: "100%", borderCollapse: "separate", borderSpacing: 0, overflow: "hidden", border: "1px solid #e5ebf5", borderRadius: 14, fontSize: 13 },
  statusPill: { display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "5px 10px", background: "#eef2ff", color: "#4f46e5", fontWeight: 700 },
  shiftCards: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 },
  shiftDistributionCard: { minHeight: 92, border: "1px solid #e5ebf5", borderLeft: "4px solid #4f46e5", borderRadius: 14, padding: 14, display: "grid", gridTemplateColumns: "12px 1fr auto", gap: 12, alignItems: "center", background: "#fff" },
  shiftDot: { width: 10, height: 10, borderRadius: 999 },
  performanceGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 },
  performanceCard: { border: "1px solid #e5ebf5", borderRadius: 14, padding: 16, background: "linear-gradient(180deg,#fff,#f8fbff)", display: "flex", flexDirection: "column", gap: 8 },
  overviewGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, padding: 18 },
  miniStat: { border: "1px solid #e5ebf5", borderRadius: 14, padding: 14, display: "flex", gap: 12, alignItems: "center" },
  analysisGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "0 18px 18px" },
  innerPanel: { border: "1px solid #e5ebf5", borderRadius: 14, padding: 16 },
  requirementRow: { display: "grid", gridTemplateColumns: "130px 48px 1fr 40px", gap: 10, alignItems: "center", marginBottom: 12, fontSize: 13 },
  bar: { height: 6, borderRadius: 99, background: "#e8edf6", overflow: "hidden" },
  donutWrap: { display: "grid", gridTemplateColumns: "150px 1fr", gap: 20, alignItems: "center" },
  donut: { width: 132, height: 132, borderRadius: 999, background: "radial-gradient(circle,#fff 44%,transparent 45%),conic-gradient(#22c55e 0 57%,#6366f1 57% 86%,#1e40af 86% 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  legend: { display: "flex", flexDirection: "column", gap: 12 },
  legendRow: { display: "grid", gridTemplateColumns: "10px 1fr auto auto", gap: 10, alignItems: "center", fontSize: 13 },
  noteBox: { marginTop: 16, borderRadius: 12, background: "#f5f7ff", padding: 14, display: "flex", flexDirection: "column", gap: 6, color: "#5f6d88" },
  operationsCard: { padding: 18, borderTop: "1px solid #e9eef7" },
  operationsHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  operationsTable: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  sideCard: { border: "1px solid #e0e7f3", borderRadius: 18, background: "#fff", padding: 20, boxShadow: "0 16px 38px rgba(23,37,84,.06)" },
  summaryDonut: { width: 120, height: 120, borderRadius: 999, margin: "12px auto 18px", background: "radial-gradient(circle,#fff 45%,transparent 46%),conic-gradient(#22c55e 0 89%,#2563eb 89% 96%,#f43f5e 96% 100%)", display: "flex", alignItems: "center", justifyContent: "center" },
  categoryRow: { display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginTop: 14 },
  ocrHeader: { display: "flex", gap: 12, alignItems: "center", marginBottom: 14 },
  ocrIcon: { width: 44, height: 44, borderRadius: 14, background: "#eef2ff", color: "#4f46e5", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  uploadBox: { minHeight: 132, border: "1px dashed #b9c8df", borderRadius: 16, background: "linear-gradient(180deg,#f8fbff,#ffffff)", color: "#4f46e5", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 8, padding: 16, marginBottom: 12 },
  ocrStep: { display: "flex", alignItems: "center", gap: 9, minHeight: 34, borderRadius: 10, color: "#334155", fontSize: 13, fontWeight: 700 },
  ocrButton: { width: "100%", height: 40, marginTop: 12, border: 0, borderRadius: 12, background: "#4f46e5", color: "#fff", fontWeight: 700, boxShadow: "0 14px 26px rgba(79,70,229,.2)" },
  quickButton: { width: "100%", border: "1px solid #e5ebf5", borderRadius: 12, background: "#fff", padding: 12, display: "flex", alignItems: "center", gap: 12, marginTop: 10, textAlign: "left" },
};
