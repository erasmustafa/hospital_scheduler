"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api";

type DashboardSummary = {
  activeStaff: number;
  todaysAssignments: number;
  pendingApprovals: number;
  unreadNotifications: number;
};

type AssignmentRow = {
  id: number;
  assignmentDate: string;
  staffProfileName: string;
  shiftTypeName: string;
  departmentName: string;
  shiftColor: string;
};

type CalendarDay = {
  key: string;
  date: Date;
  isCurrentMonth: boolean;
  items: AssignmentRow[];
};

const dayLabels = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
}

function buildMonthGrid(anchor: Date, grouped: Map<string, AssignmentRow[]>) {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const first = new Date(year, month, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - mondayOffset);
  const days: CalendarDay[] = [];

  for (let i = 0; i < 42; i += 1) {
    const current = new Date(gridStart);
    current.setDate(gridStart.getDate() + i);
    const key = toIsoDate(current);
    days.push({
      key,
      date: current,
      isCurrentMonth: current.getMonth() === month,
      items: grouped.get(key) ?? [],
    });
  }
  return days;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      const data = await apiClient.get<DashboardSummary>("/dashboard/summary/");
      setSummary(data);
      setSummaryError(null);
    } catch (error) {
      setSummaryError(
        error instanceof Error ? error.message : "Özet verisi alınamadı."
      );
    }
  }, []);

  const loadMonthAssignments = useCallback(async (monthDate: Date) => {
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    try {
      const query = new URLSearchParams({
        date_from: toIsoDate(monthStart),
        date_to: toIsoDate(monthEnd),
      }).toString();
      const data = await apiClient.get<{ assignments: AssignmentRow[] }>(
        `/assignments/?${query}`
      );
      setAssignments(data.assignments);
      setCalendarError(null);
    } catch (error) {
      setCalendarError(
        error instanceof Error ? error.message : "Takvim verisi alınamadı."
      );
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    void loadMonthAssignments(monthCursor);
  }, [loadMonthAssignments, monthCursor]);

  const groupedAssignments = useMemo(() => {
    const map = new Map<string, AssignmentRow[]>();
    for (const assignment of assignments) {
      const key = assignment.assignmentDate;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(assignment);
    }
    return map;
  }, [assignments]);

  const calendarDays = useMemo(
    () => buildMonthGrid(monthCursor, groupedAssignments),
    [groupedAssignments, monthCursor]
  );

  const todayKey = useMemo(() => toIsoDate(new Date()), []);

  return (
    <main style={styles.main}>
      {/* ── STATS ROW ─────────────────────────────────── */}
      <section style={styles.statsRow}>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #4A6CF7" }}>
          <p style={styles.statLabel}>Aktif Personel</p>
          <p style={styles.statValue}>{summary?.activeStaff ?? "-"}</p>
          <p style={styles.statDesc}>Bugün görevdeki ekip</p>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #059669" }}>
          <p style={styles.statLabel}>Bugünkü Vardiya</p>
          <p style={styles.statValue}>{summary?.todaysAssignments ?? "-"}</p>
          <p style={styles.statDesc}>Planlanan kayıtlar</p>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #D97706" }}>
          <p style={styles.statLabel}>Bekleyen Onay</p>
          <p style={styles.statValue}>{summary?.pendingApprovals ?? "-"}</p>
          <p style={styles.statDesc}>Onay bekleyen izinler</p>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #DC2626" }}>
          <p style={styles.statLabel}>Okunmamış Mesaj</p>
          <p style={styles.statValue}>{summary?.unreadNotifications ?? "-"}</p>
          <p style={styles.statDesc}>Bildirim merkezi</p>
        </div>
      </section>

      {summaryError && <p style={{ color: "#dc2626", fontSize: 13 }}>{summaryError}</p>}

      <div style={styles.twoCol}>
        {/* ── LEFT: CALENDAR ────────────────────────────── */}
        <section style={styles.card}>
          <div style={styles.calendarNav}>
            <div>
              <h2 style={styles.cardTitle}>Aylık Plan Görünümü</h2>
              <p style={styles.cardSubtitle}>Gün detayına tıklayarak vardiyaları gör</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                onClick={() =>
                  setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                }
                style={styles.navButton}
              >
                ‹
              </button>
              <p style={styles.monthLabel}>
                {monthLabel(monthCursor).charAt(0).toUpperCase() + monthLabel(monthCursor).slice(1)}
              </p>
              <button
                type="button"
                onClick={() =>
                  setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                }
                style={styles.navButton}
              >
                ›
              </button>
            </div>
          </div>

          {calendarError && <p style={{ color: "#dc2626", fontSize: 13 }}>{calendarError}</p>}

          <div style={styles.dayLabelsRow}>
            {dayLabels.map((lbl) => (
              <span key={lbl} style={styles.dayLabel}>
                {lbl}
              </span>
            ))}
          </div>

          <div style={styles.calendarGrid}>
            {calendarDays.map((day) => {
              const isToday = day.key === todayKey;
              return (
                <button
                  type="button"
                  key={day.key}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    ...styles.dayCell,
                    backgroundColor: isToday ? "#EEF2FF" : day.isCurrentMonth ? "#ffffff" : "#f8fafc",
                    border: isToday ? "2px solid #4A6CF7" : "1px solid #e2e8f0",
                    color: day.isCurrentMonth ? "#1e293b" : "#cbd5e1",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={styles.dayNumber}>{day.date.getDate()}</span>
                    {day.items.length > 0 && (
                      <span style={styles.dayBadge}>{day.items.length}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {day.items.slice(0, 2).map((item) => (
                      <p key={item.id} style={styles.dayItem}>
                        {item.staffProfileName}
                      </p>
                    ))}
                    {day.items.length > 2 && (
                      <p style={styles.dayMore}>+{day.items.length - 2} daha</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── RIGHT: QUICK ACTIONS ──────────────────────── */}
        <aside style={styles.card}>
          <h2 style={styles.cardTitle}>Hızlı İşlemler</h2>
          <p style={styles.cardSubtitle}>Sık kullandığın ekranlara tek tıkla geçiş</p>
          <div style={styles.actionsList}>
            <Link href="/shifts" style={styles.actionBtn}>
              <span style={styles.actionIcon}>📋</span> Vardiya Listesi
            </Link>
            <Link href="/auto-schedule" style={styles.actionBtn}>
              <span style={styles.actionIcon}>✨</span> Otomatik Liste Oluştur
            </Link>
            <Link href="/approvals" style={styles.actionBtn}>
              <span style={styles.actionIcon}>✓</span> Bekleyen Onaylar
            </Link>
            <Link href="/analytics" style={styles.actionBtn}>
              <span style={styles.actionIcon}>📊</span> Analiz Raporu
            </Link>
          </div>
          <div style={styles.systemStatus}>
            <p style={styles.systemStatusLabel}>SİSTEM DURUMU</p>
            <p style={styles.systemStatusText}>Takvim servisi aktif, canlı güncellemeler açık.</p>
          </div>
        </aside>
      </div>

      {/* ── MODAL ─────────────────────────────────────── */}
      {selectedDay && (
        <div style={styles.modalOverlay} onClick={() => setSelectedDay(null)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>
                  {selectedDay.date.toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    weekday: "long"
                  })}
                </h3>
                <p style={styles.modalSubtitle}>
                  {selectedDay.items.length > 0
                    ? `${selectedDay.items.length} görev bulundu`
                    : "Bu gün için kayıt yok"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                style={styles.modalClose}
              >
                Kapat
              </button>
            </div>
            <div style={styles.modalBody}>
              {selectedDay.items.length === 0 ? (
                <p style={styles.modalEmpty}>Bu tarihte planlı vardiya yok.</p>
              ) : (
                selectedDay.items.map((item) => (
                  <div key={item.id} style={styles.modalItem}>
                    <p style={styles.modalItemTitle}>{item.staffProfileName}</p>
                    <p style={styles.modalItemDesc}>
                      {item.shiftTypeName} - {item.departmentName}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
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
    overflow: "auto",
    boxSizing: "border-box",
    background: "#f1f5f9",
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: "#1e293b",
    margin: "0 0 6px 0",
  },
  pageDesc: {
    fontSize: 13,
    color: "#64748b",
    margin: "0 0 20px 0",
    lineHeight: 1.5,
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
    lineHeight: 1.2,
  },
  statDesc: {
    fontSize: 11,
    color: "#94a3b8",
    margin: 0,
  },

  twoCol: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: 24,
    alignItems: "start",
  },

  card: {
    background: "#ffffff",
    borderRadius: 16,
    padding: "24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#1e293b",
    margin: "0 0 4px 0",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#64748b",
    margin: "0 0 16px 0",
  },

  /* ── calendar ── */
  calendarNav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    fontSize: 16,
    fontWeight: 700,
    color: "#334155",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: {
    minWidth: 120,
    textAlign: "center" as const,
    fontSize: 14,
    fontWeight: 700,
    color: "#1e293b",
    margin: 0,
  },
  dayLabelsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 4,
    marginBottom: 8,
    textAlign: "center" as const,
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 4,
  },
  dayCell: {
    minHeight: 100,
    borderRadius: 8,
    padding: "8px",
    cursor: "pointer",
    textAlign: "left" as const,
    fontFamily: "inherit",
    transition: "transform 0.1s ease, box-shadow 0.1s ease",
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: 700,
  },
  dayBadge: {
    background: "#DBEAFE",
    color: "#1D4ED8",
    fontSize: 10,
    fontWeight: 800,
    padding: "2px 6px",
    borderRadius: 12,
  },
  dayItem: {
    fontSize: 11,
    fontWeight: 600,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    margin: 0,
  },
  dayMore: {
    fontSize: 11,
    fontWeight: 700,
    color: "#4A6CF7",
    margin: 0,
  },

  /* ── quick actions ── */
  actionsList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    color: "#334155",
    textDecoration: "none",
    transition: "background 0.2s ease",
  },
  actionIcon: {
    fontSize: 16,
  },
  systemStatus: {
    background: "#ECFDF5",
    border: "1px solid #A7F3D0",
    borderRadius: 12,
    padding: "14px 16px",
  },
  systemStatusLabel: {
    fontSize: 11,
    fontWeight: 800,
    color: "#059669",
    margin: "0 0 4px 0",
  },
  systemStatusText: {
    fontSize: 13,
    fontWeight: 600,
    color: "#065F46",
    margin: 0,
    lineHeight: 1.4,
  },

  /* ── modal ── */
  modalOverlay: {
    position: "fixed" as const,
    inset: 0,
    zIndex: 50,
    display: "grid",
    placeItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    background: "#ffffff",
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
    overflow: "hidden",
  },
  modalHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: "20px 24px 12px",
    gap: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#1e293b",
    margin: 0,
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#94a3b8",
    margin: "4px 0 0 0",
  },
  modalClose: {
    height: 34,
    padding: "0 16px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    fontSize: 13,
    fontWeight: 700,
    color: "#334155",
    cursor: "pointer",
    flexShrink: 0,
  },
  modalBody: {
    maxHeight: 340,
    overflowY: "auto" as const,
    padding: "0 24px 20px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  modalEmpty: {
    padding: "16px",
    fontSize: 13,
    color: "#94a3b8",
    background: "#f8fafc",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    margin: 0,
  },
  modalItem: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
  },
  modalItemTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#1e293b",
    margin: 0,
  },
  modalItemDesc: {
    fontSize: 12,
    color: "#64748b",
    margin: "2px 0 0 0",
  },
};
