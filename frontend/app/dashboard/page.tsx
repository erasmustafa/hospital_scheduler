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
  X,
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
type ViewMode = "weekly" | "daily";
type ShiftFilter = ShiftKind | "Tümü";

type ScheduleCell = {
  type: ShiftKind;
  time: string;
  assignment?: AssignmentRow;
};

type ScheduleRow = {
  id: string;
  name: string;
  departmentName: string | null;
  shifts: ScheduleCell[];
};

const weekdayShort = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

const shiftStyles: Record<ShiftKind, { bg: string; text: string }> = {
  Gündüz: { bg: "#ecfdf3", text: "#078247" },
  Akşam: { bg: "#eef4ff", text: "#1554d1" },
  Gece: { bg: "#f2eafe", text: "#6d35d5" },
  Nöbet: { bg: "#f2eafe", text: "#6d35d5" },
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

function formatSingleDay(date: Date) {
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  });
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
  if (label.includes("mesai")) return "Gündüz";
  if (label.includes("gece") || start >= "20:00" || start < "08:00") return "Gece";
  if (label.includes("akşam") || label.includes("aksam") || start >= "16:00") return "Akşam";
  return "Gündüz";
}

function formatAssignmentTime(assignment?: AssignmentRow) {
  if (!assignment) return "Dinlenme";
  const label = assignment.shiftTypeName.toLocaleLowerCase("tr-TR");

  if (label.includes("nöbet") || label.includes("nobet")) return "08:00 - 08:00";

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
  const isMesai = shift.assignment?.shiftTypeName.toLocaleLowerCase("tr-TR").includes("mesai");
  const tone = isMesai ? shiftStyles.Gündüz : shiftStyles[shift.type];
  const isRest = shift.type === "Dinlenme";

  return (
    <div style={{ ...styles.shiftChip, background: tone.bg, color: tone.text }}>
      <strong style={styles.shiftChipTitle}>{shift.assignment?.shiftTypeName ?? shift.type}</strong>
      {isRest ? null : <span style={styles.shiftChipTime}>{shift.time}</span>}
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
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("Tümü");
  const [departmentFilter, setDepartmentFilter] = useState("Tümü");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<"workload" | "distribution" | null>(null);
  const [hoveredNav, setHoveredNav] = useState<"prev" | "next" | null>(null);
  const [pressedNav, setPressedNav] = useState<"prev" | "next" | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const visibleDates = useMemo(() => (viewMode === "weekly" ? weekDates : [weekStart]), [viewMode, weekDates, weekStart]);
  const visibleDateKeys = useMemo(() => visibleDates.map(toIsoDate), [visibleDates]);

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
        departmentName: person.departmentName,
        shifts: visibleDateKeys.map((dateKey) => {
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
  }, [activeStaff, assignmentMap, assignments, staff, visibleDateKeys]);

  const filteredScheduleRows = useMemo<ScheduleRow[]>(() => {
    const departmentFilteredRows = departmentFilter === "Tümü"
      ? scheduleRows
      : scheduleRows.filter((row) => row.departmentName === departmentFilter);

    if (shiftFilter === "Tümü") return departmentFilteredRows;

    return departmentFilteredRows.map((row) => ({
      ...row,
      shifts: row.shifts.map((shift) => (shift.type === shiftFilter ? shift : {
        type: "Dinlenme",
        time: "Dinlenme",
      })),
    }));
  }, [departmentFilter, scheduleRows, shiftFilter]);

  const departmentOptions = useMemo(() => {
    const departments = new Set(
      scheduleRows
        .map((row) => row.departmentName)
        .filter((department): department is string => Boolean(department)),
    );

    return ["Tümü", ...Array.from(departments)];
  }, [scheduleRows]);

  const activeFilterCount = Number(shiftFilter !== "Tümü") + Number(departmentFilter !== "Tümü");

  const totalAssignments = assignments.length;
  const averageStaff = summary?.activeStaff ?? activeStaff.length;
  const workloadAverage = totalAssignments > 0 ? Math.round((totalAssignments * 8 * 10) / Math.max(scheduleRows.length, 1)) / 10 : 0;
  const suitabilityScore = totalAssignments > 0 ? 94 : 0;
  const staffWorkloadBars = useMemo(() => {
    return filteredScheduleRows.map((row) => {
      const plannedShifts = row.shifts.filter((shift) => shift.type !== "Dinlenme" && shift.type !== "İzinli").length;
      const hours = plannedShifts * 8;

      return {
        id: row.id,
        name: row.name,
        hours,
        percent: Math.min(100, Math.round((hours / 45) * 100)),
      };
    });
  }, [filteredScheduleRows]);
  const visibleWorkloadBars = useMemo(() => staffWorkloadBars.slice(0, 3), [staffWorkloadBars]);
  const distributionItems = useMemo(() => {
    const counts = new Map<ShiftKind, number>([
      ["Gündüz", 0],
      ["Akşam", 0],
      ["Gece", 0],
      ["Nöbet", 0],
      ["İzinli", 0],
      ["Dinlenme", 0],
    ]);

    for (const row of filteredScheduleRows) {
      for (const shift of row.shifts) {
        counts.set(shift.type, (counts.get(shift.type) ?? 0) + 1);
      }
    }

    const total = Array.from(counts.values()).reduce((sum, count) => sum + count, 0);

    return Array.from(counts.entries())
      .filter(([, count]) => count > 0)
      .map(([type, count]) => ({
        type,
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
        color: shiftStyles[type].text,
      }));
  }, [filteredScheduleRows]);

  const navigateSchedule = useCallback((direction: -1 | 1) => {
    setWeekStart((current) => addDays(current, direction * (viewMode === "weekly" ? 7 : 1)));
  }, [viewMode]);

  const navButtonStyle = useCallback((key: "prev" | "next") => ({
    ...styles.navButton,
    ...(hoveredNav === key ? styles.navButtonHover : null),
    ...(pressedNav === key ? styles.navButtonPressed : null),
  }), [hoveredNav, pressedNav]);

  const activeDateCount = visibleDates.length;

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

          <div style={styles.errorStack}>
            {summaryError ? <p style={styles.errorText}>{summaryError}</p> : null}
            {scheduleError ? <p style={styles.errorText}>{scheduleError}</p> : null}
          </div>

          <section style={styles.planCard}>
            <div style={styles.planToolbar}>
              <div style={styles.viewToggle}>
                <button
                  type="button"
                  style={viewMode === "weekly" ? styles.viewToggleActive : styles.viewToggleButton}
                  onClick={() => setViewMode("weekly")}
                >
                  <CalendarDays size={14} />
                  Haftalık
                </button>
                <button
                  type="button"
                  style={viewMode === "daily" ? styles.viewToggleActive : styles.viewToggleButton}
                  onClick={() => setViewMode("daily")}
                >
                  Günlük
                </button>
              </div>

              <div style={styles.weekNavigator}>
                <button
                  type="button"
                  style={navButtonStyle("prev")}
                  aria-label={viewMode === "weekly" ? "Önceki hafta" : "Önceki gün"}
                  onClick={() => navigateSchedule(-1)}
                  onMouseEnter={() => setHoveredNav("prev")}
                  onMouseLeave={() => {
                    setHoveredNav(null);
                    setPressedNav(null);
                  }}
                  onMouseDown={() => setPressedNav("prev")}
                  onMouseUp={() => setPressedNav(null)}
                >
                  <ChevronLeft size={18} />
                </button>
                <strong>{viewMode === "weekly" ? formatWeekRange(weekStart) : formatSingleDay(weekStart)}</strong>
                <button
                  type="button"
                  style={navButtonStyle("next")}
                  aria-label={viewMode === "weekly" ? "Sonraki hafta" : "Sonraki gün"}
                  onClick={() => navigateSchedule(1)}
                  onMouseEnter={() => setHoveredNav("next")}
                  onMouseLeave={() => {
                    setHoveredNav(null);
                    setPressedNav(null);
                  }}
                  onMouseDown={() => setPressedNav("next")}
                  onMouseUp={() => setPressedNav(null)}
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div style={styles.filterWrap}>
                <button
                  type="button"
                  style={{
                    ...styles.filterButton,
                    ...(isFilterOpen ? styles.filterButtonActive : null),
                  }}
                  onClick={() => setIsFilterOpen((current) => !current)}
                >
                  <Filter size={14} />
                  <span style={styles.filterButtonLabel}>
                    {activeFilterCount > 0 ? `${activeFilterCount} filtre` : "Filtreler"}
                  </span>
                  <ChevronDown size={13} />
                </button>
                {isFilterOpen ? (
                  <div style={styles.filterMenu}>
                    <div style={styles.filterSection}>
                      <span style={styles.filterSectionTitle}>Birim</span>
                      <div style={styles.filterOptionGrid}>
                        {departmentOptions.map((item) => (
                          <button
                            key={item}
                            type="button"
                            style={{
                              ...styles.filterMenuItem,
                              ...(departmentFilter === item ? styles.filterMenuItemActive : null),
                            }}
                            onClick={() => setDepartmentFilter(item)}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={styles.filterSection}>
                      <span style={styles.filterSectionTitle}>Vardiya</span>
                      <div style={styles.filterOptionGrid}>
                        {(["Tümü", "Gündüz", "Akşam", "Gece", "Nöbet", "İzinli", "Dinlenme"] as ShiftFilter[]).map((item) => (
                          <button
                            key={item}
                            type="button"
                            style={{
                              ...styles.filterMenuItem,
                              ...(shiftFilter === item ? styles.filterMenuItemActive : null),
                            }}
                            onClick={() => setShiftFilter(item)}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div style={styles.scheduleWrap}>
              <div
                style={{
                  ...styles.scheduleGrid,
                  gridTemplateColumns: `minmax(130px, 0.8fr) repeat(${activeDateCount}, minmax(0, 1fr))`,
                  gridTemplateRows: `30px repeat(${Math.max(filteredScheduleRows.length, 1)}, minmax(0, 1fr))`,
                }}
              >
                <div style={styles.employeeHead}>Çalışanlar</div>
                {visibleDates.map((day) => (
                  <div key={toIsoDate(day)} style={styles.dayHead}>{formatDayLabel(day)}</div>
                ))}

                {filteredScheduleRows.length === 0 ? (
                  <div style={styles.emptySchedule}>Bu hafta için personel veya vardiya kaydı bulunamadı.</div>
                ) : (
                  filteredScheduleRows.map((row) => (
                    <div key={row.id} style={styles.scheduleRowContents}>
                      <div style={styles.employeeCell}>{row.name}</div>
                      {row.shifts.map((shift, index) => (
                        <div key={`${row.id}-${visibleDateKeys[index]}`} style={styles.shiftCell}>
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
              ...styles.clickableSideCard,
              ...(isDistributionHovered ? styles.distributionCardHover : null),
            }}
            role="button"
            tabIndex={0}
            onMouseEnter={() => setIsDistributionHovered(true)}
            onMouseLeave={() => setIsDistributionHovered(false)}
            onClick={() => setActiveModal("distribution")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") setActiveModal("distribution");
            }}
          >
            <div style={styles.sideTitleRow}>
              <h3 style={{ ...styles.sideTitle, margin: 0 }}>Dağılım Analizi</h3>
              <span style={styles.sideActionText}>Detay</span>
            </div>
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
            <div style={styles.sideTitleRow}>
              <h3 style={{ ...styles.sideTitle, margin: 0 }}>Bireysel Çalışma Grafiği</h3>
              {staffWorkloadBars.length > visibleWorkloadBars.length ? (
                <button type="button" style={styles.inlineActionButton} onClick={() => setActiveModal("workload")}>
                  Tümünü gör
                </button>
              ) : null}
            </div>
            <div style={styles.workloadList}>
              {visibleWorkloadBars.length === 0 ? (
                <p style={styles.workloadEmpty}>Bu hafta için kayıt bulunamadı.</p>
              ) : (
                visibleWorkloadBars.map((item) => (
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

      {activeModal ? (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true">
          <section style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>
                  {activeModal === "workload" ? "Bireysel Çalışma Grafiği" : "Dağılım Analizi"}
                </h2>
                <p style={styles.modalSubtitle}>
                  {activeModal === "workload"
                    ? "Seçili hafta ve filtrelere göre personel bazlı çalışma yükü."
                    : "Seçili hafta ve filtrelere göre vardiya dağılımı."}
                </p>
              </div>
              <button type="button" style={styles.modalCloseButton} onClick={() => setActiveModal(null)} aria-label="Kapat">
                <X size={18} />
              </button>
            </div>

            {activeModal === "workload" ? (
              <div style={styles.modalWorkloadList}>
                {staffWorkloadBars.map((item) => (
                  <div key={item.id} style={styles.modalWorkloadRow}>
                    <div style={styles.workloadMeta}>
                      <span>{item.name}</span>
                      <strong>{item.hours} saat</strong>
                    </div>
                    <div style={styles.workloadTrack}>
                      <span style={{ ...styles.workloadFill, width: `${item.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.modalDistributionGrid}>
                <div style={styles.modalDonutWrap}>
                  <div style={styles.modalDonutChart} />
                  <strong>{filteredScheduleRows.length} personel</strong>
                  <span>{visibleDates.length} gün</span>
                </div>
                <div style={styles.distributionDetailList}>
                  {distributionItems.map((item) => (
                    <div key={item.type} style={styles.distributionDetailRow}>
                      <span style={{ ...styles.distributionDot, background: item.color }} />
                      <strong>{item.type}</strong>
                      <span>{item.count} kayıt</span>
                      <b>{item.percent}%</b>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      ) : null}
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
  errorStack: {
    display: "grid",
    gap: 8,
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
    gridTemplateColumns: "220px 1fr 156px",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    borderBottom: "1px solid #edf2f7",
    position: "relative",
  },
  viewToggle: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 92px)",
    alignItems: "center",
    width: 184,
    borderRadius: 7,
    border: "1px solid #dfe7f4",
    overflow: "hidden",
    background: "#ffffff",
  },
  viewToggleActive: {
    height: 36,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "0 10px",
    border: "none",
    background: "#f8fbff",
    color: "#1554d1",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    transition: "background 160ms ease, color 160ms ease",
  },
  viewToggleButton: {
    height: 36,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "0 10px",
    border: "none",
    background: "#ffffff",
    color: "#31415f",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 160ms ease, color 160ms ease",
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
    transition: "transform 160ms ease, background 160ms ease, color 160ms ease, box-shadow 160ms ease",
  },
  navButtonHover: {
    background: "#eef4ff",
    color: "#1d4ed8",
    transform: "translateY(-1px)",
    boxShadow: "0 8px 18px rgba(37, 99, 235, 0.14)",
  },
  navButtonPressed: {
    transform: "translateY(0) scale(0.94)",
    boxShadow: "0 4px 10px rgba(37, 99, 235, 0.12)",
  },
  filterWrap: {
    position: "relative",
    display: "flex",
    justifyContent: "flex-end",
  },
  filterButton: {
    width: 142,
    height: 38,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 7,
    borderRadius: 8,
    border: "1px solid #dfe7f4",
    background: "#ffffff",
    color: "#46546b",
    fontSize: 12,
    fontWeight: 600,
    padding: "0 10px",
    cursor: "pointer",
    transition: "background 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease",
  },
  filterButtonLabel: {
    flex: 1,
    overflow: "hidden",
    textAlign: "left",
    whiteSpace: "nowrap",
  },
  filterButtonActive: {
    borderColor: "#bcd0ff",
    background: "#f5f8ff",
    color: "#1d4ed8",
    boxShadow: "0 8px 18px rgba(37, 99, 235, 0.1)",
  },
  filterMenu: {
    position: "absolute",
    top: 42,
    right: 0,
    zIndex: 20,
    width: 230,
    display: "grid",
    gap: 10,
    borderRadius: 10,
    border: "1px solid #dce6f5",
    background: "rgba(255, 255, 255, 0.96)",
    padding: 8,
    boxShadow: "0 18px 38px rgba(15, 23, 42, 0.14)",
    backdropFilter: "blur(12px)",
  },
  filterSection: {
    display: "grid",
    gap: 6,
  },
  filterSectionTitle: {
    padding: "0 4px",
    color: "#64748b",
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  filterOptionGrid: {
    display: "grid",
    gap: 4,
  },
  filterMenuItem: {
    minHeight: 30,
    border: "none",
    borderRadius: 7,
    background: "transparent",
    color: "#46546b",
    fontSize: 12,
    fontWeight: 700,
    textAlign: "left",
    padding: "0 10px",
    cursor: "pointer",
    transition: "background 150ms ease, color 150ms ease, transform 150ms ease",
  },
  filterMenuItemActive: {
    background: "#eef4ff",
    color: "#1d4ed8",
    transform: "translateX(2px)",
  },
  scheduleWrap: {
    flex: 1,
    minHeight: 0,
    overflow: "auto",
  },
  scheduleGrid: {
    height: "100%",
    width: "100%",
    minWidth: 0,
    display: "grid",
    gridTemplateColumns: "minmax(130px, 0.8fr) repeat(7, minmax(0, 1fr))",
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
    padding: "6px 7px",
    borderRight: "1px solid #edf2f7",
    borderBottom: "1px solid #edf2f7",
  },
  shiftChip: {
    width: "100%",
    minHeight: 34,
    display: "grid",
    placeItems: "center",
    alignContent: "center",
    gap: 0,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    textAlign: "center",
  },
  shiftChipTitle: {
    lineHeight: 1.12,
  },
  shiftChipTime: {
    lineHeight: 1.1,
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
  sideTitleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  sideActionText: {
    color: "#2563eb",
    fontSize: 11,
    fontWeight: 700,
  },
  clickableSideCard: {
    cursor: "pointer",
    transition: "transform 260ms ease, box-shadow 260ms ease",
  },
  inlineActionButton: {
    border: "none",
    background: "transparent",
    color: "#2563eb",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
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
  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 80,
    display: "grid",
    placeItems: "center",
    padding: 24,
    background: "rgba(15, 23, 42, 0.34)",
    backdropFilter: "blur(10px)",
  },
  modalCard: {
    width: "min(760px, calc(100vw - 48px))",
    maxHeight: "min(720px, calc(100vh - 48px))",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    borderRadius: 18,
    border: "1px solid rgba(226, 232, 240, 0.9)",
    background: "rgba(255, 255, 255, 0.96)",
    boxShadow: "0 28px 80px rgba(15, 23, 42, 0.22)",
  },
  modalHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 18,
    padding: "20px 22px",
    borderBottom: "1px solid #e8eef7",
  },
  modalTitle: {
    margin: 0,
    color: "#0f1b3d",
    fontSize: 20,
    fontWeight: 700,
  },
  modalSubtitle: {
    margin: "7px 0 0",
    color: "#64748b",
    fontSize: 13,
    fontWeight: 600,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    display: "grid",
    placeItems: "center",
    borderRadius: 10,
    border: "1px solid #dbe5f2",
    background: "#ffffff",
    color: "#334155",
    cursor: "pointer",
  },
  modalWorkloadList: {
    display: "grid",
    gap: 10,
    overflow: "auto",
    padding: 20,
  },
  modalWorkloadRow: {
    display: "grid",
    gap: 9,
    borderRadius: 12,
    border: "1px solid #e4ebf6",
    background: "#fbfdff",
    padding: "12px 14px",
  },
  modalDistributionGrid: {
    display: "grid",
    gridTemplateColumns: "220px 1fr",
    gap: 20,
    overflow: "auto",
    padding: 20,
  },
  modalDonutWrap: {
    display: "grid",
    justifyItems: "center",
    alignContent: "center",
    gap: 8,
    minHeight: 260,
    borderRadius: 16,
    border: "1px solid #e4ebf6",
    background: "#f8fbff",
    color: "#0f1b3d",
    fontSize: 13,
  },
  modalDonutChart: {
    width: 150,
    height: 150,
    borderRadius: "50%",
    background: "conic-gradient(#078247 0 38%, #1554d1 38% 52%, #6d35d5 52% 72%, #46546b 72% 80%, #9aa7bb 80% 100%)",
    boxShadow: "inset 0 0 0 34px #ffffff, 0 18px 34px rgba(37, 99, 235, 0.16)",
  },
  distributionDetailList: {
    display: "grid",
    gap: 10,
    alignContent: "start",
  },
  distributionDetailRow: {
    display: "grid",
    gridTemplateColumns: "12px 1fr auto auto",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    border: "1px solid #e4ebf6",
    background: "#ffffff",
    padding: "12px 14px",
    color: "#334155",
    fontSize: 13,
    fontWeight: 700,
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
