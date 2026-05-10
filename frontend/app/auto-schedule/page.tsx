"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Copy,
  Info,
  Keyboard,
  MoreVertical,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Tag,
  Trash2,
  X,
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

type DropdownOption = {
  value: string;
  label: string;
  description?: string;
};

type ModalDropdownProps = {
  value: string;
  placeholder: string;
  options: DropdownOption[];
  icon: ReactNode;
  onChange: (value: string) => void;
};

const timeOptions: DropdownOption[] = ["00:00", "06:00", "08:00", "12:00", "16:00", "20:00", "22:00"].map(
  (time) => ({ value: time, label: time })
);

const categoryOptions: DropdownOption[] = [
  { value: "Gündüz", label: "Gündüz", description: "Standart gündüz vardiyası" },
  { value: "Gece", label: "Gece", description: "Gece çalışması" },
  { value: "Nöbet", label: "Nöbet", description: "Uzun nöbet vardiyası" },
  { value: "İdari", label: "İdari", description: "İdari çalışma düzeni" },
];

const shiftTypeColorOptions = ["#2f6df6", "#2bc782", "#8a3ffc", "#fb923c", "#f43f5e", "#55c8d8", "#8491b3"];

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

function getTimeDuration(startTime: string, endTime: string) {
  return getShiftDuration({
    id: 0,
    name: "",
    startTime,
    endTime,
    isNight: false,
    color: "#2f6df6",
  });
}

function getShiftKind(row: ShiftTypeRow) {
  const normalized = row.name.toLocaleLowerCase("tr-TR");
  if (normalized.includes("nöbet") || normalized.includes("nobet")) return "Nöbet";
  if (normalized.includes("gece")) return "Gece";
  return "Gündüz";
}

function ModalDropdown({ value, placeholder, options, icon, onChange }: ModalDropdownProps) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  return (
    <div
      style={styles.modalDropdown}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        className="auto-modal-control auto-modal-dropdown-trigger"
        style={styles.modalDropdownButton}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span style={styles.modalDropdownIcon}>{icon}</span>
        <span
          style={{
            ...styles.modalDropdownValue,
            color: selectedOption ? "#10204a" : "#61708f",
          }}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span
          style={{
            ...styles.modalDropdownChevron,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <ChevronDown size={17} />
        </span>
      </button>

      {open ? (
        <div style={styles.modalDropdownMenu} role="listbox">
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                className="auto-modal-dropdown-option"
                style={{
                  ...styles.modalDropdownItem,
                  ...(selected ? styles.modalDropdownItemActive : {}),
                }}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                role="option"
                aria-selected={selected}
              >
                <span>
                  <strong style={styles.modalDropdownItemTitle}>{option.label}</strong>
                  {option.description ? <small style={styles.modalDropdownItemDesc}>{option.description}</small> : null}
                </span>
                {selected ? <Check size={16} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function TooltipBadge({ text }: { text: string }) {
  return (
    <span className="auto-tooltip-wrap" style={styles.tooltipWrap}>
      <span style={styles.tooltipBadge} aria-label={text} tabIndex={0}>
        i
      </span>
      <span className="auto-tooltip-content" style={styles.tooltipContent}>{text}</span>
    </span>
  );
}

export default function AutoSchedulePage() {
  const today = useMemo(() => new Date(), []);
  const departmentSelectRef = useRef<HTMLSelectElement | null>(null);
  const startDateInputRef = useRef<HTMLInputElement | null>(null);
  const endDateInputRef = useRef<HTMLInputElement | null>(null);
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
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [editingShiftTypeId, setEditingShiftTypeId] = useState<number | null>(null);
  const [openShiftMenuId, setOpenShiftMenuId] = useState<number | null>(null);
  const [newShiftName, setNewShiftName] = useState("");
  const [newShiftColor, setNewShiftColor] = useState(shiftTypeColorOptions[0]);
  const [newShiftStartTime, setNewShiftStartTime] = useState("08:00");
  const [newShiftEndTime, setNewShiftEndTime] = useState("16:00");
  const [newShiftCategory, setNewShiftCategory] = useState("Gündüz");

  const openShiftTypeModal = () => {
    setEditingShiftTypeId(null);
    setOpenShiftMenuId(null);
    setNewShiftName("");
    setNewShiftColor(shiftTypeColorOptions[0]);
    setNewShiftStartTime("08:00");
    setNewShiftEndTime("16:00");
    setNewShiftCategory("Gündüz");
    setIsShiftModalOpen(true);
  };

  const closeShiftTypeModal = () => {
    setIsShiftModalOpen(false);
    setEditingShiftTypeId(null);
  };

  const saveShiftType = () => {
    const name = newShiftName.trim() || newShiftCategory;
    const shiftTypePayload = {
      name,
      startTime: newShiftStartTime,
      endTime: newShiftEndTime,
      isNight: newShiftCategory === "Gece" || newShiftCategory === "Nöbet",
      color: newShiftColor,
    };

    setShiftTypes((previous) => {
      if (editingShiftTypeId) {
        return previous.map((shiftType) =>
          shiftType.id === editingShiftTypeId ? { ...shiftType, ...shiftTypePayload } : shiftType
        );
      }

      return [
        ...previous,
        {
          id: Date.now(),
          ...shiftTypePayload,
        },
      ];
    });
    setSuccess(editingShiftTypeId ? "Vardiya tipi güncellendi." : "Vardiya tipi bilgileri kaydedildi.");
    closeShiftTypeModal();
  };

  const editShiftType = (shiftType: ShiftTypeRow) => {
    setEditingShiftTypeId(shiftType.id);
    setOpenShiftMenuId(null);
    setNewShiftName(shiftType.name);
    setNewShiftColor(shiftType.color);
    setNewShiftStartTime(shiftType.startTime);
    setNewShiftEndTime(shiftType.endTime);
    setNewShiftCategory(getShiftKind(shiftType));
    setIsShiftModalOpen(true);
  };

  const duplicateShiftType = (shiftType: ShiftTypeRow) => {
    setShiftTypes((previous) => [
      ...previous,
      {
        ...shiftType,
        id: Date.now(),
        name: `${shiftType.name} Kopya`,
      },
    ]);
    setOpenShiftMenuId(null);
    setSuccess("Vardiya tipi kopyalandı.");
  };

  const removeShiftType = (shiftTypeId: number) => {
    setShiftTypes((previous) => previous.filter((shiftType) => shiftType.id !== shiftTypeId));
    setOpenShiftMenuId(null);
    setSuccess("Vardiya tipi kaldırıldı.");
  };

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

  const loadShiftTypes = useCallback(async () => {
    setLoadingShiftTypes(true);
    try {
      const data = await apiClient.get<{ shiftTypes: ShiftTypeRow[] }>("/shift-types/");
      setShiftTypes(data.shiftTypes);
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Vardiya tipleri yüklenemedi.");
      return false;
    } finally {
      setLoadingShiftTypes(false);
    }
  }, []);

  useEffect(() => {
    void loadShiftTypes();
  }, [loadShiftTypes]);

  useEffect(() => {
    if (!openShiftMenuId) return;

    const closeOpenShiftMenu = () => {
      setOpenShiftMenuId(null);
    };

    window.addEventListener("click", closeOpenShiftMenu);
    return () => window.removeEventListener("click", closeOpenShiftMenu);
  }, [openShiftMenuId]);

  const refreshShiftTypes = useCallback(async () => {
    setOpenShiftMenuId(null);
    const refreshed = await loadShiftTypes();
    if (refreshed) {
      setSuccess("Vardiya tipleri yenilendi.");
    }
  }, [loadShiftTypes]);

  const openNativePicker = (
    element: (HTMLSelectElement | HTMLInputElement) & { showPicker?: () => void }
  ) => {
    element.focus();
    if (typeof element.showPicker === "function") {
      element.showPicker();
    } else {
      element.click();
    }
  };

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
    <>
    <style
      dangerouslySetInnerHTML={{
        __html: `
          @keyframes autoDropdownIn {
            from {
              opacity: 0;
              transform: translateY(-6px) scale(0.98);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes autoMenuIn {
            from {
              opacity: 0;
              transform: translateY(-6px) scale(0.96);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes autoSpin {
            to {
              transform: rotate(360deg);
            }
          }

          .auto-modal-control {
            transform: translateY(0) scale(1);
            transition:
              transform 160ms ease,
              filter 160ms ease,
              box-shadow 160ms ease,
              border-color 160ms ease,
              background 160ms ease;
          }

          .auto-modal-control:hover:not(:disabled) {
            transform: translateY(-1px);
            filter: brightness(1.02);
            box-shadow: 0 14px 28px rgba(37, 86, 232, 0.16) !important;
          }

          .auto-modal-control:active:not(:disabled) {
            transform: translateY(0) scale(0.985);
          }

          .auto-panel-action {
            transform: translateY(0) scale(1);
            transition:
              transform 160ms ease,
              box-shadow 160ms ease,
              border-color 160ms ease,
              background 160ms ease,
              filter 160ms ease;
          }

          .auto-panel-action:hover:not(:disabled) {
            transform: translateY(-1px);
            filter: brightness(1.02);
            border-color: #8ea8ff !important;
            box-shadow: 0 14px 30px rgba(37, 86, 232, 0.16) !important;
          }

          .auto-panel-action:active:not(:disabled) {
            transform: translateY(0) scale(0.975);
          }

          .auto-panel-action:disabled {
            cursor: not-allowed !important;
            opacity: 0.68;
          }

          .auto-list-control {
            transition:
              transform 160ms ease,
              box-shadow 160ms ease,
              border-color 160ms ease,
              background 160ms ease;
          }

          .auto-list-control:hover:not(:has(:disabled)) {
            transform: translateY(-1px);
            border-color: #9db5ff !important;
            background: #fbfdff !important;
            box-shadow: 0 12px 24px rgba(37, 86, 232, 0.12);
          }

          .auto-list-control:active:not(:has(:disabled)) {
            transform: translateY(0) scale(0.992);
          }

          .auto-list-icon-button {
            transition:
              transform 150ms ease,
              background 150ms ease,
              color 150ms ease;
          }

          .auto-list-icon-button:hover:not(:disabled) {
            transform: translateY(-1px);
            background: #eef4ff !important;
            color: #2456e8 !important;
          }

          .auto-list-icon-button:active:not(:disabled) {
            transform: scale(0.92);
          }

          .auto-spin-icon {
            animation: autoSpin 780ms linear infinite;
          }

          .auto-shift-more {
            transition:
              transform 150ms ease,
              background 150ms ease,
              color 150ms ease,
              box-shadow 150ms ease;
          }

          .auto-shift-more:hover {
            transform: translateY(-1px);
            background: #eef4ff !important;
            color: #2456e8 !important;
            box-shadow: 0 10px 18px rgba(37, 86, 232, 0.14);
          }

          .auto-shift-more:active {
            transform: translateY(0) scale(0.94);
          }

          .auto-shift-action {
            transition:
              transform 150ms ease,
              background 150ms ease,
              color 150ms ease;
          }

          .auto-shift-action:hover {
            transform: translateX(2px);
            background: #f1f6ff !important;
            color: #2456e8 !important;
          }

          .auto-shift-action-danger:hover {
            background: #fff1f2 !important;
            color: #dc2626 !important;
          }

          .auto-modal-dropdown-trigger:hover {
            border-color: #9db5ff !important;
            background: #fbfdff !important;
          }

          .auto-modal-dropdown-trigger:hover span:last-child {
            background: #e9efff !important;
          }

          .auto-modal-dropdown-option:hover {
            background: linear-gradient(135deg, #f1f6ff 0%, #ffffff 100%) !important;
            color: #2456e8 !important;
            transform: translateX(2px);
          }

          .auto-modal-dropdown-option:active {
            transform: translateX(1px) scale(0.99);
          }

          .auto-color-dot {
            transition:
              transform 160ms ease,
              box-shadow 160ms ease,
              filter 160ms ease;
          }

          .auto-color-dot:hover {
            transform: translateY(-2px) scale(1.08);
            filter: saturate(1.08);
          }

          .auto-color-dot:active {
            transform: scale(0.96);
          }

          .auto-tooltip-wrap:hover .auto-tooltip-content,
          .auto-tooltip-wrap:focus-within .auto-tooltip-content {
            opacity: 1 !important;
            transform: translate(-50%, -6px) scale(1) !important;
            pointer-events: auto !important;
          }
        `,
      }}
    />
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
              <span className="auto-list-control" style={styles.selectShell}>
                <select
                  ref={departmentSelectRef}
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
                <button
                  type="button"
                  className="auto-list-icon-button"
                  style={styles.inputIconButton}
                  onClick={() => {
                    if (departmentSelectRef.current) {
                      openNativePicker(departmentSelectRef.current);
                    }
                  }}
                  disabled={loadingDepartments || departments.length === 0}
                  aria-label="Birim seçeneklerini aç"
                >
                  <ChevronDown size={17} />
                </button>
              </span>
            </label>

            <div style={styles.dateGrid}>
              <label style={styles.fieldLabel}>
                <span>Başlangıç Tarihi</span>
                <span className="auto-list-control" style={styles.dateShell}>
                  <input
                    ref={startDateInputRef}
                    type="date"
                    style={styles.dateInput}
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                  <button
                    type="button"
                    className="auto-list-icon-button"
                    style={styles.inputIconButton}
                    onClick={() => {
                      if (startDateInputRef.current) {
                        openNativePicker(startDateInputRef.current);
                      }
                    }}
                    aria-label="Başlangıç tarihi seç"
                  >
                    <CalendarDays size={16} />
                  </button>
                </span>
              </label>

              <label style={styles.fieldLabel}>
                <span>Bitiş Tarihi</span>
                <span className="auto-list-control" style={styles.dateShell}>
                  <input
                    ref={endDateInputRef}
                    type="date"
                    style={styles.dateInput}
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                  <button
                    type="button"
                    className="auto-list-icon-button"
                    style={styles.inputIconButton}
                    onClick={() => {
                      if (endDateInputRef.current) {
                        openNativePicker(endDateInputRef.current);
                      }
                    }}
                    aria-label="Bitiş tarihi seç"
                  >
                    <CalendarDays size={16} />
                  </button>
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
              className="auto-panel-action"
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
              <button
                type="button"
                className="auto-panel-action"
                style={styles.secondaryButton}
                onClick={openShiftTypeModal}
              >
                <Plus size={17} />
                Yeni Vardiya Tipi
              </button>
              <button
                type="button"
                className="auto-panel-action"
                style={styles.squareButton}
                onClick={() => void refreshShiftTypes()}
                disabled={loadingShiftTypes}
                aria-label="Vardiya tiplerini yenile"
                title="Vardiya tiplerini yenile"
              >
                <RefreshCw className={loadingShiftTypes ? "auto-spin-icon" : undefined} size={17} />
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
                  <div style={styles.moreMenuWrap}>
                    <button
                      type="button"
                      className="auto-shift-more"
                      style={styles.plainIconButton}
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenShiftMenuId((current) => (current === shiftType.id ? null : shiftType.id));
                      }}
                      aria-label={`${shiftType.name} işlemleri`}
                      aria-haspopup="menu"
                      aria-expanded={openShiftMenuId === shiftType.id}
                    >
                      <MoreVertical size={18} />
                    </button>

                    {openShiftMenuId === shiftType.id ? (
                      <div style={styles.shiftActionMenu} role="menu">
                        <button
                          type="button"
                          className="auto-shift-action"
                          style={styles.shiftActionItem}
                          onClick={() => editShiftType(shiftType)}
                          role="menuitem"
                        >
                          <Pencil size={15} />
                          Düzenle
                        </button>
                        <button
                          type="button"
                          className="auto-shift-action"
                          style={styles.shiftActionItem}
                          onClick={() => duplicateShiftType(shiftType)}
                          role="menuitem"
                        >
                          <Copy size={15} />
                          Kopyala
                        </button>
                        <button
                          type="button"
                          className="auto-shift-action auto-shift-action-danger"
                          style={{ ...styles.shiftActionItem, ...styles.shiftActionItemDanger }}
                          onClick={() => removeShiftType(shiftType.id)}
                          role="menuitem"
                        >
                          <Trash2 size={15} />
                          Kaldır
                        </button>
                      </div>
                    ) : null}
                  </div>
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

      {isShiftModalOpen && (
        <div style={styles.modalBackdrop} role="presentation">
          <section
            style={styles.shiftModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-shift-type-modal-title"
          >
            <div style={styles.modalHeader}>
              <div style={styles.modalTitleGroup}>
                <span style={styles.modalIconBox}>
                  <Tag size={28} />
                </span>
                <div>
                  <h2 id="add-shift-type-modal-title" style={styles.modalTitle}>
                    {editingShiftTypeId ? "Vardiya Tipi Düzenle" : "Vardiya Tipi Ekle"}
                  </h2>
                  <p style={styles.modalSubtitle}>
                    {editingShiftTypeId ? "Vardiya tipi bilgilerini güncelleyin." : "Yeni bir vardiya tipi oluşturun."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="auto-modal-control"
                style={styles.modalCloseButton}
                onClick={closeShiftTypeModal}
                aria-label="Modalı kapat"
              >
                <X size={22} />
              </button>
            </div>

            <div style={styles.modalGrid}>
              <label style={styles.modalField}>
                <span>Vardiya Tipi Adı</span>
                <span style={styles.modalInputShell}>
                  <Tag size={17} />
                  <input
                    type="text"
                    placeholder="Örn: Sabah, Gece, Nöbet"
                    style={styles.modalInput}
                    value={newShiftName}
                    onChange={(event) => setNewShiftName(event.target.value)}
                  />
                </span>
              </label>

              <div style={styles.modalField}>
                <span style={styles.labelWithTooltip}>
                  Renk
                  <TooltipBadge text="Takvim ve listelerde gösterilecek renk seçin." />
                </span>
                <div style={styles.colorPickerRow}>
                  {shiftTypeColorOptions.map(
                    (color, index) => (
                      <button
                        key={color}
                        type="button"
                        className="auto-color-dot"
                        style={{
                          ...styles.colorDot,
                          background: color,
                          boxShadow:
                            color === newShiftColor
                              ? "0 0 0 3px #ffffff, 0 0 0 5px #8fb2ff"
                              : "0 8px 18px rgba(15,23,42,0.12)",
                        }}
                        onClick={() => setNewShiftColor(color)}
                        aria-label={`Renk ${index + 1}`}
                      >
                        {color === newShiftColor ? <Check size={16} /> : null}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            <div style={styles.modalSection}>
              <div style={styles.modalSectionHeader}>
                <Clock size={17} />
                <div>
                  <h3 style={styles.modalSectionTitle}>
                    Saat Aralığı <span style={styles.modalOptionalText}>(Varsayılan)</span>
                    <TooltipBadge text="Bu vardiya tipinin önerilen başlangıç ve bitiş saatini belirleyin." />
                  </h3>
                </div>
              </div>

              <div style={styles.modalThreeGrid}>
                <label style={styles.modalField}>
                  <span>Başlangıç Saati</span>
                  <ModalDropdown
                    value={newShiftStartTime}
                    placeholder="Başlangıç saati seçin"
                    options={timeOptions}
                    icon={<Clock size={17} />}
                    onChange={setNewShiftStartTime}
                  />
                </label>

                <label style={styles.modalField}>
                  <span>Bitiş Saati</span>
                  <ModalDropdown
                    value={newShiftEndTime}
                    placeholder="Bitiş saati seçin"
                    options={timeOptions}
                    icon={<Clock size={17} />}
                    onChange={setNewShiftEndTime}
                  />
                </label>

                <label style={styles.modalField}>
                  <span>Süre</span>
                  <span style={styles.modalInputShell}>
                    <input
                      type="text"
                      value={`${getTimeDuration(newShiftStartTime, newShiftEndTime)} saat`}
                      readOnly
                      style={styles.modalInput}
                    />
                  </span>
                </label>
              </div>
            </div>

            <div style={styles.modalSection}>
              <div style={styles.modalSectionHeader}>
                <Tag size={17} />
                <div>
                  <h3 style={styles.modalSectionTitle}>
                    Vardiya Tipi Kategorisi
                    <TooltipBadge text="Vardiya tipini kategorize ederek raporlama ve filtreleme süreçlerini kolaylaştırın." />
                  </h3>
                </div>
              </div>
              <ModalDropdown
                value={newShiftCategory}
                placeholder="Kategori seçin (isteğe bağlı)"
                options={categoryOptions}
                icon={<Tag size={17} />}
                onChange={setNewShiftCategory}
              />
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                className="auto-modal-control"
                style={styles.modalCancelButton}
                onClick={closeShiftTypeModal}
              >
                İptal
              </button>
              <button
                type="button"
                className="auto-modal-control"
                style={styles.modalSaveButton}
                onClick={saveShiftType}
              >
                <Check size={17} />
                Kaydet
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
    </>
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
  inputIconButton: {
    width: 28,
    height: 28,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    borderRadius: 7,
    background: "transparent",
    color: "#71809b",
    cursor: "pointer",
    padding: 0,
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
    height: 616,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
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
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    paddingRight: 3,
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
  moreMenuWrap: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  shiftActionMenu: {
    position: "absolute",
    top: 34,
    right: 0,
    zIndex: 20,
    width: 148,
    display: "grid",
    gap: 4,
    padding: 6,
    borderRadius: 10,
    border: "1px solid #dbe5f4",
    background: "rgba(255,255,255,0.98)",
    boxShadow: "0 18px 36px rgba(17, 31, 72, 0.16)",
    animation: "autoMenuIn 160ms ease both",
  },
  shiftActionItem: {
    width: "100%",
    minHeight: 34,
    display: "flex",
    alignItems: "center",
    gap: 9,
    border: "none",
    borderRadius: 7,
    background: "transparent",
    color: "#263b61",
    fontSize: 12,
    fontWeight: 700,
    textAlign: "left",
    cursor: "pointer",
    padding: "0 10px",
  },
  shiftActionItemDanger: {
    color: "#b91c1c",
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
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "34px",
    background: "rgba(38, 55, 104, 0.48)",
    backdropFilter: "blur(9px)",
  },
  shiftModal: {
    width: "min(1040px, calc(100vw - 68px))",
    maxHeight: "calc(100vh - 68px)",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    borderRadius: 12,
    border: "1px solid rgba(218, 226, 244, 0.95)",
    background: "rgba(255,255,255,0.98)",
    boxShadow: "0 34px 90px rgba(17, 31, 72, 0.28)",
  },
  modalHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 22,
    padding: "32px 34px 22px",
  },
  modalTitleGroup: {
    display: "flex",
    alignItems: "center",
    gap: 18,
  },
  modalIconBox: {
    width: 58,
    height: 58,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    background: "#eef3ff",
    color: "#315fe8",
    flexShrink: 0,
  },
  modalTitle: {
    margin: 0,
    fontSize: 26,
    lineHeight: 1.1,
    fontWeight: 850,
    letterSpacing: "-0.035em",
    color: "#101a3c",
  },
  modalSubtitle: {
    margin: "9px 0 0",
    fontSize: 13,
    fontWeight: 600,
    color: "#61708f",
  },
  modalCloseButton: {
    width: 46,
    height: 46,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #dbe4f4",
    borderRadius: 8,
    background: "#ffffff",
    color: "#0f1f46",
    cursor: "pointer",
  },
  modalGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
    padding: "0 34px 22px",
  },
  modalField: {
    display: "grid",
    gap: 10,
    fontSize: 13,
    fontWeight: 800,
    color: "#101a3c",
  },
  labelWithTooltip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    width: "fit-content",
  },
  tooltipWrap: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    verticalAlign: "middle",
  },
  tooltipBadge: {
    width: 17,
    height: 17,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    border: "1px solid #b9c9f6",
    background: "#eef4ff",
    color: "#2456e8",
    fontSize: 11,
    lineHeight: 1,
    fontWeight: 850,
    cursor: "help",
  },
  tooltipContent: {
    position: "absolute" as const,
    left: "50%",
    bottom: "calc(100% + 10px)",
    zIndex: 180,
    width: 238,
    padding: "9px 10px",
    borderRadius: 8,
    border: "1px solid rgba(185,201,246,0.9)",
    background: "rgba(15, 31, 70, 0.96)",
    color: "#ffffff",
    fontSize: 11,
    fontWeight: 650,
    lineHeight: 1.45,
    textAlign: "center" as const,
    boxShadow: "0 16px 34px rgba(15,31,70,0.22)",
    opacity: 0,
    pointerEvents: "none" as const,
    transform: "translate(-50%, 0) scale(0.96)",
    transition: "opacity 160ms ease, transform 160ms ease",
  },
  colorHint: {
    margin: "-4px 0 4px",
    fontSize: 12,
    lineHeight: 1.35,
    fontWeight: 600,
    color: "#61708f",
  },
  colorPickerRow: {
    display: "flex",
    alignItems: "center",
    gap: 24,
    minHeight: 42,
  },
  colorDot: {
    width: 32,
    height: 32,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    borderRadius: "50%",
    color: "#ffffff",
    cursor: "pointer",
  },
  modalInputShell: {
    height: 46,
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "0 16px",
    border: "1px solid #d4deef",
    borderRadius: 8,
    background: "#ffffff",
    color: "#315fe8",
  },
  modalInput: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#10204a",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "inherit",
  },
  modalSelect: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    border: "none",
    outline: "none",
    appearance: "none",
    background: "transparent",
    color: "#61708f",
    fontSize: 14,
    fontWeight: 650,
    fontFamily: "inherit",
  },
  modalDropdown: {
    position: "relative",
    width: "100%",
  },
  modalDropdownButton: {
    width: "100%",
    height: 46,
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "0 10px 0 16px",
    border: "1px solid #d4deef",
    borderRadius: 8,
    background: "#ffffff",
    color: "#315fe8",
    cursor: "pointer",
    fontFamily: "inherit",
    textAlign: "left" as const,
    transition: "border-color 160ms ease, background 160ms ease, box-shadow 160ms ease",
  },
  modalDropdownIcon: {
    display: "inline-flex",
    color: "#315fe8",
  },
  modalDropdownValue: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    fontSize: 14,
    fontWeight: 650,
  },
  modalDropdownChevron: {
    width: 30,
    height: 30,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    background: "#f3f6ff",
    color: "#315fe8",
    transition: "transform 160ms ease, background 160ms ease",
  },
  modalDropdownMenu: {
    position: "absolute" as const,
    top: "calc(100% + 8px)",
    left: 0,
    right: 0,
    zIndex: 150,
    maxHeight: 228,
    overflowY: "auto" as const,
    padding: 6,
    border: "1px solid rgba(181,195,221,0.86)",
    borderRadius: 10,
    background: "rgba(255,255,255,0.98)",
    boxShadow: "0 22px 50px rgba(34,53,104,0.18)",
    animation: "autoDropdownIn 160ms ease-out",
  },
  modalDropdownItem: {
    width: "100%",
    minHeight: 42,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "9px 10px",
    border: "none",
    borderRadius: 8,
    background: "transparent",
    color: "#1b2b52",
    cursor: "pointer",
    fontFamily: "inherit",
    textAlign: "left" as const,
    transition: "background 140ms ease, color 140ms ease, transform 140ms ease",
  },
  modalDropdownItemActive: {
    background: "linear-gradient(135deg, #eef4ff 0%, #f7faff 100%)",
    color: "#2456e8",
  },
  modalDropdownItemTitle: {
    display: "block",
    fontSize: 13,
    fontWeight: 750,
    lineHeight: 1.2,
  },
  modalDropdownItemDesc: {
    display: "block",
    marginTop: 4,
    fontSize: 11,
    fontWeight: 650,
    color: "#74829f",
  },
  modalSection: {
    margin: "0 22px 12px",
    padding: "22px 18px 18px",
    border: "1px solid #dfe7f4",
    borderRadius: 10,
    background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
  },
  modalSectionHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 18,
    color: "#315fe8",
  },
  modalSectionTitle: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.25,
    fontWeight: 850,
    color: "#101a3c",
  },
  modalSectionText: {
    margin: "8px 0 0",
    fontSize: 12,
    lineHeight: 1.4,
    fontWeight: 600,
    color: "#61708f",
  },
  modalThreeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 20,
  },
  nightShiftRow: {
    minHeight: 66,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    marginTop: 18,
    padding: "0 16px",
    border: "1px solid #e1e8f4",
    borderRadius: 8,
    background: "#ffffff",
    cursor: "pointer",
  },
  nightShiftText: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    color: "#315fe8",
  },
  nightShiftTitle: {
    display: "block",
    fontSize: 13,
    lineHeight: 1.25,
    fontWeight: 850,
    color: "#101a3c",
  },
  nightShiftDesc: {
    display: "block",
    marginTop: 5,
    fontSize: 11,
    fontWeight: 650,
    color: "#61708f",
  },
  modalSwitch: {
    width: 42,
    height: 24,
    display: "inline-flex",
    alignItems: "center",
    padding: 2,
    borderRadius: 999,
    transition: "background 0.2s ease",
  },
  modalSwitchKnob: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "#ffffff",
    boxShadow: "0 2px 8px rgba(15,23,42,0.22)",
    transition: "transform 0.2s ease",
  },
  textareaShell: {
    position: "relative",
    display: "block",
  },
  modalOptionalText: {
    fontWeight: 700,
    color: "#6b7893",
  },
  modalTextarea: {
    width: "100%",
    height: 82,
    resize: "none",
    boxSizing: "border-box",
    border: "1px solid #d4deef",
    borderRadius: 8,
    outline: "none",
    padding: "15px 14px 24px",
    color: "#10204a",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "inherit",
    background: "#ffffff",
  },
  textareaCounter: {
    position: "absolute",
    right: 13,
    bottom: 10,
    fontSize: 12,
    fontWeight: 700,
    color: "#7c89a4",
  },
  modalFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: "auto",
    padding: "24px 34px 28px",
    borderTop: "1px solid #edf2f8",
    background: "rgba(255,255,255,0.96)",
  },
  modalCancelButton: {
    height: 42,
    minWidth: 142,
    border: "1px solid #d4deef",
    borderRadius: 8,
    background: "#ffffff",
    color: "#2456e8",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },
  modalSaveButton: {
    height: 42,
    minWidth: 194,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    border: "none",
    borderRadius: 8,
    background: "linear-gradient(135deg, #3f63f4 0%, #234bdc 100%)",
    color: "#ffffff",
    fontSize: 13,
    fontWeight: 850,
    cursor: "pointer",
    boxShadow: "0 14px 24px rgba(35,75,220,0.24)",
  },
};
