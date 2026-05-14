"use client";

import type React from "react";
import {
  Archive,
  Download,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Folder,
  Grid2X2,
  MoreVertical,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
} from "lucide-react";

const stats = [
  { label: "Toplam Belge", value: "342", note: "Tüm klasörlerdeki belge sayısı", icon: Folder, tone: "#6d5dfc", bg: "#f2efff" },
  { label: "Klasör", value: "18", note: "Toplam klasör sayısı", icon: FileArchive, tone: "#18a957", bg: "#eafaf0" },
  { label: "Bu Ay Yüklenen", value: "27", note: "Mayıs ayında yüklenen belgeler", icon: Upload, tone: "#2563eb", bg: "#eef5ff" },
  { label: "Kullanım", value: "2.45 GB", note: "Toplam depolama kullanımı", icon: ShieldCheck, tone: "#7c3aed", bg: "#f3edff" },
];

const folders = [
  ["Tümü", "342"],
  ["İdari Evrak", "64"],
  ["Personel Evrakları", "98"],
  ["Sözleşmeler", "45"],
  ["Raporlar", "56"],
  ["Bildirimler", "28"],
  ["Finansal Belgeler", "23"],
  ["Eğitim Dokümanları", "16"],
  ["Diğer", "12"],
];

const docs = [
  ["Personel Sözleşmesi - Ahmet Soylu.pdf", "Ahmet Soylu'ya ait güncel sözleşme", "PDF", "Sözleşmeler", "13 Mayıs 2026 14:20", "1.2 MB"],
  ["Vardiya Planlama Talimatı.docx", "Haftalık vardiya planlama talimatı", "DOCX", "İdari Evrak", "12 Mayıs 2026 09:15", "245 KB"],
  ["Personel İzin Takip Tablosu.xlsx", "2026 yılı izin takip tablosu", "XLSX", "Raporlar", "10 Mayıs 2026 16:40", "560 KB"],
  ["Oryantasyon Sunumu.pptx", "Yeni personel oryantasyon sunumu", "PPTX", "Eğitim Dokümanları", "09 Mayıs 2026 11:30", "5.6 MB"],
  ["Maaş Bordrosu - Nisan 2026.pdf", "Nisan 2026 maaş bordrosu", "PDF", "Finansal Belgeler", "08 Mayıs 2026 10:05", "1.8 MB"],
  ["KVKK Aydınlatma Metni.docx", "Kişisel verilerin korunması metni", "DOCX", "İdari Evrak", "07 Mayıs 2026 15:22", "320 KB"],
  ["İş Sağlığı ve Güvenliği Prosedürü.pdf", "İSG prosedür ve talimatları", "PDF", "Eğitim Dokümanları", "06 Mayıs 2026 13:10", "2.1 MB"],
  ["Personel Devam Çizelgesi.xlsx", "Aylık personel devam çizelgesi", "XLSX", "Raporlar", "05 Mayıs 2026 08:50", "780 KB"],
];

function typeStyle(type: string) {
  if (type === "PDF") return { bg: "#fee2e2", color: "#ef4444", icon: FileText };
  if (type === "XLSX") return { bg: "#dcfce7", color: "#16a34a", icon: FileSpreadsheet };
  if (type === "PPTX") return { bg: "#ffedd5", color: "#f97316", icon: FileText };
  return { bg: "#dbeafe", color: "#2563eb", icon: FileText };
}

export default function ArchivePage() {
  return (
    <main style={styles.page}>
      <style jsx>{`
        .archive-table th {
          padding: 16px 18px;
          text-align: left;
          background: #f8fbff;
          color: #65728f;
          font-size: 12px;
          font-weight: 700;
          border-bottom: 1px solid #e7edf7;
        }

        .archive-table td {
          padding: 15px 18px;
          color: #172033;
          font-size: 13px;
          border-bottom: 1px solid #edf2f8;
        }

        .archive-table tbody tr {
          transition: background 160ms ease, transform 160ms ease;
        }

        .archive-table tbody tr:hover {
          background: #f8fbff;
        }
      `}</style>

      <header style={styles.header}>
        <div style={styles.titleWrap}>
          <span style={styles.breadcrumbIcon}><Archive size={14} /></span>
          <div>
            <h1 style={styles.title}>Arşiv / Evrak <span style={styles.infoDot}>i</span></h1>
            <p style={styles.subtitle}>Kurumunuza ait tüm arşiv belgelerini güvenli bir şekilde yönetin.</p>
          </div>
        </div>
        <div style={styles.topSearch}><Search size={18} /><span>Panel içinde ara...</span><kbd>⌘K</kbd></div>
      </header>

      <section style={styles.statsGrid}>
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} style={styles.statCard}>
              <span style={{ ...styles.statIcon, color: item.tone, background: item.bg }}><Icon size={30} /></span>
              <div>
                <p style={styles.statLabel}>{item.label}</p>
                <strong style={styles.statValue}>{item.value}</strong>
                <p style={styles.statNote}>{item.note}</p>
              </div>
            </article>
          );
        })}
      </section>

      <section style={styles.contentGrid}>
        <aside style={styles.leftRail}>
          <div style={styles.panel}>
            <div style={styles.panelHeader}><h2>Klasörler</h2><button style={styles.iconButton}>+</button></div>
            <div style={styles.folderList}>
              {folders.map(([name, count], index) => (
                <button key={name} style={{ ...styles.folderItem, ...(index === 0 ? styles.folderItemActive : {}) }}>
                  <span style={styles.folderName}><Folder size={17} />{name}</span><strong>{count}</strong>
                </button>
              ))}
            </div>
          </div>
          <div style={styles.panel}>
            <h2 style={styles.sideTitle}>Depolama Kullanımı</h2>
            <div style={styles.storageRow}><strong>2.45 GB</strong><span>/ 10 GB</span><em>%24.5</em></div>
            <div style={styles.progress}><span style={{ width: "24.5%" }} /></div>
            <button style={styles.softButton}>Detaylı Kullanım</button>
          </div>
        </aside>

        <section style={styles.tableCard}>
          <div style={styles.toolbar}>
            <div style={styles.searchBox}><Search size={17} /><span>Belge adı, açıklama veya etiket ara...</span></div>
            <button style={styles.selectButton}>Belge Türü</button>
            <button style={styles.selectButton}>Tarih Aralığı</button>
            <button style={styles.filterButton}><SlidersHorizontal size={16} />Diğer Filtreler</button>
            <button style={styles.selectButton}>Son Eklenen</button>
            <button style={styles.iconButton}><Grid2X2 size={16} /></button>
          </div>
          <div style={styles.tableWrap}>
            <table className="archive-table" style={styles.table}>
              <thead><tr><th>Belge Adı</th><th>Tür</th><th>Klasör</th><th>Yüklenme Tarihi</th><th>Boyut</th><th>İşlemler</th></tr></thead>
              <tbody>
                {docs.map((doc) => {
                  const type = typeStyle(doc[2]);
                  const Icon = type.icon;
                  return (
                    <tr key={doc[0]}>
                      <td><div style={styles.docName}><span style={{ ...styles.docIcon, color: type.color, background: type.bg }}><Icon size={18} /></span><div><strong>{doc[0]}</strong><p style={styles.rowNote}>{doc[1]}</p></div></div></td>
                      <td><span style={{ ...styles.typeBadge, color: type.color, background: type.bg }}>{doc[2]}</span></td>
                      <td><span style={styles.folderBadge}>{doc[3]}</span></td>
                      <td><strong>{doc[4]}</strong><p style={styles.rowNote}>Mustafa Bedir</p></td>
                      <td>{doc[5]}</td>
                      <td><button style={styles.rowIcon}><Download size={16} /></button><button style={styles.rowIcon}><MoreVertical size={16} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <footer style={styles.footer}><span>342 kayıt</span><div style={styles.pages}><button>‹</button><strong>1</strong><button>2</button><button>3</button><button>...</button><button>18</button><button>›</button></div><button style={styles.selectButton}>10 / sayfa</button></footer>
        </section>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { height: "100%", overflow: "auto", padding: 28, background: "linear-gradient(135deg,#f8fbff,#f3f7ff)", color: "#101a36", fontFamily: "'Inter','Segoe UI',sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 26 },
  titleWrap: { display: "flex", alignItems: "center", gap: 18 },
  breadcrumbIcon: { width: 28, height: 28, borderRadius: 10, background: "#eef2ff", color: "#6474ff", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  title: { margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em" },
  infoDot: { display: "inline-flex", width: 18, height: 18, borderRadius: 999, border: "1px solid #9fb0cc", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#64748b" },
  subtitle: { margin: "8px 0 0", color: "#5d6b86", fontSize: 13, fontWeight: 600 },
  topSearch: { width: 300, height: 44, border: "1px solid #dbe5f6", borderRadius: 12, display: "flex", alignItems: "center", gap: 12, padding: "0 14px", background: "#fff", color: "#71809e", fontSize: 13 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 16, marginBottom: 20 },
  statCard: { minHeight: 130, border: "1px solid #e0e7f3", borderRadius: 18, background: "rgba(255,255,255,.94)", display: "flex", alignItems: "center", gap: 20, padding: 24, boxShadow: "0 16px 38px rgba(23,37,84,.07)" },
  statIcon: { width: 62, height: 62, borderRadius: 16, display: "inline-flex", alignItems: "center", justifyContent: "center" },
  statLabel: { margin: 0, fontSize: 13, color: "#6b7895", fontWeight: 600 },
  statValue: { display: "block", margin: "8px 0", fontSize: 28, fontWeight: 700 },
  statNote: { margin: 0, color: "#71809e", fontSize: 12, fontWeight: 600 },
  contentGrid: { display: "grid", gridTemplateColumns: "300px 1fr", gap: 18 },
  leftRail: { display: "flex", flexDirection: "column", gap: 14 },
  panel: { border: "1px solid #e0e7f3", borderRadius: 18, background: "rgba(255,255,255,.95)", padding: 18, boxShadow: "0 16px 38px rgba(23,37,84,.06)" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sideTitle: { margin: "0 0 18px", fontSize: 16, fontWeight: 700 },
  folderList: { display: "flex", flexDirection: "column", gap: 8 },
  folderItem: { height: 42, border: 0, borderRadius: 10, background: "transparent", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 12px", color: "#172033", cursor: "pointer", fontWeight: 700 },
  folderItemActive: { background: "#eef2ff", color: "#4f46e5" },
  folderName: { display: "inline-flex", alignItems: "center", gap: 10 },
  iconButton: { width: 42, height: 42, border: "1px solid #dbe5f6", background: "#fff", borderRadius: 12, color: "#4f46e5", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  storageRow: { display: "flex", gap: 4, alignItems: "baseline", color: "#4f46e5", fontSize: 13 },
  progress: { height: 8, borderRadius: 99, background: "#e8edfb", margin: "12px 0 22px", overflow: "hidden" },
  softButton: { width: "100%", height: 44, border: 0, borderRadius: 10, background: "#f1edff", color: "#4f46e5", fontWeight: 700 },
  tableCard: { border: "1px solid #e0e7f3", borderRadius: 18, background: "rgba(255,255,255,.96)", overflow: "hidden", boxShadow: "0 16px 38px rgba(23,37,84,.07)" },
  toolbar: { display: "grid", gridTemplateColumns: "1fr 130px 140px 150px 130px 44px", gap: 10, padding: 18, alignItems: "center" },
  searchBox: { height: 42, border: "1px solid #dbe5f6", borderRadius: 12, display: "flex", alignItems: "center", gap: 10, padding: "0 12px", color: "#71809e", fontSize: 13 },
  selectButton: { height: 42, border: "1px solid #dbe5f6", background: "#fff", borderRadius: 12, color: "#52617d", fontWeight: 700, cursor: "pointer", padding: "0 14px" },
  filterButton: { height: 42, border: 0, borderRadius: 12, background: "#f1edff", color: "#4f46e5", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 },
  tableWrap: { overflow: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  docName: { display: "flex", alignItems: "center", gap: 12 },
  docIcon: { width: 30, height: 30, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center" },
  typeBadge: { padding: "6px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 },
  folderBadge: { padding: "6px 10px", borderRadius: 8, background: "#f1f5f9", color: "#52617d", fontWeight: 700 },
  rowNote: { margin: "5px 0 0", color: "#6b7895", fontSize: 12, fontWeight: 600 },
  rowIcon: { width: 38, height: 38, borderRadius: 10, border: "1px solid #dbe5f6", background: "#fff", color: "#4f46e5", marginRight: 6, cursor: "pointer" },
  footer: { display: "grid", gridTemplateColumns: "1fr auto 120px", alignItems: "center", padding: 18, borderTop: "1px solid #e7edf7", color: "#52617d", fontWeight: 700 },
  pages: { display: "flex", gap: 8 },
};
