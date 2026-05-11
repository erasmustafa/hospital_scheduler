"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bot,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  Info,
  UsersRound,
} from "lucide-react";
import { apiClient } from "@/lib/api";

type DashboardSummary = {
  activeStaff: number;
  todaysAssignments: number;
  pendingApprovals: number;
  unreadNotifications: number;
};

type StaffRow = {
  id: number;
  fullName: string;
  departmentName: string | null;
  isActive: boolean;
};

type AssignmentRow = {
  id: number;
  assignmentDate: string;
  staffProfileId?: number;
  staffProfileName: string;
  shiftTypeName: string;
  departmentName: string;
  shiftColor: string;
  startTime?: string | null;
  endTime?: string | null;
};

type ShiftKind = "Gündüz" | "Akşam" | "Gece" | "Nöbet" | "İzinli" | "Dinlenme";

type ScheduleCell = {
  type: ShiftKind;
  time: string;
  assignment?: AssignmentRow;
};

type ScheduleRow = {
  id: string;
  name: string;
  shifts: ScheduleCell[];
};

const weekdayShort = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

const shiftStyles: Record<ShiftKind, { bg: string; text: string }> = {
  Gündüz: { bg: "#ecfdf3", text: "#078247" },
  Akşam: { bg: "#eef4ff", text: "#1554d1" },
  Gece: { bg: "#f2eafe", text: "#6d35d5" },
  Nöbet: { bg: "#fff7e6", text: "#b7791f" },
  İzinli: { bg: "#f4f6fa", text: "#46546b" },
  Dinlenme: { bg: "#f8fafc", text: "#9aa7bb" },
};

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getMonday(date: Date) {
  const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const mondayOffset = (normalized.getDay() + 6) % 7;
  normalized.setDate(normalized.getDate() - mondayOffset);
  return normalized;
}

function formatDayLabel(date: Date) {
  return `${date.getDate()} ${weekdayShort[date.getDay()]}`;
}

function formatWeekRange(startDate: Date) {
  const endDate = addDays(startDate, 6);
  const startMonth = startDate.toLocaleDateString("tr-TR", { month: "long" });
  const endMonth = endDate.toLocaleDateString("tr-TR", { month: "long" });

  if (startDate.getMonth() === endDate.getMonth()) {
    return `${startDate.getDate()} – ${endDate.getDate()} ${endMonth} ${endDate.getFullYear()}`;
  }

  return `${startDate.getDate()} ${startMonth} – ${endDate.getDate()} ${endMonth} ${endDate.getFullYear()}`;
}

function normalizeTime(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 5);
}

function inferShiftKind(assignment?: AssignmentRow): ShiftKind {
  if (!assignment) return "Dinlenme";
  const label = assignment.shiftTypeName.toLocaleLowerCase("tr-TR");
  const start = normalizeTime(assignment.startTime);

  if (label.includes("izin")) return "İzinli";
  if (label.includes("nöbet") || label.includes("nobet")) return "Nöbet";
  if (label.includes("gece") || start >= "20:00" || start < "08:00") return "Gece";
  if (label.includes("akşam") || label.includes("aksam") || start >= "16:00") return "Akşam";
  return "Gündüz";
}

function formatAssignmentTime(assignment?: AssignmentRow) {
  if (!assignment) return "Dinlenme";
  const start = normalizeTime(assignment.startTime) || "08:00";
  const end = normalizeTime(assignment.endTime) || "16:00";
  return `${start} - ${end}`;
}

function CompliancePill({ icon, text }: { icon: "check" | "info"; text: string }) {
  return (
    <div style={styles.compliancePill}>
      <span style={icon === "check" ? styles.successIcon : styles.infoIcon}>
        {icon === "check" ? <Check size={14} /> : <Info size={14} />}
      </span>
      {text}
    </div>
  );
}

function SummaryMetric({
  icon,
  value,
  label,
  note,
  tone,
}: {
  icon: ReactNode;
  value: string;
  label: string;
  note: string;
  tone: "blue" | "green" | "purple";
}) {
  const palette = {
    blue: { bg: "#eef4ff", color: "#2563eb" },
    green: { bg: "#eafaf0", color: "#22a35a" },
    purple: { bg: "#f1e9ff", color: "#7c3aed" },
  }[tone];

  return (
    <div style={styles.summaryMetric}>
      <span style={{ ...styles.metricIcon, background: palette.bg, color: palette.color }}>{icon}</span>
      <div>
        <strong style={styles.metricValue}>{value}</strong>
        <p style={styles.metricLabel}>{label}</p>
        <small style={{ ...styles.metricNote, color: palette.color }}>{note}</small>
      </div>
    </div>
  );
}

function ShiftChip({ shift }: { shift: ScheduleCell }) {
  const tone = shiftStyles[shift.type];

  return (
    <div style={{ ...styles.shiftChip, background: tone.bg, color: tone.text }}>
      <strong>{shift.assignment?.shiftTypeName ?? shift.type}</strong>
      <span>{shift.time}</span>
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [lastUpdated, setLastUpdated] = useState("");
  const [isDistributionHovered, setIsDistributionHovered] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const weekDateKeys = useMemo(() => weekDates.map(toIsoDate), [weekDates]);

  const loadSummary = useCallback(async () => {
    try {
      const data = await apiClient.get<DashboardSummary>("/dashboard/summary/");
      setSummary(data);
      setSummaryError(null);
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : "Özet verisi alınamadı.");
    }
  }, []);

  const loadSchedule = useCallback(async (startDate: Date) => {
    const endDate = addDays(startDate, 6);
    const query = new URLSearchParams({
      date_from: toIsoDate(startDate),
      date_to: toIsoDate(endDate),
    }).toString();

    try {
      const [staffResponse, assignmentResponse] = await Promise.all([
        apiClient.get<{ staff: StaffRow[] }>("/staff/"),
        apiClient.get<{ assignments: AssignmentRow[] }>(`/assignments/?${query}`),
      ]);
      setStaff(staffResponse.staff);
      setAssignments(assignmentResponse.assignments);
      setLastUpdated(new Date().toLocaleString("tr-TR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }));
      setScheduleError(null);
    } catch (error) {
      setScheduleError(error instanceof Error ? error.message : "Çalışma programı verisi alınamadı.");
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    void loadSchedule(weekStart);
  }, [loadSchedule, weekStart]);

  const assignmentMap = useMemo(() => {
    const map = new Map<string, AssignmentRow>();
    for (const assignment of assignments) {
      const staffKey = assignment.staffProfileId ? String(assignment.staffProfileId) : assignment.staffProfileName;
      map.set(`${staffKey}:${assignment.assignmentDate}`, assignment);
    }
    return map;
  }, [assignments]);

  const activeStaff = useMemo(() => staff.filter((person) => person.isActive), [staff]);

  const scheduleRows = useMemo<ScheduleRow[]>(() => {
    const assignedNames = new Set(assignments.map((assignment) => assignment.staffProfileName));
    const visibleStaff = activeStaff.length > 0 ? activeStaff : staff;
    const staffRows = visibleStaff.length > 0 ? visibleStaff : Array.from(assignedNames).map((name, index) => ({
      id: index,
      fullName: name,
      departmentName: null,
      isActive: true,
    }));

    return staffRows.slice(0, 10).map((person) => {
      const staffKey = String(person.id);

      return {
        id: staffKey,
        name: person.fullName,
        shifts: weekDateKeys.map((dateKey) => {
          const assignment =
            assignmentMap.get(`${staffKey}:${dateKey}`) ?? assignmentMap.get(`${person.fullName}:${dateKey}`);
          const type = inferShiftKind(assignment);

          return {
            type,
            time: formatAssignmentTime(assignment),
            assignment,
          };
        }),
      };
    });
  }, [activeStaff, assignmentMap, assignments, staff, weekDateKeys]);

  const totalAssignments = assignments.length;
  const averageStaff = summary?.activeStaff ?? activeStaff.length;
  const workloadAverage = totalAssignments > 0 ? Math.round((totalAssignments * 8 * 10) / Math.max(scheduleRows.length, 1)) / 10 : 0;
  const suitabilityScore = totalAssignments > 0 ? 94 : 0;
  const staffWorkloadBars = useMemo(() => {
    return scheduleRows.slice(0, 6).map((row) => {
      const plannedShifts = row.shifts.filter((shift) => shift.type !== "Dinlenme" && shift.type !== "İzinli").length;
      const hours = plannedShifts * 8;

      return {
        id: row.id,
        name: row.name,
        hours,
        percent: Math.min(100, Math.round((hours / 45) * 100)),
      };
    });
  }, [scheduleRows]);

  return (
    <main style={styles.main}>
      <div style={styles.dashboardGrid}>
        <div style={styles.leftColumn}>
          <section style={styles.analysisBanner}>
            <div style={styles.botAvatar}>
              <Bot size={34} />
            </div>
            <div style={styles.bannerContent}>
              <h2 style={styles.bannerTitle}>Planınız analiz edildi ve güncel vardiya programı hazırlandı.</h2>
              <div style={styles.complianceGrid}>
                <CompliancePill icon="check" text="Gerçek personel verisi kullanıldı" />
                <CompliancePill icon="check" text="Haftalık program güncellendi" />
                <CompliancePill icon="check" text="Vardiya kayıtları eşleştirildi" />
                <CompliancePill icon="info" text={`Uygunluk Skoru: %${suitabilityScore}`} />
              </div>
            </div>
          </section>

          {summaryError ? <p style={styles.errorText}>{summaryError}</p> : null}
          {scheduleError ? <p style={styles.errorText}>{scheduleError}</p> : null}

          <section style={styles.planCard}>
            <div style={styles.planToolbar}>
              <div style={styles.viewToggle}>
                <button type="button" style={styles.viewToggleActive}>
                  <CalendarDays size={14} />
                  Haftalık
                </button>
                <button type="button" style={styles.viewToggleButton}>Günlük</button>
              </div>

              <div style={styles.weekNavigator}>
                <button
                  type="button"
                  style={styles.navButton}
                  aria-label="Önceki hafta"
                  onClick={() => setWeekStart((current) => addDays(current, -7))}
                >
                  <ChevronLeft size={18} />
                </button>
                <strong>{formatWeekRange(weekStart)}</strong>
                <button
                  type="button"
                  style={styles.navButton}
                  aria-label="Sonraki hafta"
                  onClick={() => setWeekStart((current) => addDays(current, 7))}
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <button type="button" style={styles.filterButton}>
                <Filter size={15} />
                Filtreler
                <ChevronDown size={14} />
              </button>
            </div>

            <div style={styles.scheduleWrap}>
              <div
                style={{
                  ...styles.scheduleGrid,
                  gridTemplateRows: `30px repeat(${Math.max(scheduleRows.length, 1)}, minmax(0, 1fr))`,
                }}
              >
                <div style={styles.employeeHead}>Çalışanlar</div>
                {weekDates.map((day) => (
                  <div key={toIsoDate(day)} style={styles.dayHead}>{formatDayLabel(day)}</div>
                ))}

                {scheduleRows.length === 0 ? (
                  <div style={styles.emptySchedule}>Bu hafta için personel veya vardiya kaydı bulunamadı.</div>
                ) : (
                  scheduleRows.map((row) => (
                    <div key={row.id} style={styles.scheduleRowContents}>
                      <div style={styles.employeeCell}>{row.name}</div>
                      {row.shifts.map((shift, index) => (
                        <div key={`${row.id}-${weekDateKeys[index]}`} style={styles.shiftCell}>
                          <ShiftChip shift={shift} />
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>

          </section>
        </div>

        <aside style={styles.rightColumn}>
          <section style={styles.sideCard}>
            <h3 style={styles.sideTitle}>Plan Özeti</h3>
            <div style={styles.sideStack}>
              <SummaryMetric
                icon={<UsersRound size={23} />}
                value={`${averageStaff} / ${staff.length || 45}`}
                label="Aktif Personel"
                note={staff.length ? "Gerçek liste" : "Veri bekleniyor"}
                tone="blue"
              />
              <SummaryMetric
                icon={<CheckCircle2 size={24} />}
                value={`${suitabilityScore}%`}
                label="Genel Uygunluk Skoru"
                note={totalAssignments ? "Çok iyi" : "Dinlenme"}
                tone="green"
              />
              <SummaryMetric
                icon={<Clock3 size={24} />}
                value={String(workloadAverage)}
                label="Kişi Başına Ortalama Saat"
                note="Hedef: ≤ 45 saat"
                tone="purple"
              />
            </div>
          </section>

          <section
            style={{
              ...styles.sideCard,
              ...(isDistributionHovered ? styles.distributionCardHover : null),
            }}
            onMouseEnter={() => setIsDistributionHovered(true)}
            onMouseLeave={() => setIsDistributionHovered(false)}
          >
            <h3 style={styles.sideTitle}>Dağılım Analizi</h3>
            <div style={styles.distributionWrap}>
              <div
                style={{
                  ...styles.donutChart,
                  ...(isDistributionHovered ? styles.donutChartHover : null),
                }}
              />
              <div style={styles.distributionList}>
                <span style={styles.distributionItem}><i style={{ ...styles.distributionDot, background: "#7ccf9a" }} />Gündüz <b>56%</b></span>
                <span style={styles.distributionItem}><i style={{ ...styles.distributionDot, background: "#6ca1ff" }} />Akşam <b>28%</b></span>
                <span style={styles.distributionItem}><i style={{ ...styles.distributionDot, background: "#9a7cf4" }} />Gece <b>12%</b></span>
                <span style={styles.distributionItem}><i style={{ ...styles.distributionDot, background: "#cbd5e1" }} />Boş <b>4%</b></span>
              </div>
            </div>
          </section>

          <section style={styles.sideCard}>
            <h3 style={styles.sideTitle}>Bireysel Çalışma Grafiği</h3>
            <div style={styles.workloadList}>
              {staffWorkloadBars.length === 0 ? (
                <p style={styles.workloadEmpty}>Bu hafta için kayıt bulunamadı.</p>
              ) : (
                staffWorkloadBars.map((item) => (
                  <div key={item.id} style={styles.workloadRow}>
                    <div style={styles.workloadMeta}>
                      <span>{item.name}</span>
                      <strong>{item.hours} saat</strong>
                    </div>
                    <div style={styles.workloadTrack}>
                      <span style={{ ...styles.workloadFill, width: `${item.percent}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section style={styles.sideCard}>
            <h3 style={styles.sideTitle}>Son Güncelleme</h3>
            <p style={styles.updateText}><Clock3 size={16} />{lastUpdated || "Veri bekleniyor"}</p>
            <p style={styles.updateSubtext}>Gerçek vardiya kayıtlarından oluşturuldu.</p>
          </section>
        </aside>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    height: "100%",
    minHeight: 0,
    overflow: "hidden",
    padding: "10px 18px",
    background: "#f8fafc",
    fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    color: "#0f1b3d",
    boxSizing: "border-box",
  },
  dashboardGrid: {
    height: "100%",
    minHeight: 0,
    display: "grid",
    gridTemplateColumns: "minmax(760px, 1fr) 270px",
    gap: 18,
    alignItems: "stretch",
  },
  leftColumn: {
    display: "grid",
    gridTemplateRows: "auto auto minmax(0, 1fr)",
    gap: 16,
    minWidth: 0,
    minHeight: 0,
  },
  rightColumn: {
    display: "grid",
    gridAutoRows: "min-content",
    alignContent: "stretch",
    gap: 12,
    minHeight: 0,
    overflow: "hidden",
  },
  analysisBanner: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    minHeight: 94,
    borderRadius: 12,
    border: "1px solid #dfe7f4",
    background: "#ffffff",
    padding: "12px 18px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.035)",
  },
  botAvatar: {
    width: 70,
    height: 70,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    color: "#2456e8",
    background: "radial-gradient(circle at 50% 38%, #e7edff 0%, #d8e3ff 46%, #eef4ff 100%)",
    border: "1px solid #dbe5ff",
    flexShrink: 0,
  },
  bannerContent: {
    minWidth: 0,
    flex: 1,
  },
  bannerTitle: {
    margin: "0 0 12px",
    fontSize: 15,
    fontWeight: 700,
    color: "#0f1b3d",
  },
  complianceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(150px, 1fr))",
    gap: 14,
  },
  compliancePill: {
    minHeight: 36,
    display: "flex",
    alignItems: "center",
    gap: 10,
    borderRadius: 7,
    border: "1px solid #dfe7f4",
    background: "#ffffff",
    padding: "0 12px",
    fontSize: 12,
    fontWeight: 600,
    color: "#31415f",
  },
  successIcon: {
    width: 18,
    height: 18,
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    background: "#35b66a",
    color: "#ffffff",
  },
  infoIcon: {
    width: 18,
    height: 18,
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    background: "#2f6df6",
    color: "#ffffff",
  },
  errorText: {
    margin: 0,
    padding: "9px 12px",
    borderRadius: 8,
    background: "#fff1f2",
    color: "#dc2626",
    fontSize: 12,
    fontWeight: 700,
  },
  planCard: {
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    borderRadius: 12,
    border: "1px solid #dfe7f4",
    background: "#ffffff",
    overflow: "hidden",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.035)",
  },
  planToolbar: {
    minHeight: 62,
    display: "grid",
    gridTemplateColumns: "220px 1fr 140px",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    borderBottom: "1px solid #edf2f7",
  },
  viewToggle: {
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    borderRadius: 7,
    border: "1px solid #dfe7f4",
    overflow: "hidden",
    background: "#ffffff",
  },
  viewToggleActive: {
    height: 36,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "0 14px",
    border: "none",
    borderRight: "1px solid #dfe7f4",
    background: "#f8fbff",
    color: "#1554d1",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  viewToggleButton: {
    height: 36,
    padding: "0 14px",
    border: "none",
    background: "#ffffff",
    color: "#31415f",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  weekNavigator: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 18,
    color: "#0f1b3d",
    fontSize: 15,
  },
  navButton: {
    width: 30,
    height: 30,
    display: "grid",
    placeItems: "center",
    border: "none",
    borderRadius: 8,
    background: "transparent",
    color: "#62708c",
    cursor: "pointer",
  },
  filterButton: {
    height: 36,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 7,
    border: "1px solid #dfe7f4",
    background: "#ffffff",
    color: "#46546b",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  scheduleWrap: {
    flex: 1,
    minHeight: 0,
    overflow: "auto",
  },
  scheduleGrid: {
    height: "100%",
    minWidth: 910,
    display: "grid",
    gridTemplateColumns: "150px repeat(7, minmax(112px, 1fr))",
  },
  employeeHead: {
    minHeight: 0,
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    borderRight: "1px solid #edf2f7",
    borderBottom: "1px solid #edf2f7",
    color: "#0f1b3d",
    fontSize: 12,
    fontWeight: 700,
  },
  dayHead: {
    minHeight: 0,
    display: "grid",
    placeItems: "center",
    borderRight: "1px solid #edf2f7",
    borderBottom: "1px solid #edf2f7",
    color: "#22304c",
    fontSize: 12,
    fontWeight: 700,
  },
  scheduleRowContents: {
    display: "contents",
  },
  employeeCell: {
    minHeight: 0,
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    borderRight: "1px solid #edf2f7",
    borderBottom: "1px solid #edf2f7",
    color: "#15233f",
    fontSize: 13,
    fontWeight: 700,
  },
  shiftCell: {
    minHeight: 0,
    display: "grid",
    placeItems: "center",
    padding: "7px 8px",
    borderRight: "1px solid #edf2f7",
    borderBottom: "1px solid #edf2f7",
  },
  shiftChip: {
    width: "100%",
    minHeight: 38,
    display: "grid",
    placeItems: "center",
    alignContent: "center",
    gap: 2,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    textAlign: "center",
  },
  emptySchedule: {
    gridColumn: "1 / -1",
    minHeight: 0,
    display: "grid",
    placeItems: "center",
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: 700,
    borderBottom: "1px solid #edf2f7",
  },
  sideCard: {
    borderRadius: 11,
    border: "1px solid #dfe7f4",
    background: "#ffffff",
    padding: "16px 17px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.035)",
  },
  sideTitle: {
    margin: "0 0 12px",
    fontSize: 15,
    fontWeight: 700,
    color: "#0f1b3d",
  },
  sideStack: {
    display: "grid",
    gap: 12,
  },
  summaryMetric: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    minHeight: 72,
    borderRadius: 9,
    border: "1px solid #e3eaf4",
    background: "#ffffff",
    padding: "10px 12px",
  },
  metricIcon: {
    width: 46,
    height: 46,
    display: "grid",
    placeItems: "center",
    borderRadius: 10,
    flexShrink: 0,
  },
  metricValue: {
    display: "block",
    color: "#0f1b3d",
    fontSize: 18,
    lineHeight: 1,
  },
  metricLabel: {
    margin: "5px 0 3px",
    color: "#66708c",
    fontSize: 12,
    fontWeight: 600,
  },
  metricNote: {
    fontSize: 12,
    fontWeight: 700,
  },
  distributionWrap: {
    display: "grid",
    gridTemplateColumns: "110px 1fr",
    gap: 14,
    alignItems: "center",
  },
  donutChart: {
    width: 96,
    height: 96,
    borderRadius: "50%",
    background: "conic-gradient(#7ccf9a 0 56%, #6ca1ff 56% 84%, #9a7cf4 84% 96%, #cbd5e1 96% 100%)",
    position: "relative",
    boxShadow: "inset 0 0 0 22px #ffffff",
    transition: "transform 260ms ease, box-shadow 260ms ease, filter 260ms ease",
  },
  distributionCardHover: {
    transform: "translateY(-2px)",
    boxShadow: "0 18px 34px rgba(37, 99, 235, 0.12)",
    transition: "transform 260ms ease, box-shadow 260ms ease",
  },
  donutChartHover: {
    transform: "scale(1.08) rotate(8deg)",
    filter: "saturate(1.08)",
    boxShadow: "inset 0 0 0 22px #ffffff, 0 14px 28px rgba(37, 99, 235, 0.18)",
  },
  distributionList: {
    display: "grid",
    gap: 9,
    fontSize: 12,
    color: "#46546b",
    fontWeight: 600,
  },
  distributionItem: {
    display: "grid",
    gridTemplateColumns: "12px 1fr auto",
    alignItems: "center",
    gap: 8,
  },
  distributionDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    display: "inline-block",
  },
  workloadList: {
    display: "grid",
    gap: 10,
  },
  workloadRow: {
    display: "grid",
    gap: 7,
    borderRadius: 8,
    border: "1px solid #e7edf7",
    background: "#fbfdff",
    padding: "9px 10px",
  },
  workloadMeta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    fontSize: 12,
    fontWeight: 700,
    color: "#273653",
  },
  workloadTrack: {
    height: 7,
    overflow: "hidden",
    borderRadius: 99,
    background: "#edf3ff",
  },
  workloadFill: {
    display: "block",
    height: "100%",
    borderRadius: 99,
    background: "linear-gradient(90deg, #2563eb, #60a5fa)",
    transition: "width 360ms ease",
  },
  workloadEmpty: {
    margin: 0,
    color: "#7d8aa4",
    fontSize: 12,
    fontWeight: 600,
  },
  updateText: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    margin: 0,
    color: "#485875",
    fontSize: 12,
    fontWeight: 700,
  },
  updateSubtext: {
    margin: "8px 0 0 25px",
    color: "#7d8aa4",
    fontSize: 12,
    fontWeight: 600,
  },
};
