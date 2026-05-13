"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  MoreHorizontal,
  UsersRound,
} from "lucide-react";
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

const avatarColors = [
  "linear-gradient(135deg, #6d5dfc 0%, #7c3aed 100%)",
  "linear-gradient(135deg, #8de16f 0%, #55c757 100%)",
  "linear-gradient(135deg, #75a7ff 0%, #4a7cf7 100%)",
  "linear-gradient(135deg, #5cd6dc 0%, #28b9c7 100%)",
  "linear-gradient(135deg, #4eb6ff 0%, #2794e8 100%)",
  "linear-gradient(135deg, #9b6cff 0%, #7d4be8 100%)",
  "linear-gradient(135deg, #63d3df 0%, #44bccb 100%)",
  "linear-gradient(135deg, #ff7aa5 0%, #f05284 100%)",
];

function getAvatarGradient(name: string) {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getInitials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("tr-TR"))
    .join("") || "MB";
}

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formatDateForInput(value: string) {
  if (!value) return "";
  return new Date(`${value}T12:00:00`).toLocaleDateString("tr-TR");
}

function formatHours(value: number) {
  return value.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
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
  const [staffSummary, setStaffSummary] = useState<StaffSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

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
      setStaffSummary(reportData.byStaff ?? []);
      setDepartments(deptData);
      setCurrentPage(1);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analiz verisi yüklenemedi.");
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

  const totalPages = Math.max(1, Math.ceil(staffSummary.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const visibleStart = staffSummary.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const visibleEnd = Math.min(safeCurrentPage * pageSize, staffSummary.length);
  const pagedRows = staffSummary.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  const handleReportDownload = () => {
    const headers = [
      "Personel",
      "Birim",
      "Toplam Saat",
      "Nöbet",
      "Mesai",
      "Zorunlu Süre",
      "Fazla Süre",
    ];
    const escapeCsv = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const rows = staffSummary.map((row) =>
      [
        row.staffProfileName,
        row.departmentName,
        `${formatHours(row.totalHours)} saat`,
        String(row.nightCount),
        String(row.overtimeCount),
        `${formatHours(row.mandatoryHours)} saat`,
        row.extraHours > 0 ? `${formatHours(row.extraHours)} saat` : "-",
      ].map(escapeCsv).join(",")
    );
    const csv = [headers.map(escapeCsv).join(","), ...rows].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `personel-analiz-${dateFrom}-${dateTo}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const stats = [
    {
      label: "Toplam Personel",
      value: summary?.activeStaff ?? 0,
      note: "Aktif personel sayısı",
      icon: UsersRound,
      color: "#4f7df7",
      tint: "#eef2ff",
    },
    {
      label: "Personel Bazlı Toplam Saat",
      value: formatHours(totalHours),
      note: "Toplam çalışma saati",
      icon: Clock3,
      color: "#14b8a6",
      tint: "#e8fbf5",
    },
    {
      label: "Toplam Nöbet",
      value: totalNights,
      note: "Seçilen tarih aralığında",
      icon: BriefcaseBusiness,
      color: "#8b5cf6",
      tint: "#f1eafe",
    },
    {
      label: "Toplam Mesai",
      value: totalOvertime,
      note: "Seçilen tarih aralığında",
      icon: CalendarDays,
      color: "#f97316",
      tint: "#fff1e8",
    },
  ];

  return (
    <main style={styles.main}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .analytics-action {
              transition: transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease, background 150ms ease;
            }
            .analytics-action:hover:not(:disabled) {
              transform: translateY(-1px);
              box-shadow: 0 12px 24px rgba(79, 70, 229, 0.14);
              border-color: #c7d2fe !important;
            }
            .analytics-action:active:not(:disabled) {
              transform: translateY(0) scale(0.98);
            }
            .analytics-action:disabled {
              opacity: 0.55;
              cursor: not-allowed;
            }
            .analytics-select {
              appearance: none;
            }
            .analytics-date::-webkit-calendar-picker-indicator {
              opacity: 0;
              cursor: pointer;
            }
            .analytics-row {
              transition: background 150ms ease, transform 150ms ease;
            }
            .analytics-row:hover {
              background: #fbfdff !important;
            }
          `,
        }}
      />

      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Analiz Paneli</h1>
          <p style={styles.subtitle}>Seçtiğiniz tarih aralığındaki personel çalışma verilerini analiz edin.</p>
        </div>
        <button type="button" className="analytics-action" style={styles.reportButton} onClick={handleReportDownload}>
          <Download size={16} />
          Raporu İndir
        </button>
      </header>

      <section style={styles.filterCard}>
        <label style={styles.field}>
          <span style={styles.fieldLabel}>Birim</span>
          <span style={styles.selectWrap}>
            <select
              className="analytics-select"
              style={styles.fieldInput}
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
            >
              <option value="">Tümü</option>
              {departments.map((department) => (
                <option key={department.id} value={String(department.id)}>
                  {department.name}
                </option>
              ))}
            </select>
            <ChevronDown size={15} style={styles.fieldIcon} />
          </span>
        </label>

        <label style={styles.field}>
          <span style={styles.fieldLabel}>Durum</span>
          <span style={styles.selectWrap}>
            <select
              className="analytics-select"
              style={styles.fieldInput}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">Tümü</option>
              <option value="planned">Taslak</option>
              <option value="approved">Onaylı</option>
              <option value="cancelled">İptal</option>
            </select>
            <ChevronDown size={15} style={styles.fieldIcon} />
          </span>
        </label>

        <label style={styles.field}>
          <span style={styles.fieldLabel}>Başlangıç</span>
          <span style={styles.selectWrap}>
            <input
              className="analytics-date"
              type="date"
              style={styles.fieldInput}
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
            <CalendarDays size={15} style={styles.fieldIcon} />
          </span>
        </label>

        <label style={styles.field}>
          <span style={styles.fieldLabel}>Bitiş</span>
          <span style={styles.selectWrap}>
            <input
              className="analytics-date"
              type="date"
              style={styles.fieldInput}
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
            <CalendarDays size={15} style={styles.fieldIcon} />
          </span>
        </label>

        <button
          type="button"
          className="analytics-action"
          onClick={() => void load()}
          disabled={loading}
          style={styles.analyzeButton}
        >
          <BarChart3 size={17} />
          Analiz Et
        </button>
      </section>

      {error ? <p style={styles.errorText}>{error}</p> : null}

      <section style={styles.statsGrid}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} style={{ ...styles.statCard, borderLeftColor: stat.color }}>
              <div style={{ ...styles.statIcon, background: stat.tint, color: stat.color }}>
                <Icon size={28} />
              </div>
              <div style={styles.statContent}>
                <span style={styles.statLabel}>{stat.label}</span>
                <strong style={styles.statValue}>{stat.value}</strong>
                <span style={styles.statNote}>
                  <span style={{ ...styles.statDot, background: stat.color }} />
                  {stat.note}
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <section style={styles.tableSection}>
        <div style={styles.tableHeader}>
          <div style={styles.tableTitleWrap}>
            <h2 style={styles.tableTitle}>Personel Çalışma Özeti</h2>
            <span
              style={styles.infoBadge}
              title="Her personelin seçilen tarih aralığındaki toplam saatlerini ve vardiya dağılımını gösterir."
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
                <th style={{ ...styles.th, textAlign: "center" }}>Nöbet</th>
                <th style={{ ...styles.th, textAlign: "center" }}>Mesai</th>
                <th style={styles.th}>Zorunlu Süre</th>
                <th style={styles.th}>Fazla Süre</th>
                <th style={{ ...styles.th, width: 42 }} />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={styles.emptyCell}>
                    Analiz verisi yükleniyor...
                  </td>
                </tr>
              ) : pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={styles.emptyCell}>
                    Analiz sonucu bulunamadı.
                  </td>
                </tr>
              ) : (
                pagedRows.map((row, index) => (
                  <tr
                    key={`${row.staffProfileId ?? row.staffProfileName}-${index}`}
                    className="analytics-row"
                    style={{
                      ...styles.tableRow,
                      background: index % 2 === 0 ? "#ffffff" : "#fbfcff",
                    }}
                  >
                    <td style={styles.td}>
                      <div style={styles.nameCell}>
                        <div style={{ ...styles.avatar, background: getAvatarGradient(row.staffProfileName) }}>
                          {getInitials(row.staffProfileName)}
                        </div>
                        <div>
                          <p style={styles.nameText}>{row.staffProfileName}</p>
                          <p style={styles.nameSubtext}>
                            Toplam görev: {row.assignmentCount ?? row.nightCount + row.overtimeCount}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>{row.departmentName || "-"}</td>
                    <td style={styles.td}>{formatHours(row.totalHours)} saat</td>
                    <td style={{ ...styles.td, textAlign: "center" }}>
                      <span style={styles.nightBadge}>{row.nightCount}</span>
                    </td>
                    <td style={{ ...styles.td, textAlign: "center" }}>
                      <span style={styles.overtimeBadge}>{row.overtimeCount}</span>
                    </td>
                    <td style={styles.td}>{formatHours(row.mandatoryHours)} saat</td>
                    <td style={styles.td}>
                      {row.extraHours > 0 ? `${formatHours(row.extraHours)} saat` : "-"}
                    </td>
                    <td style={{ ...styles.td, textAlign: "right" }}>
                      <button type="button" className="analytics-action" style={styles.moreButton} aria-label="Detay">
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer style={styles.tableFooter}>
          <div style={styles.footerSummary}>
            <span>Toplam {summary?.activeStaff ?? staffSummary.length} personel</span>
            <span style={styles.footerDot}>•</span>
            <span>{staffSummary.length} kayıttan {visibleStart} - {visibleEnd} arası gösteriliyor</span>
          </div>
          <div style={styles.pagination}>
            <button
              type="button"
              className="analytics-action"
              style={styles.pageButton}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safeCurrentPage === 1}
            >
              <ChevronLeft size={16} />
            </button>
            <button type="button" style={{ ...styles.pageButton, ...styles.pageButtonActive }}>
              {safeCurrentPage}
            </button>
            <button
              type="button"
              className="analytics-action"
              style={styles.pageButton}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safeCurrentPage === totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <button type="button" className="analytics-action" style={styles.pageSizeButton}>
            10 / sayfa
            <ChevronDown size={14} />
          </button>
        </footer>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  main: {
    minHeight: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 18,
    padding: "26px 34px",
    boxSizing: "border-box",
    overflow: "hidden",
    background:
      "radial-gradient(circle at 14% 0%, rgba(79, 70, 229, 0.06), transparent 28%), linear-gradient(180deg, #f9fbff 0%, #f3f7fc 100%)",
    fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    color: "#101936",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 18,
  },
  title: {
    margin: 0,
    fontSize: 26,
    lineHeight: 1.15,
    fontWeight: 700,
    color: "#0f1735",
    letterSpacing: "-0.03em",
  },
  subtitle: {
    margin: "8px 0 0",
    fontSize: 13,
    lineHeight: 1.5,
    fontWeight: 500,
    color: "#6a7898",
  },
  reportButton: {
    minWidth: 136,
    height: 42,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    border: "1px solid #dce5f5",
    borderRadius: 8,
    background: "#ffffff",
    color: "#5b50f6",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 26px rgba(15, 23, 42, 0.05)",
  },
  filterCard: {
    display: "grid",
    gridTemplateColumns: "1.05fr 1.05fr 1fr 1fr auto",
    gap: 18,
    alignItems: "end",
    padding: 20,
    borderRadius: 10,
    border: "1px solid #dce5f5",
    background: "rgba(255,255,255,0.92)",
    boxShadow: "0 18px 38px rgba(15, 23, 42, 0.07)",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minWidth: 0,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#243754",
  },
  selectWrap: {
    position: "relative",
    display: "block",
  },
  fieldInput: {
    width: "100%",
    height: 40,
    border: "1px solid #d9e4f4",
    borderRadius: 7,
    background: "#ffffff",
    color: "#34425f",
    fontSize: 13,
    fontWeight: 500,
    fontFamily: "inherit",
    padding: "0 38px 0 14px",
    outline: "none",
    boxSizing: "border-box",
  },
  fieldIcon: {
    position: "absolute",
    right: 13,
    top: 12,
    color: "#52627f",
    pointerEvents: "none",
  },
  analyzeButton: {
    height: 48,
    minWidth: 130,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    border: "none",
    borderRadius: 8,
    background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
    color: "#ffffff",
    fontSize: 13,
    fontWeight: 700,
    fontFamily: "inherit",
    cursor: "pointer",
    boxShadow: "0 16px 28px rgba(79, 70, 229, 0.28)",
  },
  errorText: {
    margin: "-4px 0 0",
    color: "#dc2626",
    fontSize: 13,
    fontWeight: 600,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 22,
  },
  statCard: {
    minHeight: 112,
    display: "flex",
    alignItems: "center",
    gap: 18,
    padding: "18px 22px",
    borderRadius: 10,
    border: "1px solid #e0e7f2",
    borderLeft: "2px solid",
    background: "rgba(255,255,255,0.94)",
    boxShadow: "0 18px 38px rgba(15, 23, 42, 0.07)",
    boxSizing: "border-box",
  },
  statIcon: {
    width: 68,
    height: 68,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "0 0 auto",
  },
  statContent: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
    minWidth: 0,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#667396",
  },
  statValue: {
    fontSize: 28,
    lineHeight: 1,
    fontWeight: 700,
    color: "#101936",
    letterSpacing: "-0.03em",
  },
  statNote: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "#667396",
    fontSize: 12,
    fontWeight: 500,
  },
  statDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    flex: "0 0 auto",
  },
  tableSection: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    borderRadius: 10,
    border: "1px solid #dce5f5",
    background: "rgba(255,255,255,0.94)",
    boxShadow: "0 20px 45px rgba(15, 23, 42, 0.08)",
  },
  tableHeader: {
    minHeight: 58,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    borderBottom: "1px solid #eef2f7",
  },
  tableTitleWrap: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },
  tableTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: "#101936",
  },
  infoBadge: {
    width: 17,
    height: 17,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "#eef2ff",
    color: "#5b50f6",
    fontSize: 11,
    fontWeight: 700,
    cursor: "help",
  },
  tableWrap: {
    flex: 1,
    minHeight: 0,
    overflow: "auto",
    padding: "0 20px",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    tableLayout: "fixed",
  },
  th: {
    position: "sticky",
    top: 0,
    zIndex: 2,
    height: 43,
    padding: "0 10px",
    borderBottom: "1px solid #e5ebf5",
    background: "#fafcff",
    color: "#64718f",
    fontSize: 12,
    fontWeight: 700,
    textAlign: "left",
    whiteSpace: "nowrap",
  },
  tableRow: {
    height: 58,
  },
  td: {
    padding: "8px 10px",
    borderBottom: "1px solid #edf1f7",
    color: "#223252",
    fontSize: 13,
    fontWeight: 500,
    verticalAlign: "middle",
  },
  emptyCell: {
    padding: "34px 20px",
    color: "#8190ad",
    fontSize: 13,
    textAlign: "center",
  },
  nameCell: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontSize: 12,
    fontWeight: 700,
    flex: "0 0 auto",
    boxShadow: "0 8px 18px rgba(79, 70, 229, 0.18)",
  },
  nameText: {
    margin: 0,
    color: "#101936",
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.25,
  },
  nameSubtext: {
    margin: "3px 0 0",
    color: "#7583a1",
    fontSize: 11,
    fontWeight: 500,
  },
  nightBadge: {
    minWidth: 28,
    height: 28,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    background: "#eee7ff",
    color: "#7c3aed",
    fontSize: 13,
    fontWeight: 700,
  },
  overtimeBadge: {
    minWidth: 28,
    height: 28,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    background: "#fff1cf",
    color: "#f59e0b",
    fontSize: 13,
    fontWeight: 700,
  },
  moreButton: {
    width: 30,
    height: 30,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    borderRadius: 8,
    background: "transparent",
    color: "#243754",
    cursor: "pointer",
  },
  tableFooter: {
    minHeight: 62,
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    gap: 16,
    padding: "0 20px",
    borderTop: "1px solid #e5ebf5",
    background: "#ffffff",
  },
  footerSummary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 9,
    color: "#6d7b98",
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  footerDot: {
    color: "#a8b3c7",
  },
  pagination: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  pageButton: {
    width: 34,
    height: 34,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #dce5f5",
    borderRadius: 8,
    background: "#ffffff",
    color: "#52627f",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  pageButtonActive: {
    borderColor: "#6d5dfc",
    background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
    color: "#ffffff",
    boxShadow: "0 12px 24px rgba(79, 70, 229, 0.22)",
  },
  pageSizeButton: {
    justifySelf: "end",
    height: 36,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "0 14px",
    border: "1px solid #dce5f5",
    borderRadius: 8,
    background: "#ffffff",
    color: "#465674",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
};
