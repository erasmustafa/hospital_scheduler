"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api";

type Summary = {
  activeStaff: number;
  totalAssignments: number;
  plannedAssignments: number;
  approvedAssignments: number;
  cancelledAssignments: number;
  totalIssues: number;
  highSeverityIssues: number;
  mediumSeverityIssues: number;
  lowSeverityIssues: number;
  unreadNotifications: number;
};

type BreakdownItem = {
  label: string;
  count: number;
};

type AnalyticsIssue = {
  type: string;
  severity: "high" | "medium" | "low";
  title: string;
  message: string;
  staff: string;
  date: string;
  department: string;
};

type StaffSummaryRow = {
  staffProfileId?: number;
  staffProfileName: string;
  departmentName: string;
  totalHours: number;
  assignmentCount?: number;
  nightCount: number;
  overtimeCount: number;
  mandatoryHours: number;
  extraHours: number;
};

type AnalyticsReport = {
  summary: Summary;
  byStatus: BreakdownItem[];
  byDepartment: BreakdownItem[];
  byShiftType: BreakdownItem[];
  byStaff: StaffSummaryRow[];
  issuesByType: BreakdownItem[];
  issues: AnalyticsIssue[];
  range: {
    dateFrom: string;
    dateTo: string;
    departmentId: number | null;
    status: string | null;
  };
};

type Department = {
  id: number;
  name: string;
};

const avatarGradients = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
  "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
];

function getAvatarGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarGradients[Math.abs(hash) % avatarGradients.length];
}

function getInitial(name: string) {
  return name.charAt(0).toUpperCase();
}

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export default function AnalyticsPage() {
  const today = useMemo(() => new Date(), []);
  const [dateFrom, setDateFrom] = useState(
    isoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30))
  );
  const [dateTo, setDateTo] = useState(
    isoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30))
  );
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [byShiftType, setByShiftType] = useState<BreakdownItem[]>([]);
  const [staffSummary, setStaffSummary] = useState<StaffSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
      if (departmentFilter) query.set("department", departmentFilter);
      if (statusFilter) query.set("status", statusFilter);

      const [reportData, deptData] = await Promise.all([
        apiClient.get<AnalyticsReport>(`/analytics/report/?${query.toString()}`),
        apiClient.get<Department[]>("/departments/"),
      ]);

      setSummary(reportData.summary);
      setByShiftType(reportData.byShiftType);
      setStaffSummary(reportData.byStaff ?? []);
      setDepartments(deptData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analiz verisi yuklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, departmentFilter, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalHours = useMemo(
    () => staffSummary.reduce((sum, row) => sum + row.totalHours, 0),
    [staffSummary]
  );

  const totalNights = useMemo(
    () => staffSummary.reduce((sum, row) => sum + row.nightCount, 0),
    [staffSummary]
  );

  const totalOvertime = useMemo(
    () => staffSummary.reduce((sum, row) => sum + row.overtimeCount, 0),
    [staffSummary]
  );

  return (
    <main style={styles.main}>
      <p style={styles.sectionBadge}>ANALIZ PANELI</p>

      <section style={styles.filterCard}>
        <div style={styles.filterGrid}>
          <label style={styles.filterLabel}>
            <span style={styles.filterLabelText}>Birim</span>
            <select
              style={styles.filterInput}
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="">Tumu</option>
              {departments.map((department) => (
                <option key={department.id} value={String(department.id)}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.filterLabel}>
            <span style={styles.filterLabelText}>Durum</span>
            <select
              style={styles.filterInput}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tumu</option>
              <option value="planned">Taslak</option>
              <option value="approved">Onayli</option>
              <option value="cancelled">Iptal</option>
            </select>
          </label>

          <label style={styles.filterLabel}>
            <span style={styles.filterLabelText}>Baslangic</span>
            <input
              type="date"
              style={styles.filterInput}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </label>

          <label style={styles.filterLabel}>
            <span style={styles.filterLabelText}>Bitis</span>
            <input
              type="date"
              style={styles.filterInput}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </label>

          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              style={styles.analyzeButton}
            >
              Analiz Et
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <p style={{ color: "#dc2626", fontSize: 13, margin: "8px 0" }}>{error}</p>
      ) : null}

      {!loading && summary ? (
        <>
          <section style={styles.statsRow}>
            <div style={{ ...styles.statCard, borderLeft: "4px solid #4A6CF7" }}>
              <p style={styles.statLabel}>Toplam Personel</p>
              <p style={styles.statValue}>{summary.activeStaff}</p>
            </div>
            <div style={{ ...styles.statCard, borderLeft: "4px solid #059669" }}>
              <p style={styles.statLabel}>Personel Bazli Toplam Saat</p>
              <p style={styles.statValue}>
                {totalHours.toLocaleString("tr-TR", { minimumFractionDigits: 1 })}
              </p>
            </div>
            <div style={{ ...styles.statCard, borderLeft: "4px solid #7C3AED" }}>
              <p style={styles.statLabel}>Toplam Nobet</p>
              <p style={styles.statValue}>{totalNights}</p>
            </div>
            <div style={{ ...styles.statCard, borderLeft: "4px solid #D97706" }}>
              <p style={styles.statLabel}>Toplam Mesai</p>
              <p style={styles.statValue}>{totalOvertime}</p>
            </div>
          </section>

          <section style={styles.tableSection}>
            <div style={styles.tableHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h2 style={styles.tableTitle}>Personel Calisma Ozeti</h2>
                <span
                  style={styles.infoIcon}
                  title="Her personelin secilen tarih araligindaki toplam saatlerini ve vardiya dagilimini gosterir."
                >
                  i
                </span>
              </div>
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Personel</th>
                    <th style={styles.th}>Birim</th>
                    <th style={styles.th}>Toplam Saat</th>
                    <th style={{ ...styles.th, textAlign: "center" }}>Nobet</th>
                    <th style={{ ...styles.th, textAlign: "center" }}>Mesai</th>
                    <th style={styles.th}>Zorunlu Sure</th>
                    <th style={styles.th}>Fazla Sure</th>
                  </tr>
                </thead>
                <tbody>
                  {staffSummary.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          ...styles.td,
                          textAlign: "center",
                          color: "#94a3b8",
                          padding: "32px 20px",
                        }}
                      >
                        Analiz sonucu bulunamadi.
                      </td>
                    </tr>
                  ) : (
                    staffSummary.map((row, idx) => {
                      const initial = getInitial(row.staffProfileName);
                      const avatarBg = getAvatarGradient(row.staffProfileName);

                      return (
                        <tr
                          key={`${row.staffProfileId ?? row.staffProfileName}-${idx}`}
                          style={{
                            ...styles.tableRow,
                            backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                          }}
                        >
                          <td style={styles.td}>
                            <div style={styles.nameCell}>
                              <div style={{ ...styles.avatar, background: avatarBg }}>{initial}</div>
                              <div>
                                <p style={styles.nameText}>{row.staffProfileName}</p>
                                <p style={styles.nameSubtext}>
                                  Toplam gorev: {row.assignmentCount ?? row.nightCount + row.overtimeCount}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td style={styles.td}>{row.departmentName}</td>
                          <td style={styles.td}>
                            {row.totalHours.toLocaleString("tr-TR", {
                              minimumFractionDigits: 1,
                            })}{" "}
                            saat
                          </td>
                          <td style={{ ...styles.td, textAlign: "center" }}>
                            <span style={styles.nightBadge}>{row.nightCount}</span>
                          </td>
                          <td style={{ ...styles.td, textAlign: "center" }}>
                            <span style={styles.overtimeBadge}>{row.overtimeCount}</span>
                          </td>
                          <td style={styles.td}>
                            {row.mandatoryHours.toLocaleString("tr-TR", {
                              minimumFractionDigits: 1,
                            })}{" "}
                            saat
                          </td>
                          <td style={styles.td}>
                            {row.extraHours > 0
                              ? `${row.extraHours.toLocaleString("tr-TR", {
                                  minimumFractionDigits: 1,
                                })} saat`
                              : "-"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}

      {loading ? (
        <p style={{ padding: 20, color: "#64748b" }}>Analiz verisi yukleniyor...</p>
      ) : null}
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
  sectionBadge: {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: "0.08em",
    color: "#64748b",
    margin: "0 0 18px 0",
    textTransform: "uppercase" as const,
  },
  filterCard: {
    background: "#ffffff",
    borderRadius: 16,
    padding: "20px 24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    marginBottom: 20,
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr auto",
    gap: 16,
    alignItems: "end",
  },
  filterLabel: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
    fontSize: 13,
  },
  filterLabelText: {
    fontSize: 13,
    fontWeight: 700,
    color: "#475569",
  },
  filterInput: {
    height: 42,
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    padding: "0 14px",
    fontSize: 14,
    color: "#334155",
    background: "#ffffff",
    fontFamily: "inherit",
    outline: "none",
    width: "100%",
  },
  analyzeButton: {
    height: 42,
    padding: "0 28px",
    fontSize: 14,
    fontWeight: 700,
    color: "#ffffff",
    background: "#1e293b",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    transition: "all 0.2s ease",
  },
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
    margin: 0,
    lineHeight: 1.2,
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
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 24px 14px",
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#1e293b",
    margin: 0,
  },
  infoIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "#EEF2FF",
    color: "#4A6CF7",
    fontSize: 12,
    fontWeight: 700,
    cursor: "help",
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
  nameCell: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 800,
    flexShrink: 0,
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
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
  nightBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 28,
    padding: "4px 10px",
    fontSize: 13,
    fontWeight: 700,
    borderRadius: 8,
    backgroundColor: "#EDE9FE",
    color: "#7C3AED",
  },
  overtimeBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 28,
    padding: "4px 10px",
    fontSize: 13,
    fontWeight: 700,
    borderRadius: 8,
    backgroundColor: "#FEF3C7",
    color: "#D97706",
  },
};
