"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Download,
  Plus,
  RefreshCcw,
  UserRound,
  Users,
} from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import trLocale from "@fullcalendar/core/locales/tr";
import type {
  EventApi,
  EventContentArg,
  EventInput,
  EventSourceFuncArg,
} from "@fullcalendar/core";

import { ApiError, apiClient } from "@/lib/api";
import styles from "./calendar-board.module.css";

type Department = {
  id: number;
  name: string;
  is_active?: boolean;
};

type StaffMember = {
  id: number;
  fullName: string;
  departmentId?: number | null;
  isActive?: boolean;
};

type CalendarEventProps = {
  kind?: "assignment" | "holiday";
  staff_name?: string;
  staff_id?: number;
  department?: string;
  department_id?: number;
  shift_type?: string;
  status?: string;
  note?: string;
  hours?: string;
  work_day?: string;
  is_nobet?: boolean;
  label?: string;
};

type DragGhostState = {
  visible: boolean;
  x: number;
  y: number;
  staffName: string;
  shiftType: string;
  sourceDate: string;
};

type SwapCandidate = {
  id: string;
  staffName: string;
  shiftType: string;
  isNobet: boolean;
};

type ConfirmState = {
  sourceAssignmentId: string;
  sourceDate: string;
  targetDate: string;
  sourceStaffName: string;
  sourceShiftType: string;
  sourceDepartment: string;
  swapCandidates: SwapCandidate[];
  selectedTargetId: string;
  revert: () => void;
};

type DragSession = {
  assignmentId: string;
  sourceDate: string;
  staffName: string;
  shiftType: string;
  department: string;
  departmentId: string;
};

type MoveAssignmentResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

type ScopeType = "all" | "department" | "staff" | "my";

const SCOPE_OPTIONS = [
  { value: "all" as const, label: "Tüm Birimler", icon: Users },
  { value: "department" as const, label: "Birim", icon: Building2 },
  { value: "staff" as const, label: "Personel", icon: UserRound },
  { value: "my" as const, label: "Benim Takvimim", icon: CalendarDays },
];

type CalendarDragStartArg = {
  event: EventApi;
  jsEvent: MouseEvent;
};

type CalendarDropArg = {
  event: EventApi;
  oldEvent: EventApi;
  view: { calendar: { getEvents: () => EventApi[] } };
  revert: () => void;
};

const scopeOptions: Record<ScopeType, string> = {
  all: "Tum Birimler",
  department: "Birim",
  staff: "Personel",
  my: "Benim Takvimim",
};

function dayKeyFromDateString(value?: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function formatDateLabel(dateValue: string): string {
  const date = new Date(`${dateValue}T12:00:00`);
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  });
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (typeof error.data === "object" && error.data !== null) {
      if ("error" in error.data && typeof error.data.error === "string") {
        return error.data.error;
      }
      if ("detail" in error.data && typeof error.data.detail === "string") {
        return error.data.detail;
      }
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "İşlem tamamlanamadı.";
}

function eventKind(event: EventApi): "assignment" | "holiday" {
  const props = event.extendedProps as CalendarEventProps;
  return props.kind === "holiday" ? "holiday" : "assignment";
}

export function CalendarBoard() {
  const calendarRef = useRef<FullCalendar | null>(null);
  const calendarFrameRef = useRef<HTMLDivElement | null>(null);
  const monthDropdownRef = useRef<HTMLDivElement | null>(null);
  const scopeDropdownRef = useRef<HTMLDivElement | null>(null);
  const departmentDropdownRef = useRef<HTMLDivElement | null>(null);
  const staffDropdownRef = useRef<HTMLDivElement | null>(null);
  const pointerMoveHandlerRef = useRef<((event: PointerEvent) => void) | null>(null);
  const confirmModalTimerRef = useRef<number | null>(null);
  const confirmModalOpenedAtRef = useRef(0);
  const dragSessionRef = useRef<DragSession | null>(null);
  const highlightedCellRef = useRef<HTMLElement | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);

  const [scope, setScope] = useState<ScopeType>("department");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("");

  const [loadingFilters, setLoadingFilters] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmittingMove, setIsSubmittingMove] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [calendarTitle, setCalendarTitle] = useState("");
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isScopeDropdownOpen, setIsScopeDropdownOpen] = useState(false);
  const [isDepartmentDropdownOpen, setIsDepartmentDropdownOpen] = useState(false);
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);

  const [dragGhost, setDragGhost] = useState<DragGhostState>({
    visible: false,
    x: 0,
    y: 0,
    staffName: "",
    shiftType: "",
    sourceDate: "",
  });
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const availableStaff = useMemo(() => {
    if (scope !== "staff") {
      return staffMembers;
    }
    if (!selectedDepartment) {
      return staffMembers;
    }
    return staffMembers.filter(
      (item) => String(item.departmentId ?? "") === selectedDepartment
    );
  }, [scope, selectedDepartment, staffMembers]);

  const ghostPosition = useMemo(() => {
    if (!dragGhost.visible) {
      return { x: 0, y: 0 };
    }

    const ghostWidth = 220;
    const ghostHeight = 96;
    const padding = 12;
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 0;
    const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 0;

    let x = dragGhost.x + 18;
    let y = dragGhost.y + 18;

    if (viewportWidth && x + ghostWidth > viewportWidth - padding) {
      x = dragGhost.x - ghostWidth - 18;
    }
    if (viewportHeight && y + ghostHeight > viewportHeight - padding) {
      y = dragGhost.y - ghostHeight - 18;
    }

    x = Math.max(padding, x);
    y = Math.max(padding, y);
    return { x, y };
  }, [dragGhost]);

  const monthOptions = useMemo(() => {
    const year = calendarDate.getFullYear();
    return Array.from({ length: 12 }, (_, monthIndex) => new Date(year, monthIndex, 1));
  }, [calendarDate]);

  const selectedMonthKey = `${calendarDate.getFullYear()}-${calendarDate.getMonth()}`;
  const selectedScopeOption =
    SCOPE_OPTIONS.find((option) => option.value === scope) ?? SCOPE_OPTIONS[0];
  const selectedDepartmentOption =
    departments.find((department) => String(department.id) === selectedDepartment) ?? null;
  const selectedStaffOption =
    availableStaff.find((item) => String(item.id) === selectedStaff) ?? null;

  const selectCalendarMonth = useCallback((date: Date) => {
    calendarRef.current?.getApi().gotoDate(date);
    setCalendarDate(date);
    setIsMonthDropdownOpen(false);
  }, []);

  const selectScope = useCallback((nextScope: ScopeType) => {
    setScope(nextScope);
    setIsScopeDropdownOpen(false);
  }, []);

  const selectDepartment = useCallback((departmentId: string) => {
    setSelectedDepartment(departmentId);
    setIsDepartmentDropdownOpen(false);
  }, []);

  const selectStaff = useCallback((staffId: string) => {
    setSelectedStaff(staffId);
    setIsStaffDropdownOpen(false);
  }, []);

  const closeAllDropdowns = useCallback(() => {
    setIsMonthDropdownOpen(false);
    setIsScopeDropdownOpen(false);
    setIsDepartmentDropdownOpen(false);
    setIsStaffDropdownOpen(false);
  }, []);

  const openDropdown = useCallback(
    (dropdown: "month" | "scope" | "department" | "staff") => {
      setIsMonthDropdownOpen(dropdown === "month");
      setIsScopeDropdownOpen(dropdown === "scope");
      setIsDepartmentDropdownOpen(dropdown === "department");
      setIsStaffDropdownOpen(dropdown === "staff");
    },
    []
  );

  const clearDropHighlights = useCallback(() => {
    if (highlightedCellRef.current) {
      highlightedCellRef.current.classList.remove("calendar-drop-highlight");
      highlightedCellRef.current = null;
    }
  }, []);

  useEffect(() => {
    const frame = calendarFrameRef.current;
    if (!frame) {
      return undefined;
    }

    let animationFrameId: number | null = null;

    const updateCalendarSize = () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = window.requestAnimationFrame(() => {
        calendarRef.current?.getApi().updateSize();
      });
    };

    updateCalendarSize();

    const observer = new ResizeObserver(updateCalendarSize);
    observer.observe(frame);
    window.addEventListener("resize", updateCalendarSize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateCalendarSize);
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  useEffect(() => {
    if (!isMonthDropdownOpen) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        monthDropdownRef.current &&
        !monthDropdownRef.current.contains(event.target as Node)
      ) {
        setIsMonthDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMonthDropdownOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMonthDropdownOpen]);

  useEffect(() => {
    if (!isScopeDropdownOpen) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        scopeDropdownRef.current &&
        !scopeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsScopeDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsScopeDropdownOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isScopeDropdownOpen]);

  useEffect(() => {
    if (!isDepartmentDropdownOpen) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        departmentDropdownRef.current &&
        !departmentDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDepartmentDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDepartmentDropdownOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDepartmentDropdownOpen]);

  useEffect(() => {
    if (!isStaffDropdownOpen) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (staffDropdownRef.current && !staffDropdownRef.current.contains(event.target as Node)) {
        setIsStaffDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsStaffDropdownOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isStaffDropdownOpen]);

  const setDropHighlightFromPointer = useCallback((clientX: number, clientY: number) => {
    const target = document.elementFromPoint(clientX, clientY);
    const dayCell = target?.closest(".fc-daygrid-day") as HTMLElement | null;

    if (highlightedCellRef.current && highlightedCellRef.current !== dayCell) {
      highlightedCellRef.current.classList.remove("calendar-drop-highlight");
    }

    if (dayCell) {
      dayCell.classList.add("calendar-drop-highlight");
      highlightedCellRef.current = dayCell;
    } else {
      highlightedCellRef.current = null;
    }
  }, []);

  const stopPointerTracking = useCallback(() => {
    if (pointerMoveHandlerRef.current) {
      window.removeEventListener("pointermove", pointerMoveHandlerRef.current);
      pointerMoveHandlerRef.current = null;
    }
    clearDropHighlights();
  }, [clearDropHighlights]);

  const refetchCalendar = useCallback(() => {
    calendarRef.current?.getApi().refetchEvents();
  }, []);

  const navigateCalendar = useCallback((direction: "prev" | "next" | "today") => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    if (direction === "prev") api.prev();
    if (direction === "next") api.next();
    if (direction === "today") api.today();
  }, []);

  const openConfirmModal = useCallback((payload: Omit<ConfirmState, "revert">) => {
    if (confirmModalTimerRef.current) {
      window.clearTimeout(confirmModalTimerRef.current);
    }

    confirmModalTimerRef.current = window.setTimeout(() => {
      confirmModalOpenedAtRef.current = Date.now();
      setConfirmState({
        ...payload,
        revert: () => undefined,
      });
      confirmModalTimerRef.current = null;
    }, 40);
  }, []);

  const loadFilters = useCallback(async () => {
    setLoadingFilters(true);
    try {
      const [departmentResponse, staffResponse] = await Promise.all([
        apiClient.get<Department[]>("/departments/"),
        apiClient.get<{ staff: StaffMember[] }>("/staff/"),
      ]);

      setDepartments(departmentResponse.filter((item) => item.is_active !== false));
      setStaffMembers(
        (staffResponse.staff ?? []).filter((item) => item.isActive !== false)
      );
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setLoadingFilters(false);
    }
  }, []);

  useEffect(() => {
    void loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (scope !== "staff") {
      setSelectedStaff("");
    }
    if (scope !== "department" && scope !== "all") {
      setSelectedDepartment("");
    }
  }, [scope]);

  useEffect(() => {
    return () => {
      if (confirmModalTimerRef.current) {
        window.clearTimeout(confirmModalTimerRef.current);
      }
      stopPointerTracking();
    };
  }, [stopPointerTracking]);

  useEffect(() => {
    refetchCalendar();
  }, [scope, selectedDepartment, selectedStaff, refetchCalendar]);

  const fetchEvents = useCallback(
    async (
      fetchInfo: EventSourceFuncArg,
      successCallback: (events: EventInput[]) => void,
      failureCallback: (error: Error) => void
    ) => {
      const params = new URLSearchParams({
        start: fetchInfo.startStr,
        end: fetchInfo.endStr,
        scope,
      });

      if (selectedDepartment && (scope === "department" || scope === "all")) {
        params.set("department", selectedDepartment);
      }
      if (selectedStaff && scope === "staff") {
        params.set("staff", selectedStaff);
      }

      try {
        const events = await apiClient.get<EventInput[]>(`/events/?${params.toString()}`);
        setErrorMessage(null);
        successCallback(events);
      } catch (error) {
        const message = extractErrorMessage(error);
        setErrorMessage(message);
        failureCallback(new Error(message));
      }
    },
    [scope, selectedDepartment, selectedStaff]
  );

  const submitMove = useCallback(
    async (payload: Record<string, string>, revert: () => void) => {
      setIsSubmittingMove(true);
      try {
        const response = await apiClient.post<MoveAssignmentResponse>(
          "/move-assignment/",
          payload
        );

        if (!response.success) {
          throw new Error(response.error || "Islem basarisiz.");
        }

        setConfirmState(null);
        setErrorMessage(null);
        refetchCalendar();
      } catch (error) {
        revert();
        setConfirmState(null);
        setErrorMessage(extractErrorMessage(error));
      } finally {
        setIsSubmittingMove(false);
      }
    },
    [refetchCalendar]
  );

  const closeConfirmModal = useCallback((revertChange: boolean) => {
    if (
      revertChange &&
      confirmModalOpenedAtRef.current &&
      Date.now() - confirmModalOpenedAtRef.current < 160
    ) {
      return;
    }

    setConfirmState((current) => {
      if (current && revertChange) {
        current.revert();
      }
      return null;
    });
  }, []);

  const handleEventDragStart = useCallback(
    (arg: CalendarDragStartArg) => {
      if (eventKind(arg.event) !== "assignment") {
        return;
      }

      const props = arg.event.extendedProps as CalendarEventProps;
      const sourceDate = dayKeyFromDateString(arg.event.startStr);
      const pointerEvent = arg.jsEvent as MouseEvent;

      setDragGhost({
        visible: true,
        x: pointerEvent?.clientX ?? 0,
        y: pointerEvent?.clientY ?? 0,
        staffName: props.staff_name || arg.event.title || "-",
        shiftType: props.shift_type || "-",
        sourceDate,
      });

      dragSessionRef.current = {
        assignmentId: String(arg.event.id),
        sourceDate,
        staffName: props.staff_name || arg.event.title || "-",
        shiftType: props.shift_type || "-",
        department: props.department || "-",
        departmentId: String(props.department_id ?? ""),
      };

      const moveHandler = (moveEvent: PointerEvent) => {
        setDragGhost((current) => ({
          ...current,
          x: moveEvent.clientX,
          y: moveEvent.clientY,
        }));
        setDropHighlightFromPointer(moveEvent.clientX, moveEvent.clientY);
      };

      pointerMoveHandlerRef.current = moveHandler;
      window.addEventListener("pointermove", moveHandler);
    },
    [setDropHighlightFromPointer]
  );

  const handleEventDragStop = useCallback(() => {
    const targetDate = highlightedCellRef.current?.getAttribute("data-date") ?? "";
    const dragSession = dragSessionRef.current;

    stopPointerTracking();
    setDragGhost((current) => ({ ...current, visible: false }));
    dragSessionRef.current = null;

    if (!dragSession || !targetDate || targetDate === dragSession.sourceDate) {
      return;
    }

    const calendarApi = calendarRef.current?.getApi();
    const swapCandidates = (calendarApi?.getEvents() ?? [])
      .filter((candidate) => {
        if (eventKind(candidate) !== "assignment") return false;
        if (String(candidate.id) === dragSession.assignmentId) return false;
        if (dayKeyFromDateString(candidate.startStr) !== targetDate) return false;

        const candidateProps = candidate.extendedProps as CalendarEventProps;
        return String(candidateProps.department_id ?? "") === dragSession.departmentId;
      })
      .map((candidate) => {
        const candidateProps = candidate.extendedProps as CalendarEventProps;
        return {
          id: String(candidate.id),
          staffName: candidateProps.staff_name || candidate.title || "-",
          shiftType: candidateProps.shift_type || "-",
          isNobet: Boolean(candidateProps.is_nobet),
        };
      });

    calendarApi?.refetchEvents();

    openConfirmModal({
      sourceAssignmentId: dragSession.assignmentId,
      sourceDate: dragSession.sourceDate,
      targetDate,
      sourceStaffName: dragSession.staffName,
      sourceShiftType: dragSession.shiftType,
      sourceDepartment: dragSession.department,
      swapCandidates,
      selectedTargetId: swapCandidates[0]?.id ?? "",
    });
  }, [openConfirmModal, stopPointerTracking]);

  const handleEventDrop = useCallback((arg: CalendarDropArg) => {
    arg.revert();
  }, []);

  const runMoveAction = useCallback(async () => {
    if (!confirmState) return;
    await submitMove(
      {
        action: "move",
        assignmentId: confirmState.sourceAssignmentId,
        targetDate: confirmState.targetDate,
      },
      confirmState.revert
    );
  }, [confirmState, submitMove]);

  const runSwapAction = useCallback(async () => {
    if (!confirmState || !confirmState.selectedTargetId) return;
    await submitMove(
      {
        action: "swap",
        assignmentId: confirmState.sourceAssignmentId,
        targetDate: confirmState.targetDate,
        targetAssignmentId: confirmState.selectedTargetId,
      },
      confirmState.revert
    );
  }, [confirmState, submitMove]);

  const renderEventContent = useCallback((arg: EventContentArg) => {
    const props = arg.event.extendedProps as CalendarEventProps;
    if ((props.kind || "assignment") === "holiday") {
      return <div className={styles.holidayEventChip}>{props.label || arg.event.title}</div>;
    }

    return (
      <div
        className={`${styles.assignmentEventChip} ${
          props.is_nobet ? styles.assignmentEventChipNobet : styles.assignmentEventChipMesai
        }`}
      >
        <span className={styles.eventStaffName}>
          {props.staff_name || arg.event.title}
        </span>
        <span
          className={`${styles.eventBadge} ${
            props.is_nobet ? styles.eventBadgeNobet : styles.eventBadgeMesai
          }`}
          title={props.is_nobet ? "Nöbet" : props.shift_type || "Mesai"}
        >
          {props.is_nobet ? "N" : "M"}
        </span>
      </div>
    );
  }, []);

  return (
    <section className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.calendarCard}>
          <div className={styles.calendarCardHeader}>
            <div className={styles.headerTitleWrap}>
              <h2>Vardiya Takvimi</h2>
              <div className={styles.infoBadgeWrap}>
                <button
                  type="button"
                  className={styles.infoBadge}
                  aria-label="Takvim hakkında bilgi"
                >
                  <CircleAlert size={16} />
                </button>
                <div className={styles.infoTooltip}>
                  Sürükle-bırak ile atama taşı, aynı birim içinde swap yap ve
                  takvimi filtrelerle daralt.
                </div>
              </div>
            </div>
            <p>Birimlerinizin vardiya planlarını takvim üzerinden görüntüleyin ve yönetin.</p>
          </div>

          {errorMessage ? <p className={styles.errorText}>{errorMessage}</p> : null}

          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <button
                type="button"
                className={styles.navButton}
                onClick={() => navigateCalendar("prev")}
                aria-label="Onceki ay"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className={styles.navButton}
                onClick={() => navigateCalendar("next")}
                aria-label="Sonraki ay"
              >
                <ChevronRight size={18} />
              </button>
              <button
                type="button"
                className={styles.todayButton}
                onClick={() => navigateCalendar("today")}
              >
                Bugün
              </button>
              <div className={styles.toolbarLegend}>
                <span><em className={styles.legendMesai}>M</em>Mesai</span>
                <span><em className={styles.legendNobet}>N</em>Nöbet</span>
                <span><em className={styles.legendIzin}>İ</em>İzinli</span>
                <span><em className={styles.legendEmpty}>-</em>Vardiya Yok</span>
              </div>
            </div>

            <div className={styles.toolbarRight}>
              <div
                ref={monthDropdownRef}
                className={styles.monthDropdown}
                onMouseEnter={() => openDropdown("month")}
                onMouseLeave={closeAllDropdowns}
              >
                <button
                  type="button"
                  className={`${styles.monthDropdownButton} ${
                    isMonthDropdownOpen ? styles.monthDropdownButtonOpen : ""
                  }`}
                  aria-haspopup="listbox"
                  aria-expanded={isMonthDropdownOpen}
                  onClick={() => {
                    if (isMonthDropdownOpen) {
                      closeAllDropdowns();
                      return;
                    }
                    openDropdown("month");
                  }}
                >
                  <span className={styles.monthDropdownIcon}>
                    <CalendarDays size={18} />
                  </span>
                  <span className={styles.monthDropdownLabel}>{calendarTitle}</span>
                  <ChevronDown
                    size={18}
                    className={styles.monthDropdownChevron}
                    aria-hidden="true"
                  />
                </button>

                {isMonthDropdownOpen ? (
                  <div className={styles.monthDropdownMenu} role="listbox">
                    {monthOptions.map((monthDate) => {
                      const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
                      const isSelected = monthKey === selectedMonthKey;
                      const monthLabel = monthDate.toLocaleDateString("tr-TR", {
                        month: "long",
                        year: "numeric",
                      });

                      return (
                        <button
                          key={monthKey}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          className={`${styles.monthOption} ${
                            isSelected ? styles.monthOptionSelected : ""
                          }`}
                          onClick={() => selectCalendarMonth(monthDate)}
                        >
                          <CalendarDays size={20} />
                          <span>{monthLabel}</span>
                          {isSelected ? <Check size={18} /> : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div
                ref={scopeDropdownRef}
                className={styles.scopeDropdown}
                onMouseEnter={() => openDropdown("scope")}
                onMouseLeave={closeAllDropdowns}
              >
                <button
                  type="button"
                  className={`${styles.scopeDropdownButton} ${
                    isScopeDropdownOpen ? styles.scopeDropdownButtonOpen : ""
                  }`}
                  aria-haspopup="listbox"
                  aria-expanded={isScopeDropdownOpen}
                  onClick={() => {
                    if (isScopeDropdownOpen) {
                      closeAllDropdowns();
                      return;
                    }
                    openDropdown("scope");
                  }}
                >
                  <span className={styles.scopeDropdownIcon}>
                    <Users size={17} />
                  </span>
                  <span className={styles.scopeDropdownLabel}>{selectedScopeOption.label}</span>
                  <ChevronDown
                    size={18}
                    className={styles.scopeDropdownChevron}
                    aria-hidden="true"
                  />
                </button>

                {isScopeDropdownOpen ? (
                  <div className={styles.scopeDropdownMenu} role="listbox">
                    {SCOPE_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const isSelected = option.value === scope;
                      const withDivider = option.value === "my";

                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          className={`${styles.scopeOption} ${
                            isSelected ? styles.scopeOptionSelected : ""
                          } ${withDivider ? styles.scopeOptionDivider : ""}`}
                          onClick={() => selectScope(option.value)}
                        >
                          <Icon size={18} />
                          <span>{option.label}</span>
                          {isSelected ? <Check size={18} /> : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div
                ref={departmentDropdownRef}
                className={styles.selectFieldDropdown}
                onMouseEnter={() => {
                  if (scope !== "department" && scope !== "all") {
                    return;
                  }
                  openDropdown("department");
                }}
                onMouseLeave={closeAllDropdowns}
              >
                <button
                  type="button"
                  className={`${styles.selectFieldButton} ${
                    isDepartmentDropdownOpen ? styles.selectFieldButtonOpen : ""
                  }`}
                  aria-haspopup="listbox"
                  aria-expanded={isDepartmentDropdownOpen}
                  disabled={scope !== "department" && scope !== "all"}
                  onClick={() => {
                    if (scope !== "department" && scope !== "all") {
                      return;
                    }
                    if (isDepartmentDropdownOpen) {
                      closeAllDropdowns();
                      return;
                    }
                    openDropdown("department");
                  }}
                >
                  <span className={styles.selectFieldDropdownIcon}>
                    <Users size={18} />
                  </span>
                  <span className={styles.selectFieldDropdownLabel}>
                    {selectedDepartmentOption?.name ?? "Tüm Birimler"}
                  </span>
                  <ChevronDown
                    size={18}
                    className={styles.selectFieldDropdownChevron}
                    aria-hidden="true"
                  />
                </button>

                {isDepartmentDropdownOpen ? (
                  <div className={styles.selectFieldDropdownMenu} role="listbox">
                    <button
                      type="button"
                      role="option"
                      aria-selected={!selectedDepartment}
                      className={`${styles.selectFieldOption} ${
                        !selectedDepartment ? styles.selectFieldOptionSelected : ""
                      }`}
                      onClick={() => selectDepartment("")}
                    >
                      <Users size={18} />
                      <span>Tüm Birimler</span>
                      {!selectedDepartment ? <Check size={18} /> : null}
                    </button>

                    {departments.map((department) => {
                      const isSelected = selectedDepartment === String(department.id);

                      return (
                        <button
                          key={department.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          className={`${styles.selectFieldOption} ${
                            isSelected ? styles.selectFieldOptionSelected : ""
                          }`}
                          onClick={() => selectDepartment(String(department.id))}
                        >
                          <Building2 size={18} />
                          <span>{department.name}</span>
                          {isSelected ? <Check size={18} /> : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div
                ref={staffDropdownRef}
                className={styles.selectFieldDropdown}
                onMouseEnter={() => {
                  if (scope !== "staff") {
                    return;
                  }
                  openDropdown("staff");
                }}
                onMouseLeave={closeAllDropdowns}
              >
                <button
                  type="button"
                  className={`${styles.selectFieldButton} ${
                    isStaffDropdownOpen ? styles.selectFieldButtonOpen : ""
                  }`}
                  aria-haspopup="listbox"
                  aria-expanded={isStaffDropdownOpen}
                  disabled={scope !== "staff"}
                  onClick={() => {
                    if (scope !== "staff") {
                      return;
                    }
                    if (isStaffDropdownOpen) {
                      closeAllDropdowns();
                      return;
                    }
                    openDropdown("staff");
                  }}
                >
                  <span className={styles.selectFieldDropdownIcon}>
                    <UserRound size={18} />
                  </span>
                  <span className={styles.selectFieldDropdownLabel}>
                    {selectedStaffOption?.fullName ?? "Tüm Personel"}
                  </span>
                  <ChevronDown
                    size={18}
                    className={styles.selectFieldDropdownChevron}
                    aria-hidden="true"
                  />
                </button>

                {isStaffDropdownOpen ? (
                  <div className={styles.selectFieldDropdownMenu} role="listbox">
                    <button
                      type="button"
                      role="option"
                      aria-selected={!selectedStaff}
                      className={`${styles.selectFieldOption} ${
                        !selectedStaff ? styles.selectFieldOptionSelected : ""
                      }`}
                      onClick={() => selectStaff("")}
                    >
                      <Users size={18} />
                      <span>Tüm Personel</span>
                      {!selectedStaff ? <Check size={18} /> : null}
                    </button>

                    {availableStaff.map((item) => {
                      const isSelected = selectedStaff === String(item.id);

                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          className={`${styles.selectFieldOption} ${
                            isSelected ? styles.selectFieldOptionSelected : ""
                          }`}
                          onClick={() => selectStaff(String(item.id))}
                        >
                          <UserRound size={18} />
                          <span>{item.fullName}</span>
                          {isSelected ? <Check size={18} /> : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                className={styles.iconAction}
                onClick={() => refetchCalendar()}
                aria-label="Takvimi yenile"
              >
                <RefreshCcw size={18} />
              </button>
              <button
                type="button"
                className={styles.addShiftButton}
                onClick={() => {
                  window.location.href = "/shifts";
                }}
                aria-label="Yeni vardiya ekle"
                title="Yeni vardiya ekle"
              >
                <Plus size={16} />
              </button>
              <button
                type="button"
                className={styles.exportIconButton}
                onClick={() => window.print()}
                aria-label="Takvimi dışa aktar"
                title="Takvimi dışa aktar"
              >
                <Download size={16} />
              </button>
            </div>
          </div>

          <div ref={calendarFrameRef} className={styles.calendarFrame}>
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, interactionPlugin]}
              locale={trLocale}
              initialView="dayGridMonth"
              height="100%"
              fixedWeekCount={false}
              dayMaxEventRows={4}
              headerToolbar={false}
              events={fetchEvents}
              editable
              eventDurationEditable={false}
              eventStartEditable
              eventContent={renderEventContent}
              datesSet={(arg) => {
                setCalendarTitle(arg.view.title);
                setCalendarDate(arg.view.currentStart);
              }}
              eventAllow={(_dropInfo, draggedEvent) => {
                if (!draggedEvent) {
                  return false;
                }
                const props = draggedEvent.extendedProps as CalendarEventProps;
                return (props.kind || "assignment") === "assignment";
              }}
              eventDrop={handleEventDrop}
              eventDragStart={handleEventDragStart}
              eventDragStop={handleEventDragStop}
            />
          </div>
        </div>
      </div>

      {dragGhost.visible ? (
        <div
          className={styles.dragGhost}
          style={{
            transform: `translate(${ghostPosition.x}px, ${ghostPosition.y}px)`,
          }}
        >
          <strong>{dragGhost.staffName}</strong>
          <span>{dragGhost.shiftType}</span>
          <small>{formatDateLabel(dragGhost.sourceDate)}</small>
        </div>
      ) : null}

      {isClient && confirmState
        ? createPortal(
            <div
              className={styles.modalOverlay}
              onClick={() => closeConfirmModal(true)}
              role="presentation"
            >
              <div
                className={styles.modalCard}
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
              >
                <h3>Vardiya işlemini onayla</h3>
                <p className={styles.modalSubtitle}>
                  Taşıma veya aynı birim içinde swap seçeneğini kullanabilirsiniz.
                </p>

                <div className={styles.summaryGrid}>
                  <div>
                    <span>Personel</span>
                    <strong>{confirmState.sourceStaffName}</strong>
                  </div>
                  <div>
                    <span>Vardiya</span>
                    <strong>{confirmState.sourceShiftType}</strong>
                  </div>
                  <div>
                    <span>Birim</span>
                    <strong>{confirmState.sourceDepartment}</strong>
                  </div>
                  <div>
                    <span>Kaynak Gün</span>
                    <strong>{formatDateLabel(confirmState.sourceDate)}</strong>
                  </div>
                  <div>
                    <span>Hedef Gün</span>
                    <strong>{formatDateLabel(confirmState.targetDate)}</strong>
                  </div>
                </div>

                <div className={styles.swapBlock}>
                  <p>Aynı birimde uygun vardiyalar</p>
                  {confirmState.swapCandidates.length === 0 ? (
                    <div className={styles.emptySwapState}>
                      Bu birimde swap yapılabilecek vardiya bulunamadı.
                    </div>
                  ) : (
                    <div className={styles.swapList}>
                      {confirmState.swapCandidates.map((candidate) => (
                        <label key={candidate.id} className={styles.swapOption}>
                          <input
                            type="radio"
                            name="swap_target"
                            value={candidate.id}
                            checked={confirmState.selectedTargetId === candidate.id}
                            onChange={() =>
                              setConfirmState((current) =>
                                current
                                  ? { ...current, selectedTargetId: candidate.id }
                                  : current
                              )
                            }
                          />
                          <span>
                            <strong>{candidate.staffName}</strong>
                            <small>{candidate.shiftType}</small>
                          </span>
                          <em>{candidate.isNobet ? "N" : "M"}</em>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => closeConfirmModal(true)}
                    disabled={isSubmittingMove}
                  >
                    İptal
                  </button>
                  <button
                    type="button"
                    onClick={() => void runMoveAction()}
                    disabled={isSubmittingMove}
                  >
                    Sadece Taşı
                  </button>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => void runSwapAction()}
                    disabled={isSubmittingMove || confirmState.swapCandidates.length === 0}
                  >
                    Yer Değiştir
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </section>
  );
}
