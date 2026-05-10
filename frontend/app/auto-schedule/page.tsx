"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Info,
  Keyboard,
  MoreVertical,
  Play,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { apiClient } from "@/lib/api";

type Department = {
  id: number;
  name: string;
  code: string;
};

type PreviewAssignment = {
  staffProfileId: number;
  staffProfileName: string;
  departmentId: number;
  departmentName: string;
  shiftTypeId: number;
  shiftTypeName: string;
  shiftColor: string;
  assignmentDate: string;
  status: string;
  notes: string;
};

type Alternative = {
  attemptNo: number;
  fairnessScore: number;
  warningCount: number;
};

type PreviewMeta = {
  fairnessScore: number;
  hourSpread: number;
  totalNightSpread: number;
  weekendNightSpread: number;
  weekdayNightSpread: number;
  mesaiSpread: number;
  selectedAttemptNo: number;
  alternatives?: Alternative[];
};

type ShiftTypeRow = {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  isNight: boolean;
  color: string;
};

type RecentList = {
  id: string;
  period: string;
  department: string;
  createdAt: string;
  createdBy: string;
  status: "approved" | "draft";
};

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formatDate(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
}

function formatPeriod(startDate: string, endDate: string) {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

function getShiftDuration(row: ShiftTypeRow) {
  const [startHour] = row.startTime.split(":").map(Number);
  const [endHour] = row.endTime.split(":").map(Number);
  if (Number.isNaN(startHour) || Number.isNaN(endHour)) return 0;
  return endHour >= startHour ? endHour - startHour : 24 - startHour + endHour;
}

function getShiftKind(row: ShiftTypeRow) {
  const normalized = row.name.toLocaleLowerCase("tr-TR");
  if (normalized.includes("nöbet") || normalized.includes("nobet")) return "Nöbet";
  if (normalized.includes("gece")) return "Gece";
  return "Gündüz";
}

export default function AutoSchedulePage() {
  const today = useMemo(() => new Date(), []);
  const [startDate, setStartDate] = useState(isoDate(today));
  const [endDate, setEndDate] = useState(
    isoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6))
  );

  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentId, setDepartmentId] = useState<number | null>(null);

  const [rows, setRows] = useState<PreviewAssignment[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [meta, setMeta] = useState<PreviewMeta | null>(null);
  const [shiftTypes, setShiftTypes] = useState<ShiftTypeRow[]>([]);

  const [nightBalance, setNightBalance] = useState(true);
  const [weeklyLimit, setWeeklyLimit] = useState(true);
  const [respectAvailability, setRespectAvailability] = useState(true);
  const [weekendBalance, setWeekendBalance] = useState(true);
  const [draftOnly, setDraftOnly] = useState(false);
  const [replaceExisting] = useState(true);

  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingShiftTypes, setLoadingShiftTypes] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadDepartments = async () => {
      setLoadingDepartments(true);
      try {
        const data = await apiClient.get<Department[]>("/departments/");
        setDepartments(data);
        if (data.length > 0) setDepartmentId(data[0].id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Birimler yüklenemedi.");
      } finally {
        setLoadingDepartments(false);
      }
    };
    void loadDepartments();
  }, []);

  useEffect(() => {
    const loadShiftTypes = async () => {
      setLoadingShiftTypes(true);
      try {
        const data = await apiClient.get<{ shiftTypes: ShiftTypeRow[] }>("/shift-types/");
        setShiftTypes(data.shiftTypes);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Vardiya tipleri yüklenemedi.");
      } finally {
        setLoadingShiftTypes(false);
      }
    };
    void loadShiftTypes();
  }, []);

  const selectedDepartment = departments.find((department) => department.id === departmentId);

  const shiftTypeCounts = useMemo(
    () => ({
      total: shiftTypes.length,
      day: shiftTypes.filter((row) => !row.isNight).length,
      night: shiftTypes.filter((row) => row.name.toLocaleLowerCase("tr-TR").includes("gece")).length,
      duty: shiftTypes.filter((row) => getShiftKind(row) === "Nöbet" || row.isNight).length,
    }),
    [shiftTypes]
  );

  const recentLists = useMemo<RecentList[]>(() => {
    const current: RecentList[] =
      rows.length > 0
        ? [
            {
              id: "current-draft",
              period: formatPeriod(startDate, endDate),
              department: selectedDepartment?.name ?? "Seçili birim",
              createdAt: "Şimdi",
              createdBy: "Admin",
              status: "draft",
            },
          ]
        : [];

    return [
      ...current,
      {
        id: "approved-sample",
        period: "01.05.2026 - 31.05.2026",
        department: selectedDepartment?.name ?? "Ameliyathane",
        createdAt: "02.05.2026 14:20",
        createdBy: "Admin",
        status: "approved",
      },
      {
        id: "draft-sample",
        period: "01.04.2026 - 30.04.2026",
        department: selectedDepartment?.name ?? "Ameliyathane",
        createdAt: "28.04.2026 10:15",
        createdBy: "Admin",
        status: "draft",
      },
    ];
  }, [endDate, rows.length, selectedDepartment?.name, startDate]);

  const handleGenerate = async () => {
    if (!departmentId) {
      setError("Lütfen bir birim seçin.");
      return;
    }
    setGenerating(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await apiClient.post<{
        previewAssignments: PreviewAssignment[];
        warnings: string[];
        meta: PreviewMeta;
      }>("/auto-schedule/preview/", {
        departmentId,
        startDate,
        endDate,
        options: {
          attemptCount: 24,
          keepTopN: 5,
          respectWeeklyLimit: weeklyLimit,
          respectAvailability,
        },
      });
      setRows(data.previewAssignments);
      setWarnings(data.warnings);
      setMeta(data.meta);
      setSuccess("Taslak liste oluşturuldu.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Taslak oluşturulamadı.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCommit = async () => {
    if (!departmentId) {
      setError("Lütfen bir birim seçin.");
      return;
    }
    setCommitting(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await apiClient.post<{
        createdCount: number;
        warnings: string[];
        meta: PreviewMeta;
        previewAssignments: PreviewAssignment[];
      }>("/auto-schedule/commit/", {
        departmentId,
        startDate,
        endDate,
        replaceExisting,
        options: {
          attemptCount: 24,
          keepTopN: 5,
          respectWeeklyLimit: weeklyLimit,
          respectAvailability,
        },
      });
      setRows(data.previewAssignments);
      setWarnings(data.warnings);
      setMeta(data.meta);
      setSuccess(`${data.createdCount} vardiya kaydedildi.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydetme başarısız.");
    } finally {
      setCommitting(false);
    }
  };

  return (
    <main style={styles.main}>
      <header style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Otomatik Liste Oluştur</h1>
          <p style={styles.pageSubtitle}>Seçilen birim için otomatik vardiya listesi oluşturun.</p>
        </div>

        <div style={styles.headerActions}>
          <div style={styles.searchBox}>
            <Search size={16} color="#71809b" />
            <span style={styles.searchPlaceholder}>Ara...</span>
            <span style={styles.searchShortcut}>
              <Keyboard size={12} />
              K
            </span>
          </div>
          <button type="button" style={styles.iconButton} aria-label="Bildirimler">
            <Bell size={17} />
            <span style={styles.notificationBadge}>3</span>
          </button>
          <div style={styles.userAvatar}>A</div>
          <div>
            <p style={styles.userName}>Admin</p>
            <p style={styles.userRole}>Süper Yönetici</p>
          </div>
          <ChevronDown size={16} color="#64748b" />
        </div>
      </header>

      {(error || success || warnings.length > 0) && (
        <div style={styles.messageStack}>
          {error && <p style={styles.errorMessage}>{error}</p>}
          {success && <p style={styles.successMessage}>{success}</p>}
          {warnings.slice(0, 2).map((warning, index) => (
            <p key={`${warning}-${index}`} style={styles.warningMessage}>
              {warning}
            </p>
          ))}
        </div>
      )}

      <div style={styles.contentGrid}>
        <div style={styles.leftColumn}>
          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>Liste Oluştur</h2>

            <label style={styles.fieldLabel}>
              <span>Birim</span>
              <span style={styles.selectShell}>
                <select
                  style={styles.selectInput}
                  value={departmentId ?? ""}
                  onChange={(event) => setDepartmentId(Number(event.target.value))}
                  disabled={loadingDepartments || departments.length === 0}
                >
                  <option value="">Birim seçin</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={17} color="#71809b" />
              </span>
            </label>

            <div style={styles.dateGrid}>
              <label style={styles.fieldLabel}>
                <span>Başlangıç Tarihi</span>
                <span style={styles.dateShell}>
                  <input
                    type="date"
                    style={styles.dateInput}
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                  <CalendarDays size={16} color="#334155" />
                </span>
              </label>

              <label style={styles.fieldLabel}>
                <span>Bitiş Tarihi</span>
                <span style={styles.dateShell}>
                  <input
                    type="date"
                    style={styles.dateInput}
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                  <CalendarDays size={16} color="#334155" />
                </span>
              </label>
            </div>

            <div style={styles.rulesPanel}>
              <div style={styles.rulesHeader}>
                <h3 style={styles.rulesTitle}>Planlama Kuralları</h3>
                <span style={styles.rulesLink}>
                  Akıllı dağıtım seçenekleri
                  <SlidersHorizontal size={13} />
                </span>
              </div>

              <div style={styles.rulesList}>
                <RuleToggle label="Gece nöbetlerini dengeli dağıt" checked={nightBalance} onChange={setNightBalance} />
                <RuleToggle label="İzin/uygunluk kayıtlarını dikkate al" checked={respectAvailability} onChange={setRespectAvailability} />
                <RuleToggle label="Haftalık saat sınırını uygula" checked={weeklyLimit} onChange={setWeeklyLimit} />
                <RuleToggle label="Hafta sonu görevlerini dengeli dağıt" checked={weekendBalance} onChange={setWeekendBalance} />
                <RuleToggle label="Sadece taslak oluştur (onay gerektirmez)" checked={draftOnly} onChange={setDraftOnly} />
              </div>
            </div>

            <div style={styles.infoBox}>
              <span style={styles.infoIcon}>
                <Info size={14} />
              </span>
              <div>
                <strong style={styles.infoTitle}>Bilgilendirme</strong>
                <p style={styles.infoText}>
                  Otomatik oluşturulan liste taslak olarak oluşturulur. Onay sürecinden geçtikten sonra kesinleşir.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={generating || loadingDepartments}
              style={{
                ...styles.primaryButton,
                opacity: generating || loadingDepartments ? 0.7 : 1,
              }}
            >
              <Play size={15} fill="none" />
              {generating ? "Liste oluşturuluyor..." : "Otomatik Liste Oluştur"}
            </button>
          </section>

          <section style={styles.panel}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.panelTitle}>Son Oluşturulan Listeler</h2>
              <button type="button" style={styles.linkButton}>Tümünü Gör</button>
            </div>

            <div style={styles.recentTable}>
              <div style={styles.recentHead}>
                <span>Dönem</span>
                <span>Birim</span>
                <span>Oluşturulma</span>
                <span>Oluşturan</span>
                <span>Durum</span>
                <span />
              </div>

              {recentLists.map((list) => (
                <div key={list.id} style={styles.recentRow}>
                  <span>{list.period}</span>
                  <span>{list.department}</span>
                  <span>{list.createdAt}</span>
                  <span>{list.createdBy}</span>
                  <span>
                    <span
                      style={{
                        ...styles.statusBadge,
                        background: list.status === "approved" ? "#dcfce7" : "#e0e7ff",
                        color: list.status === "approved" ? "#15803d" : "#3157d8",
                      }}
                    >
                      {list.status === "approved" ? "Onaylandı" : "Taslak"}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={list.id === "current-draft" ? () => void handleCommit() : undefined}
                    disabled={list.id === "current-draft" && committing}
                    style={styles.moreButton}
                    aria-label={list.id === "current-draft" ? "Taslağı kaydet" : "Liste işlemleri"}
                    title={list.id === "current-draft" ? "Taslağı kaydet" : "Liste işlemleri"}
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
              ))}
            </div>

            {meta && (
              <div style={styles.metaStrip}>
                <span>Fairness: {meta.fairnessScore}</span>
                <span>Saat farkı: {meta.hourSpread}</span>
                <span>Nöbet farkı: {meta.totalNightSpread}</span>
                <span>{rows.length} taslak kayıt</span>
              </div>
            )}
          </section>
        </div>

        <section style={styles.shiftPanel}>
          <div style={styles.shiftPanelHeader}>
            <div>
              <h2 style={styles.panelTitle}>Vardiya Tipleri</h2>
              <p style={styles.panelDescription}>Bu birim için tanımlı vardiya tipleri ve saat aralıkları.</p>
            </div>
            <div style={styles.shiftHeaderActions}>
              <button type="button" style={styles.secondaryButton}>
                <Plus size={17} />
                Yeni Vardiya Tipi
              </button>
              <button type="button" style={styles.squareButton} aria-label="Yenile">
                <RefreshCw size={17} />
              </button>
            </div>
          </div>

          <div style={styles.statsGrid}>
            <StatCard value={shiftTypeCounts.total} label="Toplam" />
            <StatCard value={shiftTypeCounts.day} label="Gündüz" />
            <StatCard value={shiftTypeCounts.night} label="Gece" />
            <StatCard value={shiftTypeCounts.duty} label="Nöbet" />
          </div>

          <div style={styles.shiftList}>
            {loadingShiftTypes ? (
              <p style={styles.emptyText}>Vardiya tipleri yükleniyor...</p>
            ) : shiftTypes.length === 0 ? (
              <p style={styles.emptyText}>Kayıtlı vardiya tipi bulunamadı.</p>
            ) : (
              shiftTypes.map((shiftType) => (
                <div key={shiftType.id} style={styles.shiftRow}>
                  <span style={{ ...styles.shiftAccent, background: shiftType.color }} />
                  <div style={styles.shiftNameBlock}>
                    <strong style={styles.shiftName}>{shiftType.name}</strong>
                    <span style={styles.shiftTime}>{shiftType.startTime} - {shiftType.endTime}</span>
                  </div>
                  <span
                    style={{
                      ...styles.kindBadge,
                      background:
                        getShiftKind(shiftType) === "Nöbet"
                          ? "#fff0c7"
                          : getShiftKind(shiftType) === "Gece"
                            ? "#ede9fe"
                            : "#dbeafe",
                      color:
                        getShiftKind(shiftType) === "Nöbet"
                          ? "#c47d00"
                          : getShiftKind(shiftType) === "Gece"
                            ? "#6d28d9"
                            : "#2563eb",
                    }}
                  >
                    {getShiftKind(shiftType)}
                  </span>
                  <div style={styles.durationBlock}>
                    <span>Süre</span>
                    <strong>{getShiftDuration(shiftType)} saat</strong>
                  </div>
                  <button type="button" style={styles.plainIconButton} aria-label="Vardiya işlemleri">
                    <MoreVertical size={18} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div style={styles.shiftInfoBox}>
            <Info size={17} />
            <span>
              Vardiya tiplerinde değişiklik yapmanız halinde, taslak listeleri yeniden oluşturmanız önerilir.
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}

function RuleToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label style={styles.ruleRow}>
      <span style={styles.ruleText}>
        {label}
        <Info size={12} color="#7b8ba8" />
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        style={styles.hiddenCheckbox}
      />
      <span
        style={{
          ...styles.checkboxVisual,
          background: checked ? "#3f63f4" : "#ffffff",
          borderColor: checked ? "#3f63f4" : "#b7c1d4",
        }}
      >
        {checked ? "✓" : ""}
      </span>
    </label>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div style={styles.statCard}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100%",
    padding: "28px 30px",
    boxSizing: "border-box",
    overflow: "auto",
    background:
      "radial-gradient(circle at 12% 8%, rgba(76, 111, 255, 0.06), transparent 28%), linear-gradient(180deg, #f8fbff 0%, #f3f7fd 100%)",
    color: "#0f1f46",
    fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  pageHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 24,
    marginBottom: 28,
  },
  pageTitle: {
    margin: 0,
    fontSize: 22,
    lineHeight: 1.15,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    color: "#101a3c",
  },
  pageSubtitle: {
    margin: "8px 0 0",
    fontSize: 14,
    fontWeight: 500,
    color: "#657491",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  searchBox: {
    width: 256,
    height: 44,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 13px",
    borderRadius: 10,
    border: "1px solid #cfdaee",
    background: "rgba(255,255,255,0.82)",
    boxShadow: "0 8px 24px rgba(30,64,175,0.04)",
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 13,
    fontWeight: 600,
    color: "#71809b",
  },
  searchShortcut: {
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    padding: "3px 6px",
    borderRadius: 6,
    background: "#f0f4fb",
    fontSize: 11,
    fontWeight: 700,
    color: "#71809b",
  },
  iconButton: {
    position: "relative",
    width: 40,
    height: 40,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #dbe3f2",
    borderRadius: 12,
    background: "#ffffff",
    color: "#40516f",
    cursor: "pointer",
  },
  notificationBadge: {
    position: "absolute",
    top: -5,
    right: -3,
    minWidth: 16,
    height: 16,
    padding: "0 4px",
    borderRadius: 999,
    background: "#2456e8",
    color: "#ffffff",
    fontSize: 10,
    fontWeight: 800,
    lineHeight: "16px",
    textAlign: "center",
  },
  userAvatar: {
    width: 42,
    height: 42,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "#e9eefb",
    color: "#0f1f46",
    fontSize: 17,
    fontWeight: 800,
  },
  userName: {
    margin: 0,
    fontSize: 13,
    fontWeight: 800,
    color: "#101a3c",
  },
  userRole: {
    margin: "3px 0 0",
    fontSize: 11,
    fontWeight: 600,
    color: "#71809b",
  },
  messageStack: {
    display: "grid",
    gap: 8,
    marginBottom: 16,
  },
  errorMessage: {
    margin: 0,
    padding: "10px 14px",
    borderRadius: 10,
    background: "#fff1f2",
    color: "#dc2626",
    fontSize: 13,
    fontWeight: 700,
  },
  successMessage: {
    margin: 0,
    padding: "10px 14px",
    borderRadius: 10,
    background: "#ecfdf5",
    color: "#047857",
    fontSize: 13,
    fontWeight: 700,
  },
  warningMessage: {
    margin: 0,
    padding: "10px 14px",
    borderRadius: 10,
    background: "#fffbeb",
    color: "#92400e",
    fontSize: 13,
    fontWeight: 700,
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(460px, 0.96fr) minmax(520px, 1fr)",
    gap: 18,
    alignItems: "start",
  },
  leftColumn: {
    display: "grid",
    gap: 18,
  },
  panel: {
    borderRadius: 12,
    border: "1px solid #dfe7f4",
    background: "rgba(255,255,255,0.94)",
    boxShadow: "0 18px 38px rgba(30,64,175,0.06)",
    padding: "25px 28px",
  },
  panelTitle: {
    margin: 0,
    fontSize: 17,
    lineHeight: 1.2,
    fontWeight: 800,
    color: "#111d44",
  },
  panelDescription: {
    margin: "11px 0 0",
    fontSize: 13,
    fontWeight: 500,
    color: "#657491",
  },
  fieldLabel: {
    display: "grid",
    gap: 9,
    marginTop: 22,
    fontSize: 12,
    fontWeight: 800,
    color: "#101a3c",
  },
  selectShell: {
    height: 42,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 12px",
    border: "1px solid #d5dfef",
    borderRadius: 8,
    background: "#ffffff",
  },
  selectInput: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    border: "none",
    outline: "none",
    appearance: "none",
    background: "transparent",
    font: "inherit",
    fontSize: 13,
    fontWeight: 600,
    color: "#16254b",
  },
  dateGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
  },
  dateShell: {
    height: 42,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 12px",
    border: "1px solid #d5dfef",
    borderRadius: 8,
    background: "#ffffff",
  },
  dateInput: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: 13,
    fontWeight: 600,
    color: "#16254b",
    fontFamily: "inherit",
  },
  rulesPanel: {
    marginTop: 22,
    border: "1px solid #dfe7f4",
    borderRadius: 10,
    background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
    padding: "15px 16px 8px",
  },
  rulesHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingBottom: 10,
  },
  rulesTitle: {
    margin: 0,
    fontSize: 13,
    fontWeight: 800,
    color: "#101a3c",
  },
  rulesLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 700,
    color: "#2456e8",
  },
  rulesList: {
    display: "grid",
  },
  ruleRow: {
    minHeight: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderTop: "1px solid #e9eef7",
    cursor: "pointer",
  },
  ruleText: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    color: "#1a2a51",
  },
  hiddenCheckbox: {
    position: "absolute",
    opacity: 0,
    pointerEvents: "none",
  },
  checkboxVisual: {
    width: 16,
    height: 16,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #b7c1d4",
    borderRadius: 3,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: 900,
    lineHeight: 1,
  },
  infoBox: {
    display: "flex",
    gap: 12,
    marginTop: 22,
    padding: "15px 16px",
    borderRadius: 10,
    border: "1px solid #bed1ff",
    background: "linear-gradient(90deg, #eaf2ff 0%, #f3f7ff 100%)",
  },
  infoIcon: {
    width: 18,
    height: 18,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "#315fe8",
    color: "#ffffff",
    flexShrink: 0,
  },
  infoTitle: {
    display: "block",
    fontSize: 12,
    fontWeight: 800,
    color: "#2456e8",
    marginBottom: 5,
  },
  infoText: {
    margin: 0,
    fontSize: 11,
    lineHeight: 1.55,
    fontWeight: 600,
    color: "#1c2b50",
  },
  primaryButton: {
    marginTop: 18,
    height: 42,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "0 20px",
    border: "none",
    borderRadius: 8,
    background: "linear-gradient(135deg, #365eff 0%, #234bdc 100%)",
    color: "#ffffff",
    fontSize: 13,
    fontWeight: 800,
    boxShadow: "0 12px 22px rgba(35,75,220,0.22)",
    cursor: "pointer",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 24,
  },
  linkButton: {
    border: "none",
    background: "transparent",
    color: "#2456e8",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },
  recentTable: {
    display: "grid",
    gap: 0,
  },
  recentHead: {
    display: "grid",
    gridTemplateColumns: "1.25fr 0.9fr 1.02fr 0.72fr 0.62fr 34px",
    gap: 14,
    padding: "0 0 12px",
    borderBottom: "1px solid #e4ebf6",
    color: "#63718d",
    fontSize: 11,
    fontWeight: 800,
  },
  recentRow: {
    display: "grid",
    gridTemplateColumns: "1.25fr 0.9fr 1.02fr 0.72fr 0.62fr 34px",
    alignItems: "center",
    gap: 14,
    minHeight: 56,
    borderBottom: "1px solid #edf2f8",
    color: "#1f3158",
    fontSize: 12,
    fontWeight: 600,
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 58,
    height: 22,
    padding: "0 8px",
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 800,
  },
  moreButton: {
    width: 30,
    height: 30,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #d9e3f3",
    borderRadius: 8,
    background: "#ffffff",
    color: "#315a96",
    cursor: "pointer",
  },
  metaStrip: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTop: "1px solid #edf2f8",
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
  },
  shiftPanel: {
    minHeight: 680,
    borderRadius: 12,
    border: "1px solid #dfe7f4",
    background: "rgba(255,255,255,0.94)",
    boxShadow: "0 18px 38px rgba(30,64,175,0.06)",
    padding: "26px 26px",
  },
  shiftPanelHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 18,
    marginBottom: 28,
  },
  shiftHeaderActions: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  secondaryButton: {
    height: 42,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "0 17px",
    borderRadius: 8,
    border: "1px solid #9db4ff",
    background: "#ffffff",
    color: "#2456e8",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },
  squareButton: {
    width: 42,
    height: 42,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    border: "1px solid #d9e3f3",
    background: "#ffffff",
    color: "#2456e8",
    cursor: "pointer",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 14,
    marginBottom: 20,
  },
  statCard: {
    height: 72,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 8,
    border: "1px solid #dfe7f4",
    background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
    color: "#2655e8",
    boxShadow: "0 10px 22px rgba(30,64,175,0.04)",
  },
  shiftList: {
    display: "grid",
    gap: 14,
  },
  emptyText: {
    margin: 0,
    padding: "24px",
    borderRadius: 10,
    background: "#f8fbff",
    color: "#64748b",
    fontSize: 13,
    fontWeight: 700,
  },
  shiftRow: {
    position: "relative",
    minHeight: 78,
    display: "grid",
    gridTemplateColumns: "8px 1fr auto 92px 28px",
    alignItems: "center",
    gap: 18,
    border: "1px solid #dfe7f4",
    borderRadius: 9,
    background: "#ffffff",
    padding: "10px 16px 10px 0",
    boxShadow: "0 9px 20px rgba(30,64,175,0.035)",
  },
  shiftAccent: {
    width: 5,
    height: "100%",
    minHeight: 58,
    borderRadius: "0 999px 999px 0",
  },
  shiftNameBlock: {
    display: "grid",
    gap: 9,
  },
  shiftName: {
    fontSize: 14,
    fontWeight: 800,
    color: "#101a3c",
  },
  shiftTime: {
    fontSize: 13,
    fontWeight: 600,
    color: "#39537a",
  },
  kindBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 54,
    height: 22,
    padding: "0 9px",
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 800,
  },
  durationBlock: {
    display: "grid",
    gap: 7,
    color: "#10204a",
    fontSize: 12,
    fontWeight: 600,
  },
  plainIconButton: {
    width: 26,
    height: 26,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    background: "transparent",
    color: "#55709b",
    cursor: "pointer",
  },
  shiftInfoBox: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginTop: 20,
    padding: "18px 20px",
    borderRadius: 9,
    border: "1px solid #bdd0ff",
    background: "linear-gradient(90deg, #edf4ff 0%, #f5f9ff 100%)",
    color: "#3d5280",
    fontSize: 13,
    fontWeight: 600,
  },
};
