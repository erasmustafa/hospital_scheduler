"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";

type ShiftTypeRow = {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  isNight: boolean;
  color: string;
};

export default function ShiftTypesPage() {
  const [rows, setRows] = useState<ShiftTypeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiClient.get<{ shiftTypes: ShiftTypeRow[] }>("/shift-types/");
        setRows(data.shiftTypes);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Vardiya tipleri yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const counts = {
    total: rows.length,
    active: rows.length,
    night: rows.filter((r) => r.isNight).length,
    long: rows.filter((r) => {
      const [startHour] = r.startTime.split(":").map(Number);
      const [endHour] = r.endTime.split(":").map(Number);
      if (Number.isNaN(startHour) || Number.isNaN(endHour)) return false;
      const duration = endHour >= startHour ? endHour - startHour : 24 - startHour + endHour;
      return duration >= 12;
    }).length,
  };

  return (
    <main style={styles.main}>
      {/* ── PAGE HEADER ──────────────────────────────────── */}
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.pageTitle}>VARDIYA TİPLERİ</h1>
          <p style={styles.pageDesc}>
            Saat aralıkları ve gece nöbeti bilgileriyle tüm vardiya şablonlarını yönetin.
          </p>
        </div>
        <button type="button" style={styles.addButton}>
          + Yeni Tip Ekle
        </button>
      </div>

      {loading && <p style={{ padding: 20, color: "#64748b" }}>Yükleniyor...</p>}
      {error && <p style={{ padding: 20, color: "#dc2626" }}>{error}</p>}

      {!loading && !error && (
        <>
          {/* ── STAT CARDS ────────────────────────────────── */}
          <section style={styles.statsRow}>
            <div style={{ ...styles.statCard, borderLeft: "4px solid #4A6CF7" }}>
              <p style={styles.statLabel}>Toplam Vardiya Tipi</p>
              <p style={styles.statValue}>{counts.total}</p>
              <p style={styles.statDesc}>Sistemde tanımlı tüm şablonlar</p>
            </div>
            <div style={{ ...styles.statCard, borderLeft: "4px solid #059669" }}>
              <p style={styles.statLabel}>Aktif Vardiya</p>
              <p style={styles.statValue}>{counts.active}</p>
              <p style={styles.statDesc}>Şu anda kullanılabilir vardiyalar</p>
            </div>
            <div style={{ ...styles.statCard, borderLeft: "4px solid #7C3AED" }}>
              <p style={styles.statLabel}>Gece Nöbeti</p>
              <p style={styles.statValue}>{counts.night}</p>
              <p style={styles.statDesc}>Gece periyodunu kapsayan tipler</p>
            </div>
            <div style={{ ...styles.statCard, borderLeft: "4px solid #DC2626" }}>
              <p style={styles.statLabel}>Uzun Nöbet</p>
              <p style={styles.statValue}>{counts.long}</p>
              <p style={styles.statDesc}>12 saat ve üzeri vardiyalar</p>
            </div>
          </section>

          {/* ── TABLE ────────────────────────────────────── */}
          <section style={styles.tableSection}>
            <div style={styles.tableHeader}>
              <div>
                <h2 style={styles.tableTitle}>Tanımlı Vardiya Tipleri</h2>
                <p style={styles.tableSubtitle}>
                  Sistemde kullanılan vardiya şablonları
                </p>
              </div>
              <span style={styles.recordBadge}>{rows.length} kayıt</span>
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Vardiya Adı</th>
                    <th style={styles.th}>Başlangıç</th>
                    <th style={styles.th}>Bitiş</th>
                    <th style={styles.th}>Tür</th>
                    <th style={styles.th}>Renk</th>
                    <th style={{ ...styles.th, textAlign: "center" }}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          ...styles.td,
                          textAlign: "center",
                          color: "#94a3b8",
                          padding: "32px 20px",
                        }}
                      >
                        Kayıtlı vardiya tipi bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, idx) => (
                      <tr
                        key={row.id}
                        style={{
                          ...styles.tableRow,
                          backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                        }}
                      >
                        <td style={styles.td}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span
                              style={{
                                width: 5,
                                height: 36,
                                borderRadius: 4,
                                backgroundColor: row.color,
                                flexShrink: 0,
                              }}
                            />
                            <div>
                              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                                {row.name}
                              </p>
                              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>
                                {row.startTime} - {row.endTime}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td style={styles.td}>{row.startTime}</td>
                        <td style={styles.td}>{row.endTime}</td>
                        <td style={styles.td}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 12px",
                              fontSize: 12,
                              fontWeight: 700,
                              borderRadius: 20,
                              backgroundColor: row.isNight ? "#EDE9FE" : "#DBEAFE",
                              color: row.isNight ? "#7C3AED" : "#2563EB",
                            }}
                          >
                            {row.isNight ? "Nöbet" : "Gündüz"}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span
                              style={{
                                width: 16,
                                height: 16,
                                borderRadius: 4,
                                backgroundColor: row.color,
                                border: "1px solid #e2e8f0",
                                display: "inline-block",
                              }}
                            />
                            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                              {row.color}
                            </span>
                          </div>
                        </td>
                        <td style={{ ...styles.td, textAlign: "center" }}>
                          <button type="button" style={styles.editButton}>
                            Düzenle
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════
   INLINE STYLES
   ═══════════════════════════════════════════════════════════ */

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

  /* ── header ── */
  headerRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: "0.08em",
    color: "#4A6CF7",
    margin: "0 0 4px 0",
  },
  pageDesc: {
    fontSize: 13,
    color: "#64748b",
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
  },

  /* ── stats ── */
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    background: "#ffffff",
    borderRadius: 16,
    padding: "18px 22px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
    margin: "0 0 6px 0",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
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
  },

  /* ── table section ── */
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
    whiteSpace: "nowrap" as const,
  },
  tableWrap: {
    flex: 1,
    minHeight: 0,
    overflow: "auto" as const,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
  },
  th: {
    padding: "12px 20px",
    fontSize: 12,
    fontWeight: 700,
    color: "#64748b",
    textAlign: "left" as const,
    borderBottom: "1px solid #e2e8f0",
    borderTop: "1px solid #e2e8f0",
    background: "#f8fafc",
    whiteSpace: "nowrap" as const,
  },
  td: {
    padding: "14px 20px",
    fontSize: 13,
    color: "#334155",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "middle" as const,
  },
  tableRow: {
    transition: "background 0.15s ease",
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
  },
};
