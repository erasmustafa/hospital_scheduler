"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { Search, Plus, Settings } from "lucide-react";

type StaffRow = {
  id: number;
  fullName: string;
  photoUrl?: string | null;
  role: string;
  employeeNo: string | null;
  title: string;
  profession: string;
  departmentName: string | null;
  weeklyLimitHours: number;
  gender?: "female" | "male" | "other" | "unspecified";
  isActive: boolean;
};

const titleBadgeColors: Record<string, { bg: string; text: string }> = {
  "Hemşire": { bg: "#E3F2FD", text: "#1565C0" },
  "Teknisyen": { bg: "#FFF3E0", text: "#E65100" },
  "Doktor": { bg: "#E8F5E9", text: "#2E7D32" },
  "Uzman": { bg: "#F3E5F5", text: "#7B1FA2" },
  "Yönetici": { bg: "#F3E5F5", text: "#7B1FA2" },
};

const professionBadgeColors: Record<string, { bg: string; text: string }> = {
  "Hemşire": { bg: "#E3F2FD", text: "#1565C0" },
  "Anestezi Teknikeri": { bg: "#FFF3E0", text: "#E65100" },
  "Teknisyen": { bg: "#FFF3E0", text: "#E65100" },
  "Doktor": { bg: "#E8F5E9", text: "#2E7D32" },
};

const departmentBadgeColors: Record<string, { bg: string; text: string }> = {
  "Anestezi": { bg: "#E8EAF6", text: "#283593" },
  "Ameliyathane": { bg: "#E0F7FA", text: "#00695C" },
  "Acil Servis": { bg: "#FCE4EC", text: "#C62828" },
  "Dahiliye": { bg: "#F1F8E9", text: "#558B2F" },
  "Radyoloji": { bg: "#FFF8E1", text: "#F57F17" },
  "Kardiyoloji": { bg: "#FBE9E7", text: "#BF360C" },
};

const roleLabelTr: Record<string, string> = {
  doctor: "Doktor",
  nurse: "Hemşire",
  technician: "Teknisyen",
  admin: "Yönetici",
};

function getBadgeColor(map: Record<string, { bg: string; text: string }>, key: string) {
  return map[key] ?? { bg: "#F1F5F9", text: "#475569" };
}

function getDefaultAvatarSrc(gender?: StaffRow["gender"]) {
  if (gender === "female") {
    return "/images/staff-avatar-female.svg";
  }
  return "/images/staff-avatar-male.svg";
}

export default function StaffPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiClient.get<{ staff: StaffRow[] }>("/staff/");
        setStaff(data.staff);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Personel yüklenemedi");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const filteredStaff = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("tr-TR");
    if (normalized.length === 0) return staff;
    return staff.filter(
      (s) =>
        s.fullName.toLocaleLowerCase("tr-TR").includes(normalized) ||
        (s.departmentName ?? "").toLocaleLowerCase("tr-TR").includes(normalized) ||
        s.role.toLocaleLowerCase("tr-TR").includes(normalized) ||
        (s.title ?? "").toLocaleLowerCase("tr-TR").includes(normalized) ||
        (s.profession ?? "").toLocaleLowerCase("tr-TR").includes(normalized)
    );
  }, [search, staff]);

  const totalStaff = staff.length;
  const activeStaff = staff.filter((s) => s.isActive).length;
  const departments = useMemo(() => {
    return Array.from(
      new Set(filteredStaff.map((s) => s.departmentName).filter((n): n is string => Boolean(n)))
    );
  }, [filteredStaff]);

  return (
    <main style={styles.main}>
      <div style={styles.headerRow}>
        <h1 style={styles.pageTitle}>PERSONEL YÖNETİMİ</h1>
        <button type="button" style={styles.addButton}>
          <Plus size={18} />
          Yeni Personel
        </button>
      </div>

      <section style={styles.searchStatsRow}>
        <div style={styles.searchBox}>
          <h2 style={styles.searchTitle}>Personel Ara</h2>
          <div style={styles.searchInputWrap}>
            <Search size={16} style={{ color: "#94a3b8", flexShrink: 0 }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Örn: Ahmet Soylu, Anestezi, Teknisyen..."
              style={styles.searchInput}
            />
          </div>
        </div>

        <div style={styles.statCard}>
          <p style={styles.statLabel}>TOPLAM PERSONEL</p>
          <p style={styles.statValue}>{totalStaff}</p>
          <p style={styles.statDesc}>Listede görüntülenen toplam personel sayısı</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>AKTİF KADRO</p>
          <p style={styles.statValue}>{activeStaff}</p>
          <p style={styles.statDesc}>Aktif görünen çalışanlardan oluşan mevcut kadro</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>GÖRÜNEN BİRİMLER</p>
          <p style={styles.statValue}>{departments.length}</p>
          <p style={styles.statDesc}>
            {departments.length > 0
              ? `${departments.join(" ve ").toLocaleLowerCase("tr-TR")} dağılımı aynı panelde`
              : "Birim bilgisi yok"}
          </p>
        </div>
      </section>

      <section style={styles.tableSection}>
        <div style={styles.tableHeader}>
          <div>
            <h2 style={styles.tableTitle}>Personel Tablosu</h2>
            <p style={styles.tableSubtitle}>
              Kadro listesini ad, unvan, meslek, birim ve aktiflik durumu ile birlikte inceleyin.
            </p>
          </div>
          <span style={styles.recordBadge}>{filteredStaff.length} kayıt</span>
        </div>

        {loading && <p style={{ padding: 20, color: "#64748b" }}>Yükleniyor...</p>}
        {error && <p style={{ padding: 20, color: "#dc2626" }}>{error}</p>}

        {!loading && !error && (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Ad Soyad</th>
                  <th style={{ ...styles.th, textAlign: "center" }}>Personel No</th>
                  <th style={styles.th}>Unvan</th>
                  <th style={styles.th}>Meslek</th>
                  <th style={styles.th}>Birim</th>
                  <th style={styles.th}>Durum</th>
                  <th style={{ ...styles.th, textAlign: "center" }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ ...styles.td, textAlign: "center", color: "#94a3b8" }}>
                      Filtreye uygun personel bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((row, idx) => {
                    const titleLabel = row.title || (roleLabelTr[row.role] ?? row.role);
                    const professionLabel = row.profession || (roleLabelTr[row.role] ?? row.role);
                    const dept = row.departmentName ?? "Tanımsız";
                    const titleColor = getBadgeColor(titleBadgeColors, titleLabel);
                    const profColor = getBadgeColor(professionBadgeColors, professionLabel);
                    const deptColor = getBadgeColor(departmentBadgeColors, dept);

                    return (
                      <tr
                        key={row.id}
                        onClick={() => router.push(`/staff/${row.id}`)}
                        style={{
                          ...styles.tableRow,
                          backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                          cursor: "pointer",
                        }}
                      >
                        <td style={styles.td}>
                          <div style={styles.nameCell}>
                            <img
                              src={row.photoUrl || getDefaultAvatarSrc(row.gender)}
                              alt={row.fullName}
                              style={styles.avatar}
                            />
                            <div>
                              <p style={styles.nameText}>{row.fullName}</p>
                              <p style={styles.nameSubtext}>Personel kartı ve temel kimlik bilgisi</p>
                            </div>
                          </div>
                        </td>

                        <td style={{ ...styles.td, textAlign: "center" }}>
                          <span style={styles.employeeNoBadge}>{row.employeeNo ?? row.id}</span>
                        </td>

                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.badge,
                              backgroundColor: titleColor.bg,
                              color: titleColor.text,
                            }}
                          >
                            {titleLabel}
                          </span>
                        </td>

                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.badge,
                              backgroundColor: profColor.bg,
                              color: profColor.text,
                            }}
                          >
                            {professionLabel}
                          </span>
                        </td>

                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.badge,
                              backgroundColor: deptColor.bg,
                              color: deptColor.text,
                            }}
                          >
                            {dept}
                          </span>
                        </td>

                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              ...(row.isActive ? { color: "#16a34a" } : { color: "#dc2626" }),
                            }}
                          >
                            <span
                              style={{
                                ...styles.statusDot,
                                backgroundColor: row.isActive ? "#16a34a" : "#dc2626",
                              }}
                            />
                            {row.isActive ? "Aktif" : "Pasif"}
                          </span>
                        </td>

                        <td style={{ ...styles.td, textAlign: "center" }}>
                          <button type="button" style={styles.editButton}>
                            <Settings size={14} />
                            Düzenle
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && <p style={styles.footerCount}>{filteredStaff.length} kayıt</p>}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    padding: "28px 32px",
    fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 0,
    overflow: "hidden",
    boxSizing: "border-box",
    background: "#f1f5f9",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: "0.08em",
    color: "#4A6CF7",
    margin: 0,
  },
  addButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 24px",
    fontSize: 14,
    fontWeight: 700,
    color: "#ffffff",
    background: "linear-gradient(135deg, #4A6CF7 0%, #3B5BDB 100%)",
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(74,108,247,0.35)",
    transition: "all 0.2s ease",
  },
  searchStatsRow: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
    gap: 16,
    marginBottom: 24,
  },
  searchBox: {
    background: "#ffffff",
    borderRadius: 16,
    padding: "20px 24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  searchTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1e293b",
    margin: "0 0 12px 0",
  },
  searchInputWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "10px 14px",
  },
  searchInput: {
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: 13,
    color: "#334155",
    width: "100%",
    fontFamily: "inherit",
  },
  statCard: {
    background: "#ffffff",
    borderRadius: 16,
    padding: "20px 22px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.06em",
    color: "#64748b",
    margin: "0 0 6px 0",
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 32,
    fontWeight: 800,
    color: "#1e293b",
    margin: "0 0 4px 0",
    lineHeight: 1,
  },
  statDesc: {
    fontSize: 11,
    color: "#94a3b8",
    margin: 0,
    lineHeight: 1.4,
  },
  tableSection: {
    background: "#ffffff",
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    overflow: "hidden",
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
  },
  tableHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: "24px 24px 16px",
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#1e293b",
    margin: "0 0 4px 0",
  },
  tableSubtitle: {
    fontSize: 13,
    color: "#94a3b8",
    margin: 0,
  },
  recordBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 14px",
    fontSize: 12,
    fontWeight: 700,
    color: "#4A6CF7",
    background: "#EEF2FF",
    borderRadius: 8,
    whiteSpace: "nowrap",
  },
  tableWrap: {
    flex: 1,
    minHeight: 0,
    overflow: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "12px 20px",
    fontSize: 12,
    fontWeight: 700,
    color: "#64748b",
    textAlign: "left",
    borderBottom: "1px solid #e2e8f0",
    borderTop: "1px solid #e2e8f0",
    background: "#f8fafc",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "14px 20px",
    fontSize: 13,
    color: "#334155",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "middle",
  },
  tableRow: {
    transition: "background 0.15s ease",
  },
  nameCell: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
    background: "#eff6ff",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  nameText: {
    fontSize: 14,
    fontWeight: 700,
    color: "#1e293b",
    margin: 0,
  },
  nameSubtext: {
    fontSize: 11,
    color: "#94a3b8",
    margin: "2px 0 0 0",
  },
  employeeNoBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 34,
    height: 34,
    borderRadius: 10,
    border: "1.5px solid #e2e8f0",
    fontSize: 13,
    fontWeight: 700,
    color: "#334155",
    background: "#f8fafc",
  },
  badge: {
    display: "inline-block",
    padding: "4px 12px",
    fontSize: 12,
    fontWeight: 700,
    borderRadius: 8,
    whiteSpace: "nowrap",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    fontWeight: 700,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    display: "inline-block",
  },
  editButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 700,
    color: "#4A6CF7",
    background: "transparent",
    border: "1.5px solid #dbeafe",
    borderRadius: 8,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  footerCount: {
    padding: "14px 24px",
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: 600,
    borderTop: "1px solid #f1f5f9",
    margin: 0,
  },
};

