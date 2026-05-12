"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  FileText,
  Moon,
  Tag,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { apiClient } from "@/lib/api";

type ShiftRow = {
  id: number;
  assignmentDate: string;
  status: string;
  staffProfileName: string;
  shiftTypeName: string;
  departmentName: string;
  shiftColor: string;
  startTime: string;
  endTime: string;
};

type Department = {
  id: number;
  name: string;
};

type StaffOption = {
  id: number;
  fullName: string;
  departmentName: string | null;
};

type ShiftTypeOption = {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  color: string;
};

type CreateField =
  | "departmentId"
  | "staffProfileId"
  | "shiftTypeId"
  | "assignmentDate"
  | "startTime"
  | "endTime";

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
  hasError?: boolean;
  onChange: (value: string) => void;
};

const statusLabelTr: Record<string, string> = {
  planned: "Planlandı",
  approved: "Onaylandı",
  cancelled: "İptal",
};

const statusColors: Record<string, { bg: string; text: string }> = {
  planned: { bg: "#FEF3C7", text: "#D97706" },
  approved: { bg: "#ECFDF5", text: "#059669" },
  cancelled: { bg: "#FEF2F2", text: "#DC2626" },
};

const timeOptions: DropdownOption[] = ["00:00", "06:00", "08:00", "12:00", "16:00", "20:00", "22:00"].map(
  (time) => ({ value: time, label: time })
);

function formatDateTr(iso: string) {
  try {
    const d = new Date(`${iso}T12:00:00`);
    return d.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function ModalDropdown({
  value,
  placeholder,
  options,
  icon,
  hasError = false,
  onChange,
}: ModalDropdownProps) {
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
        className="shift-modal-button shift-modal-dropdown-trigger"
        style={{
          ...styles.modalDropdownButton,
          ...(hasError ? styles.modalInputShellError : {}),
        }}
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
                className="shift-modal-dropdown-option"
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
                  {option.description ? (
                    <small style={styles.modalDropdownItemDesc}>{option.description}</small>
                  ) : null}
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

export default function ShiftsPage() {
  const [rows, setRows] = useState<ShiftRow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [shiftTypeOptions, setShiftTypeOptions] = useState<ShiftTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"" | "planned" | "approved" | "cancelled">("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [savingBulk, setSavingBulk] = useState<"approve" | "delete" | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createErrorFields, setCreateErrorFields] = useState<CreateField[]>([]);
  const [newAssignment, setNewAssignment] = useState({
    shiftName: "",
    departmentId: "",
    staffProfileId: "",
    shiftTypeId: "",
    assignmentDate: "",
    startTime: "08:00",
    endTime: "16:00",
    isNightShift: false,
    status: "planned",
    notes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (statusFilter) query.set("status", statusFilter);
      if (departmentFilter) query.set("department", departmentFilter);
      if (startDate) query.set("date_from", startDate);
      if (endDate) query.set("date_to", endDate);

      const suffix = query.toString();
      const [assignmentResponse, departmentResponse, staffResponse, shiftTypeResponse] = await Promise.all([
        apiClient.get<{ assignments: ShiftRow[] }>(
          suffix.length > 0 ? `/assignments/?${suffix}` : "/assignments/"
        ),
        apiClient.get<Department[]>("/departments/"),
        apiClient.get<{ staff: StaffOption[] }>("/staff/"),
        apiClient.get<{ shiftTypes: ShiftTypeOption[] }>("/shift-types/"),
      ]);

      setRows(assignmentResponse.assignments);
      setDepartments(departmentResponse);
      setStaffOptions(staffResponse.staff);
      setShiftTypeOptions(shiftTypeResponse.shiftTypes);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Vardiya listesi alınamadı.");
    } finally {
      setLoading(false);
    }
  }, [departmentFilter, endDate, startDate, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.total += 1;
        if (row.status === "planned") acc.planned += 1;
        else if (row.status === "approved") acc.approved += 1;
        else if (row.status === "cancelled") acc.cancelled += 1;
        return acc;
      },
      { total: 0, planned: 0, approved: 0, cancelled: 0 }
    );
  }, [rows]);

  const performBulk = async (action: "approve" | "delete") => {
    const payload = {
      departmentId: departmentFilter || undefined,
      status: statusFilter || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };
    setSavingBulk(action);
    try {
      if (action === "approve") {
        await apiClient.post("/approve/", payload);
      } else {
        await apiClient.post("/delete-filtered/", payload);
      }
      await load();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Toplu işlem tamamlanamadı.");
    } finally {
      setSavingBulk(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/assignments/${id}/`);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Silme işlemi başarısız.");
    }
  };

  const selectedDeptName = useMemo(() => {
    if (!departmentFilter) return "Tümü";
    const d = departments.find((dep) => String(dep.id) === departmentFilter);
    return d ? d.name : "Tümü";
  }, [departmentFilter, departments]);

  const filteredStaffOptions = useMemo(() => {
    if (!newAssignment.departmentId) {
      return staffOptions;
    }
    const selectedDepartment = departments.find(
      (department) => String(department.id) === newAssignment.departmentId
    );
    if (!selectedDepartment) {
      return staffOptions;
    }
    return staffOptions.filter(
      (staff) => staff.departmentName === selectedDepartment.name
    );
  }, [departments, newAssignment.departmentId, staffOptions]);

  const duplicateAssignmentWarning = useMemo(() => {
    if (!newAssignment.staffProfileId || !newAssignment.assignmentDate) {
      return null;
    }

    const matchedRow = rows.find((row) => {
      const matchedStaff = staffOptions.find(
        (staff) =>
          String(staff.id) === newAssignment.staffProfileId &&
          staff.fullName === row.staffProfileName
      );
      return Boolean(
        matchedStaff && row.assignmentDate === newAssignment.assignmentDate
      );
    });

    if (!matchedRow) {
      return null;
    }

    return `${matchedRow.staffProfileName} için ${matchedRow.assignmentDate} tarihinde zaten ${matchedRow.shiftTypeName} vardiyası var.`;
  }, [
    newAssignment.assignmentDate,
    newAssignment.staffProfileId,
    rows,
    staffOptions,
  ]);

  const hasCreateFieldError = useCallback(
    (field: CreateField) => createErrorFields.includes(field),
    [createErrorFields]
  );

  const clearCreateFieldError = useCallback((field: CreateField) => {
    setCreateErrorFields((previous) => previous.filter((item) => item !== field));
  }, []);

  const shiftTypeDropdownOptions = useMemo<DropdownOption[]>(
    () =>
      shiftTypeOptions.map((shiftType) => ({
        value: String(shiftType.id),
        label: shiftType.name,
        description: `${shiftType.startTime} - ${shiftType.endTime}`,
      })),
    [shiftTypeOptions]
  );

  const staffDropdownOptions = useMemo<DropdownOption[]>(
    () =>
      filteredStaffOptions.map((staff) => ({
        value: String(staff.id),
        label: staff.fullName,
        description: staff.departmentName || "Birim bilgisi yok",
      })),
    [filteredStaffOptions]
  );

  const resetCreateForm = useCallback(() => {
    setCreateSuccess(false);
    setCreateErrorFields([]);
    setNewAssignment({
      shiftName: "",
      departmentId: departmentFilter || (departments[0] ? String(departments[0].id) : ""),
      staffProfileId: "",
      shiftTypeId: "",
      assignmentDate: startDate || "",
      startTime: "08:00",
      endTime: "16:00",
      isNightShift: false,
      status: "planned",
      notes: "",
    });
  }, [departmentFilter, departments, startDate]);

  const openCreateModal = () => {
    resetCreateForm();
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreating(false);
    setCreateSuccess(false);
    setCreateErrorFields([]);
  };

  const handleCreateAssignment = async () => {
    const missingFields = [
      !newAssignment.departmentId ? "departmentId" : null,
      !newAssignment.staffProfileId ? "staffProfileId" : null,
      !newAssignment.shiftTypeId ? "shiftTypeId" : null,
      !newAssignment.assignmentDate ? "assignmentDate" : null,
      !newAssignment.startTime ? "startTime" : null,
      !newAssignment.endTime ? "endTime" : null,
    ].filter(Boolean) as CreateField[];

    if (missingFields.length > 0) {
      setCreateSuccess(false);
      setCreateErrorFields(missingFields);
      return;
    }

    setCreating(true);
    setCreateErrorFields([]);
    setCreateSuccess(false);
    try {
      await apiClient.post("/assignments/", {
        departmentId: Number(newAssignment.departmentId),
        staffProfileId: Number(newAssignment.staffProfileId),
        shiftTypeId: Number(newAssignment.shiftTypeId),
        assignmentDate: newAssignment.assignmentDate,
        status: newAssignment.status,
        notes: newAssignment.notes.trim() || undefined,
      });
      await load();
      setError(null);
      setCreateSuccess(true);
      window.setTimeout(() => {
        closeCreateModal();
      }, 850);
    } catch (err) {
      setCreateSuccess(false);
      setError(err instanceof Error ? err.message : "Yeni vardiya oluşturulamadı.");
      setCreating(false);
    }
  };

  const handleExcelExport = () => {
    void (async () => {
      if (!departmentFilter) {
        setError("Referans Excel çıktısı için önce birim seçmelisiniz.");
        return;
      }
      if (rows.length === 0) {
        setError("Excel çıktısı için önce listelenecek vardiya kaydı olmalıdır.");
        return;
      }

      try {
        const params = new URLSearchParams({ department: departmentFilter });
        if (statusFilter) params.set("status", statusFilter);
        if (startDate) params.set("date_from", startDate);
        if (endDate) params.set("date_to", endDate);

        const apiBaseUrl =
          process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
        const response = await fetch(
          `${apiBaseUrl}/assignments/export-template/?${params.toString()}`,
          { credentials: "include" }
        );

        if (!response.ok) {
          let message = "Excel çıktısı oluşturulamadı.";
          try {
            const payload = (await response.json()) as { detail?: string };
            if (payload?.detail) {
              message = payload.detail;
            }
          } catch {
            // keep generic message
          }
          throw new Error(message);
        }

        const blob = await response.blob();
        const disposition = response.headers.get("Content-Disposition") ?? "";
        const matchedName = disposition.match(/filename="?([^"]+)"?/i);
        const fileName =
          matchedName?.[1] ?? `vardiya-cizelgesi-${new Date().toISOString().slice(0, 10)}.xlsx`;

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Excel çıktısı oluşturulamadı.");
      }
    })();
  };

  return (
    <>
    <style
      dangerouslySetInnerHTML={{
        __html: `
          @keyframes shiftDropdownIn {
            from {
              opacity: 0;
              transform: translateY(-6px) scale(0.98);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          .shift-modal-button {
            transform: translateY(0) scale(1);
            transition:
              transform 160ms ease,
              filter 160ms ease,
              box-shadow 160ms ease,
              border-color 160ms ease,
              background 160ms ease;
          }

          .shift-modal-button:hover:not(:disabled) {
            transform: translateY(-1px);
            filter: brightness(1.02);
            box-shadow: 0 14px 28px rgba(37, 86, 232, 0.16) !important;
          }

          .shift-modal-button:active:not(:disabled) {
            transform: translateY(0) scale(0.985);
            filter: brightness(0.98);
          }

          .shift-modal-button:disabled {
            cursor: not-allowed;
            opacity: 0.82;
          }

          .shift-modal-dropdown-trigger:hover {
            border-color: #9db5ff !important;
            background: #fbfdff !important;
          }

          .shift-modal-dropdown-trigger:hover span:last-child {
            background: #e9efff !important;
          }

          .shift-modal-dropdown-option:hover {
            background: linear-gradient(135deg, #f1f6ff 0%, #ffffff 100%) !important;
            color: #2456e8 !important;
            transform: translateX(2px);
          }

          .shift-modal-dropdown-option:active {
            transform: translateX(1px) scale(0.99);
          }

          .shift-modal-toggle-row {
            transition:
              background 180ms ease,
              border-color 180ms ease,
              box-shadow 180ms ease,
              transform 180ms ease;
          }

          .shift-modal-toggle-row:hover {
            transform: translateY(-1px);
            border-color: #aebfff !important;
            background: #fbfdff !important;
            box-shadow: 0 14px 28px rgba(49, 95, 232, 0.10);
          }

          .shift-modal-toggle-row:active {
            transform: scale(0.995);
          }

          .shift-modal-toggle-track {
            transition:
              background 240ms cubic-bezier(0.2, 0.8, 0.2, 1),
              box-shadow 240ms ease,
              transform 180ms ease;
          }

          .shift-modal-toggle-row:hover .shift-modal-toggle-track {
            box-shadow: 0 0 0 5px rgba(49, 95, 232, 0.12);
          }

          .shift-modal-toggle-knob {
            transition:
              transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 220ms ease;
          }

          .shift-modal-toggle-row:hover .shift-modal-toggle-knob {
            box-shadow: 0 5px 14px rgba(15, 23, 42, 0.26) !important;
          }

          .shift-filter-control {
            transition:
              transform 160ms ease,
              border-color 160ms ease,
              box-shadow 160ms ease,
              background 160ms ease,
              color 160ms ease;
          }

          .shift-filter-control:hover {
            transform: translateY(-1px);
            border-color: #a8bbff !important;
            background: linear-gradient(135deg, #ffffff 0%, #f6f9ff 100%) !important;
            box-shadow: 0 10px 24px rgba(37, 99, 235, 0.10) !important;
          }

          .shift-filter-control:focus {
            border-color: #4f73ff !important;
            box-shadow:
              0 0 0 4px rgba(79, 115, 255, 0.14),
              0 12px 28px rgba(37, 99, 235, 0.12) !important;
          }

          .shift-filter-control:active {
            transform: translateY(0) scale(0.985);
            background: #eef4ff !important;
          }
        `,
      }}
    />
    <main style={styles.main}>
      {/* ── STAT CARDS ─────────────────────────────────── */}
      <section style={styles.statsRow}>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Toplam Kayıt</p>
          <p style={styles.statValue}>{counts.total}</p>
          <p style={styles.statDesc}>Filtreye uyan vardiya satırı</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Seçili Birim</p>
          <p style={{ ...styles.statValue, fontSize: 22 }}>{selectedDeptName}</p>
          <p style={styles.statDesc}>Birim kapsamı</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Durum</p>
          <p style={{ ...styles.statValue, fontSize: 22 }}>
            {statusFilter ? statusLabelTr[statusFilter] || statusFilter : "Tümü"}
          </p>
          <p style={styles.statDesc}>Aktif filtre durumu</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Tarih Aralığı</p>
          <p style={{ ...styles.statValue, fontSize: 22 }}>
            {startDate || endDate ? `${startDate || "..."} – ${endDate || "..."}` : "Serbest"}
          </p>
          <p style={styles.statDesc}>Başlangıç / Bitiş filtresi</p>
        </div>
      </section>

      {/* ── FILTER AREA ────────────────────────────────── */}
      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Filtreleme Alanı</h2>
        <div style={styles.filterGrid}>
          <label style={styles.filterLabel}>
            <span style={styles.filterLabelText}>Birim</span>
            <select
              className="shift-filter-control"
              style={styles.filterInput}
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="">Tümü</option>
              {departments.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label style={styles.filterLabel}>
            <span style={styles.filterLabelText}>Durum</span>
            <select
              className="shift-filter-control"
              style={styles.filterInput}
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as typeof statusFilter)
              }
            >
              <option value="">Tümü</option>
              <option value="planned">Taslak</option>
              <option value="approved">Onaylı</option>
              <option value="cancelled">İptal</option>
            </select>
          </label>
          <label style={styles.filterLabel}>
            <span style={styles.filterLabelText}>Başlangıç Tarihi</span>
            <input
              className="shift-filter-control"
              type="date"
              style={styles.filterInput}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label style={styles.filterLabel}>
            <span style={styles.filterLabelText}>Bitiş Tarihi</span>
            <input
              className="shift-filter-control"
              type="date"
              style={styles.filterInput}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              type="button"
              className="shift-filter-control"
              onClick={() => void load()}
              style={styles.filterButton}
            >
              Filtrele
            </button>
          </div>
        </div>
      </section>

      {/* ── BULK ACTIONS ───────────────────────────────── */}
      <section style={styles.card}>
        <div style={styles.bulkHeader}>
          <h2 style={styles.sectionTitle}>Toplu İşlemler</h2>
          <span style={styles.filterNote}>Geçerli filtreler korunur.</span>
        </div>
        <div style={styles.bulkRow}>
          <button
            type="button"
            onClick={() => void performBulk("approve")}
            disabled={savingBulk !== null}
            style={styles.bulkApprove}
          >
            ✓ Taslakları Onayla
          </button>
          <button
            type="button"
            onClick={() => void performBulk("delete")}
            disabled={savingBulk !== null}
            style={styles.bulkDelete}
          >
            ✗ Temizle
          </button>
          <button type="button" style={styles.bulkExcel} onClick={handleExcelExport}>
            ↓ Excel Çıktısı
          </button>
          <button type="button" style={styles.bulkNew} onClick={openCreateModal}>
            + Yeni Vardiya
          </button>
        </div>
      </section>

      {error && (
        <p style={{ color: "#dc2626", fontSize: 13, margin: "8px 0" }}>{error}</p>
      )}

      {/* ── TABLE ───────────────────────────────────────── */}
      <section style={styles.tableSection}>
        {loading && (
          <p style={{ padding: 20, color: "#64748b" }}>Yükleniyor...</p>
        )}

        {!loading && (
          <>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Tarih</th>
                  <th style={styles.th}>Personel</th>
                  <th style={styles.th}>Birim</th>
                  <th style={styles.th}>Vardiya</th>
                  <th style={styles.th}>Başlangıç</th>
                  <th style={styles.th}>Bitiş</th>
                  <th style={styles.th}>Durum</th>
                  <th style={{ ...styles.th, textAlign: "center" }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        ...styles.td,
                        textAlign: "center",
                        color: "#94a3b8",
                        padding: "32px 20px",
                      }}
                    >
                      Seçili filtrelere uygun vardiya kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => {
                    const sc = statusColors[row.status] ?? {
                      bg: "#F1F5F9",
                      text: "#475569",
                    };
                    return (
                      <tr
                        key={row.id}
                        style={{
                          ...styles.tableRow,
                          backgroundColor:
                            idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                        }}
                      >
                        <td style={styles.td}>
                          <div>
                            <p style={{ margin: 0, fontWeight: 600, color: "#1e293b", fontSize: 13 }}>
                              {formatDateTr(row.assignmentDate)}
                            </p>
                            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>
                              Plan günü
                            </p>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <span style={{ fontWeight: 600, color: "#1e293b" }}>
                            {row.staffProfileName}
                          </span>
                        </td>
                        <td style={styles.td}>{row.departmentName}</td>
                        <td style={styles.td}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "3px 10px",
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#ffffff",
                              backgroundColor: row.shiftColor || "#6366f1",
                            }}
                          >
                            {row.shiftTypeName}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div>
                            <p style={{ margin: 0, fontSize: 13, color: "#1e293b" }}>
                              {row.startTime
                                ? `${formatDateTr(row.assignmentDate).split(" ").slice(0,3).join(" ")} / ${row.startTime}`
                                : `${formatDateTr(row.assignmentDate)} / 08:00`}
                            </p>
                            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>
                              Başlangıç zamanı
                            </p>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div>
                            <p style={{ margin: 0, fontSize: 13, color: "#1e293b" }}>
                              {row.endTime
                                ? `${formatDateTr(row.assignmentDate).split(" ").slice(0,3).join(" ")} / ${row.endTime}`
                                : `${formatDateTr(row.assignmentDate)} / 08:00`}
                            </p>
                            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>
                              Bitiş zamanı
                            </p>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 12px",
                              fontSize: 12,
                              fontWeight: 700,
                              borderRadius: 20,
                              backgroundColor: sc.bg,
                              color: sc.text,
                            }}
                          >
                            {statusLabelTr[row.status] ?? row.status}
                          </span>
                        </td>
                        <td style={{ ...styles.td, textAlign: "center" }}>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 4,
                              alignItems: "center",
                            }}
                          >
                            <button type="button" style={styles.editBtn}>
                              ✎ Düzenle
                            </button>
                            <button
                              type="button"
                              style={styles.deleteBtn}
                              onClick={() => void handleDelete(row.id)}
                            >
                              🗑 Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              </table>
            </div>
            <footer style={styles.tableFooter}>
              <span>Liste sonu</span>
              <span style={styles.tableFooterCount}>Toplam {rows.length} vardiya</span>
            </footer>
          </>
        )}
      </section>

      {showCreateModal && (
        <div style={styles.modalOverlay} onClick={closeCreateModal}>
          <section
            style={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-shift-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <div style={styles.modalTitleGroup}>
                <span style={styles.modalIconBox}>
                  <CalendarDays size={28} />
                </span>
                <div>
                  <h2 id="new-shift-modal-title" style={styles.modalTitle}>Vardiya Ekle</h2>
                  <p style={styles.modalSubtitle}>Yeni vardiya bilgilerini girerek takviminize ekleyin.</p>
                </div>
              </div>
              <button
                type="button"
                className="shift-modal-button"
                style={styles.modalClose}
                onClick={closeCreateModal}
                aria-label="Modalı kapat"
              >
                <X size={22} />
              </button>
            </div>

            <div style={styles.modalTopGrid}>
              <label style={styles.modalField}>
                <span>Vardiya Adı</span>
                <span style={styles.modalInputShell}>
                  <CalendarDays size={17} />
                  <input
                    type="text"
                    placeholder="Örn: Sabah Vardiyası"
                    style={styles.modalInput}
                    value={newAssignment.shiftName}
                    onChange={(event) =>
                      setNewAssignment((previous) => ({
                        ...previous,
                        shiftName: event.target.value,
                      }))
                    }
                  />
                </span>
              </label>

              <label style={styles.modalField}>
                <span>Vardiya Tipi</span>
                <ModalDropdown
                  value={newAssignment.shiftTypeId}
                  placeholder="Vardiya tipi seçin"
                  options={shiftTypeDropdownOptions}
                  icon={<Tag size={17} />}
                  hasError={hasCreateFieldError("shiftTypeId")}
                  onChange={(value) => {
                    clearCreateFieldError("shiftTypeId");
                    setNewAssignment((previous) => ({
                      ...previous,
                      shiftTypeId: value,
                    }));
                  }}
                />
              </label>
            </div>

            <div style={styles.modalSectionCard}>
              <div style={styles.modalSectionHeader}>
                <CalendarDays size={17} />
                <div>
                  <h3 style={styles.modalSectionTitle}>Tarih ve Süre</h3>
                  <p style={styles.modalSectionText}>Vardiyanın başlayacağı tarih ve saat aralığını belirleyin.</p>
                </div>
              </div>

              <div style={styles.modalThreeGrid}>
                <label style={styles.modalField}>
                  <span>Tarih</span>
                  <span
                    style={{
                      ...styles.modalInputShell,
                      ...(hasCreateFieldError("assignmentDate") ? styles.modalInputShellError : {}),
                    }}
                  >
                    <CalendarDays size={17} />
                    <input
                      type="date"
                      style={styles.modalInput}
                      value={newAssignment.assignmentDate}
                      onChange={(event) => {
                        clearCreateFieldError("assignmentDate");
                        setNewAssignment((previous) => ({
                          ...previous,
                          assignmentDate: event.target.value,
                        }));
                      }}
                    />
                  </span>
                </label>

                <label style={styles.modalField}>
                  <span>Başlangıç Saati</span>
                  <ModalDropdown
                    value={newAssignment.startTime}
                    placeholder="Başlangıç saati seçin"
                    options={timeOptions}
                    icon={<Clock size={17} />}
                    hasError={hasCreateFieldError("startTime")}
                    onChange={(value) => {
                      clearCreateFieldError("startTime");
                      setNewAssignment((previous) => ({
                        ...previous,
                        startTime: value,
                      }));
                    }}
                  />
                </label>

                <label style={styles.modalField}>
                  <span>Bitiş Saati</span>
                  <ModalDropdown
                    value={newAssignment.endTime}
                    placeholder="Bitiş saati seçin"
                    options={timeOptions}
                    icon={<Clock size={17} />}
                    hasError={hasCreateFieldError("endTime")}
                    onChange={(value) => {
                      clearCreateFieldError("endTime");
                      setNewAssignment((previous) => ({
                        ...previous,
                        endTime: value,
                      }));
                    }}
                  />
                </label>
              </div>

              <label className="shift-modal-toggle-row" style={styles.nightShiftRow}>
                <div style={styles.nightShiftText}>
                  <Moon size={22} />
                  <div>
                    <strong style={styles.nightShiftTitle}>Gece vardiyası</strong>
                    <span style={styles.nightShiftDesc}>Vardiya 22:00 - 06:00 saatleri arasında</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={newAssignment.isNightShift}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    clearCreateFieldError("startTime");
                    clearCreateFieldError("endTime");
                    setNewAssignment((previous) => ({
                      ...previous,
                      isNightShift: checked,
                      startTime: checked ? "22:00" : previous.startTime,
                      endTime: checked ? "06:00" : previous.endTime,
                    }));
                  }}
                  style={styles.hiddenCheckbox}
                />
                <span
                  className="shift-modal-toggle-track"
                  style={{
                    ...styles.modalSwitch,
                    background: newAssignment.isNightShift ? "#315fe8" : "#b9c3d8",
                  }}
                >
                  <span
                    className="shift-modal-toggle-knob"
                    style={{
                      ...styles.modalSwitchKnob,
                      transform: newAssignment.isNightShift
                        ? "translateX(20px)"
                        : "translateX(0)",
                    }}
                  />
                </span>
              </label>
            </div>

            <div style={styles.modalSectionCard}>
              <div style={styles.modalSectionHeader}>
                <Users size={17} />
                <div>
                  <h3 style={styles.modalSectionTitle}>Personel Ataması</h3>
                  <p style={styles.modalSectionText}>Vardiyada görev alacak personeli seçin.</p>
                </div>
              </div>
              <ModalDropdown
                value={newAssignment.staffProfileId}
                placeholder="Personel seçin"
                options={staffDropdownOptions}
                icon={<UserRound size={17} />}
                hasError={hasCreateFieldError("staffProfileId")}
                onChange={(value) => {
                  clearCreateFieldError("staffProfileId");
                  setNewAssignment((previous) => ({
                    ...previous,
                    staffProfileId: value,
                  }));
                }}
              />
              <input
                type="hidden"
                value={newAssignment.departmentId}
                onChange={() => undefined}
              />
            </div>

            <div style={styles.modalSectionCard}>
              <div style={styles.modalSectionHeader}>
                <FileText size={17} />
                <div>
                  <h3 style={styles.modalSectionTitle}>Açıklama <span style={styles.modalOptionalText}>(Opsiyonel)</span></h3>
                  <p style={styles.modalSectionText}>Vardiya ile ilgili not veya açıklama ekleyebilirsiniz.</p>
                </div>
              </div>
              <label style={styles.textareaShell}>
                <textarea
                  value={newAssignment.notes}
                  onChange={(event) =>
                    setNewAssignment((previous) => ({
                      ...previous,
                      notes: event.target.value.slice(0, 200),
                    }))
                  }
                  placeholder="Açıklama girin..."
                  style={styles.modalTextarea}
                />
                <span style={styles.textareaCounter}>{newAssignment.notes.length}/200</span>
              </label>
            </div>

            {duplicateAssignmentWarning ? (
              <div style={styles.warningPanel}>
                <span style={styles.warningPanelLabel}>Ön Uyarı</span>
                <strong style={styles.warningPanelValue}>{duplicateAssignmentWarning}</strong>
              </div>
            ) : null}

            <div style={styles.modalActions}>
              <button
                type="button"
                className="shift-modal-button"
                style={styles.modalSecondaryButton}
                onClick={closeCreateModal}
              >
                İptal
              </button>
              <button
                type="button"
                className="shift-modal-button"
                style={{
                  ...styles.modalPrimaryButton,
                  background: createSuccess
                    ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                    : styles.modalPrimaryButton.background,
                  boxShadow: createSuccess
                    ? "0 14px 24px rgba(5,150,105,0.24)"
                    : styles.modalPrimaryButton.boxShadow,
                }}
                onClick={() => void handleCreateAssignment()}
                disabled={creating || createSuccess}
              >
                <Check size={17} />
                {createSuccess ? "Vardiya Kaydedildi" : creating ? "Kaydediliyor..." : "Vardiyayı Kaydet"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
    </>
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

  /* ── stats row ── */
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    background: "#ffffff",
    borderRadius: 16,
    padding: "18px 22px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    borderLeft: "4px solid #4A6CF7",
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
    lineHeight: 1.4,
  },

  /* ── card ── */
  card: {
    background: "#ffffff",
    borderRadius: 16,
    padding: "20px 24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 800,
    color: "#1e293b",
    margin: "0 0 14px 0",
  },

  /* ── filter grid ── */
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(118px, 156px) minmax(118px, 156px) minmax(130px, 168px) minmax(130px, 168px) auto",
    gap: 12,
    alignItems: "end",
  },
  filterLabel: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 5,
    fontSize: 13,
    minWidth: 0,
  },
  filterLabelText: {
    fontSize: 12,
    fontWeight: 700,
    color: "#475569",
  },
  filterInput: {
    height: 38,
    borderRadius: 12,
    border: "1px solid #dbe6f5",
    padding: "0 12px",
    fontSize: 12,
    fontWeight: 700,
    color: "#243754",
    background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
    fontFamily: "inherit",
    outline: "none",
    width: "100%",
    boxShadow: "0 6px 16px rgba(15, 23, 42, 0.04)",
    cursor: "pointer",
  },
  filterButton: {
    height: 38,
    padding: "0 20px",
    fontSize: 12,
    fontWeight: 700,
    color: "#ffffff",
    background: "linear-gradient(135deg, #4A6CF7 0%, #3B5BDB 100%)",
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(74,108,247,0.35)",
    whiteSpace: "nowrap" as const,
  },

  /* ── bulk ── */
  bulkHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  filterNote: {
    fontSize: 12,
    color: "#94a3b8",
    fontStyle: "italic",
  },
  bulkRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 10,
  },
  bulkApprove: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 20px",
    fontSize: 13,
    fontWeight: 700,
    color: "#ffffff",
    background: "#059669",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
  },
  bulkDelete: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 20px",
    fontSize: 13,
    fontWeight: 700,
    color: "#ffffff",
    background: "#DC2626",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
  },
  bulkExcel: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 20px",
    fontSize: 13,
    fontWeight: 700,
    color: "#334155",
    background: "#ffffff",
    border: "1.5px solid #e2e8f0",
    borderRadius: 10,
    cursor: "pointer",
  },
  bulkNew: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 20px",
    fontSize: 13,
    fontWeight: 700,
    color: "#ffffff",
    background: "#1e293b",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
  },

  /* ── table ── */
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
  tableWrap: {
    flex: 1,
    minHeight: 0,
    overflow: "auto" as const,
  },
  tableFooter: {
    position: "sticky" as const,
    bottom: 0,
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "11px 16px",
    borderTop: "1px solid #e2e8f0",
    background: "rgba(255,255,255,0.96)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 -10px 24px -18px rgba(15,23,42,0.35)",
    fontSize: 12,
    fontWeight: 700,
    color: "#64748b",
  },
  tableFooterCount: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 26,
    padding: "0 12px",
    borderRadius: 999,
    background: "#eff6ff",
    color: "#2563eb",
    fontSize: 12,
    fontWeight: 800,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
  },
  th: {
    padding: "12px 16px",
    fontSize: 12,
    fontWeight: 700,
    color: "#64748b",
    textAlign: "left" as const,
    borderBottom: "1px solid #e2e8f0",
    background: "#f8fafc",
    whiteSpace: "nowrap" as const,
  },
  td: {
    padding: "14px 16px",
    fontSize: 13,
    color: "#334155",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "middle" as const,
  },
  tableRow: {
    transition: "background 0.15s ease",
  },
  editBtn: {
    padding: "5px 12px",
    fontSize: 12,
    fontWeight: 700,
    color: "#059669",
    background: "transparent",
    border: "none",
    cursor: "pointer",
  },
  deleteBtn: {
    padding: "5px 12px",
    fontSize: 12,
    fontWeight: 700,
    color: "#DC2626",
    background: "transparent",
    border: "none",
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed" as const,
    inset: 0,
    zIndex: 80,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(38, 55, 104, 0.48)",
    backdropFilter: "blur(9px)",
    padding: 34,
  },
  modalCard: {
    width: "min(1040px, calc(100vw - 68px))",
    maxHeight: "calc(100vh - 68px)",
    overflowY: "auto" as const,
    display: "flex",
    flexDirection: "column" as const,
    background: "rgba(255,255,255,0.98)",
    borderRadius: 12,
    border: "1px solid rgba(218, 226, 244, 0.95)",
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
    fontWeight: 700,
    letterSpacing: "-0.035em",
    color: "#101a3c",
  },
  modalSubtitle: {
    margin: "9px 0 0",
    fontSize: 13,
    fontWeight: 600,
    color: "#61708f",
    lineHeight: 1.45,
  },
  modalClose: {
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
  modalTopGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
    padding: "0 34px 22px",
  },
  modalField: {
    display: "grid",
    gap: 10,
    fontSize: 13,
    fontWeight: 700,
    color: "#101a3c",
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
  modalInputShellError: {
    border: "1px solid #fb7185",
    background: "#fff1f2",
    boxShadow: "0 0 0 3px rgba(251,113,133,0.12)",
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
    zIndex: 140,
    maxHeight: 228,
    overflowY: "auto" as const,
    padding: 6,
    border: "1px solid rgba(181,195,221,0.86)",
    borderRadius: 10,
    background: "rgba(255,255,255,0.98)",
    boxShadow: "0 22px 50px rgba(34,53,104,0.18)",
    animation: "shiftDropdownIn 160ms ease-out",
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
    transition: "background 140ms ease, color 140ms ease",
  },
  modalDropdownItemActive: {
    background: "linear-gradient(135deg, #eef4ff 0%, #f7faff 100%)",
    color: "#2456e8",
  },
  modalDropdownItemTitle: {
    display: "block",
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  modalDropdownItemDesc: {
    display: "block",
    marginTop: 4,
    fontSize: 11,
    fontWeight: 650,
    color: "#74829f",
  },
  modalSectionCard: {
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
    fontWeight: 700,
    color: "#101a3c",
  },
  modalSectionText: {
    margin: "8px 0 0",
    fontSize: 12,
    lineHeight: 1.4,
    fontWeight: 600,
    color: "#61708f",
  },
  modalOptionalText: {
    fontWeight: 700,
    color: "#6b7893",
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
    fontWeight: 700,
    color: "#101a3c",
  },
  nightShiftDesc: {
    display: "block",
    marginTop: 5,
    fontSize: 11,
    fontWeight: 650,
    color: "#61708f",
  },
  hiddenCheckbox: {
    position: "absolute",
    opacity: 0,
    pointerEvents: "none",
  },
  modalSwitch: {
    width: 42,
    height: 24,
    display: "inline-flex",
    alignItems: "center",
    padding: 2,
    borderRadius: 999,
    background: "#b9c3d8",
  },
  modalSwitchKnob: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "#ffffff",
    boxShadow: "0 2px 8px rgba(15,23,42,0.22)",
  },
  textareaShell: {
    position: "relative",
    display: "block",
  },
  modalTextarea: {
    width: "100%",
    height: 82,
    resize: "none" as const,
    boxSizing: "border-box" as const,
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
    position: "absolute" as const,
    right: 13,
    bottom: 10,
    fontSize: 12,
    fontWeight: 700,
    color: "#7c89a4",
  },
  warningPanel: {
    margin: "0 22px 12px",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    minHeight: 66,
    padding: "12px 16px",
    borderRadius: 10,
    border: "1px solid #fecaca",
    background: "#fff7f7",
  },
  warningPanelLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#b91c1c",
    marginBottom: 4,
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  },
  warningPanelValue: {
    fontSize: 13,
    fontWeight: 750,
    color: "#991b1b",
    lineHeight: 1.45,
  },
  createErrorPanel: {
    margin: "0 22px 12px",
    padding: "14px 16px",
    borderRadius: 10,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#991b1b",
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.45,
  },
  modalActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: "auto",
    padding: "24px 34px 28px",
    borderTop: "1px solid #edf2f8",
    background: "rgba(255,255,255,0.96)",
  },
  modalSecondaryButton: {
    height: 42,
    minWidth: 142,
    border: "1px solid #d4deef",
    borderRadius: 8,
    background: "#ffffff",
    color: "#2456e8",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  modalPrimaryButton: {
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
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 14px 24px rgba(35,75,220,0.24)",
  },};
