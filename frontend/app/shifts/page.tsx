"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

const statusLabelTr: Record<string, string> = {
  planned: "PlanlandÄ±",
  approved: "OnaylandÄ±",
  cancelled: "Ä°ptal",
};

const statusColors: Record<string, { bg: string; text: string }> = {
  planned: { bg: "#FEF3C7", text: "#D97706" },
  approved: { bg: "#ECFDF5", text: "#059669" },
  cancelled: { bg: "#FEF2F2", text: "#DC2626" },
};

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
  const [newAssignment, setNewAssignment] = useState({
    departmentId: "",
    staffProfileId: "",
    shiftTypeId: "",
    assignmentDate: "",
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
      setError(err instanceof Error ? err.message : "Vardiya listesi alÄ±namadÄ±.");
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
      setError(err instanceof Error ? err.message : "Toplu iÅŸlem tamamlanamadÄ±.");
    } finally {
      setSavingBulk(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/assignments/${id}/`);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Silme iÅŸlemi baÅŸarÄ±sÄ±z.");
    }
  };

  const selectedDeptName = useMemo(() => {
    if (!departmentFilter) return "TÃ¼mÃ¼";
    const d = departments.find((dep) => String(dep.id) === departmentFilter);
    return d ? d.name : "TÃ¼mÃ¼";
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

    return `${matchedRow.staffProfileName} iÃ§in ${matchedRow.assignmentDate} tarihinde zaten ${matchedRow.shiftTypeName} vardiyasÄ± var.`;
  }, [
    newAssignment.assignmentDate,
    newAssignment.staffProfileId,
    rows,
    staffOptions,
  ]);

  const resetCreateForm = useCallback(() => {
    setNewAssignment({
      departmentId: departmentFilter || (departments[0] ? String(departments[0].id) : ""),
      staffProfileId: "",
      shiftTypeId: "",
      assignmentDate: startDate || "",
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
  };

  const handleCreateAssignment = async () => {
    if (
      !newAssignment.departmentId ||
      !newAssignment.staffProfileId ||
      !newAssignment.shiftTypeId ||
      !newAssignment.assignmentDate
    ) {
      setError("Yeni vardiya iÃ§in birim, personel, vardiya tipi ve tarih seÃ§ilmelidir.");
      return;
    }

    setCreating(true);
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
      closeCreateModal();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yeni vardiya oluÅŸturulamadÄ±.");
      setCreating(false);
    }
  };

  const handleExcelExport = () => {
    void (async () => {
      if (!departmentFilter) {
        setError("Referans Excel cikti icin once birim secmelisiniz.");
        return;
      }
      if (rows.length === 0) {
        setError("Excel ciktisi icin once listelenecek vardiya kaydi olmalidir.");
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
          let message = "Excel ciktisi olusturulamadi.";
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
        setError(err instanceof Error ? err.message : "Excel ciktisi olusturulamadi.");
      }
    })();
  };

  return (
    <main style={styles.main}>
      {/* â”€â”€ STAT CARDS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section style={styles.statsRow}>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Toplam KayÄ±t</p>
          <p style={styles.statValue}>{counts.total}</p>
          <p style={styles.statDesc}>Filtreye uyan vardiya satÄ±rÄ±</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>SeÃ§ili Birim</p>
          <p style={{ ...styles.statValue, fontSize: 22 }}>{selectedDeptName}</p>
          <p style={styles.statDesc}>Birim kapsamÄ±</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Durum</p>
          <p style={{ ...styles.statValue, fontSize: 22 }}>
            {statusFilter ? statusLabelTr[statusFilter] || statusFilter : "TÃ¼mÃ¼"}
          </p>
          <p style={styles.statDesc}>Aktif filtre durumu</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Tarih AralÄ±ÄŸÄ±</p>
          <p style={{ ...styles.statValue, fontSize: 22 }}>
            {startDate || endDate ? `${startDate || "..."} â€“ ${endDate || "..."}` : "Serbest"}
          </p>
          <p style={styles.statDesc}>BaÅŸlangÄ±Ã§ / BitiÅŸ filtresi</p>
        </div>
      </section>

      {/* â”€â”€ FILTER AREA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Filtreleme AlanÄ±</h2>
        <div style={styles.filterGrid}>
          <label style={styles.filterLabel}>
            <span style={styles.filterLabelText}>Birim</span>
            <select
              style={styles.filterInput}
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="">TÃ¼mÃ¼</option>
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
              style={styles.filterInput}
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as typeof statusFilter)
              }
            >
              <option value="">TÃ¼mÃ¼</option>
              <option value="planned">Taslak</option>
              <option value="approved">OnaylÄ±</option>
              <option value="cancelled">Ä°ptal</option>
            </select>
          </label>
          <label style={styles.filterLabel}>
            <span style={styles.filterLabelText}>BaÅŸlangÄ±Ã§ Tarihi</span>
            <input
              type="date"
              style={styles.filterInput}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label style={styles.filterLabel}>
            <span style={styles.filterLabelText}>BitiÅŸ Tarihi</span>
            <input
              type="date"
              style={styles.filterInput}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              type="button"
              onClick={() => void load()}
              style={styles.filterButton}
            >
              Filtrele
            </button>
          </div>
        </div>
      </section>

      {/* â”€â”€ BULK ACTIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section style={styles.card}>
        <div style={styles.bulkHeader}>
          <h2 style={styles.sectionTitle}>Toplu Ä°ÅŸlemler</h2>
          <span style={styles.filterNote}>GeÃ§erli filtreler korunur.</span>
        </div>
        <div style={styles.bulkRow}>
          <button
            type="button"
            onClick={() => void performBulk("approve")}
            disabled={savingBulk !== null}
            style={styles.bulkApprove}
          >
            âœ“ TaslaklarÄ± Onayla
          </button>
          <button
            type="button"
            onClick={() => void performBulk("delete")}
            disabled={savingBulk !== null}
            style={styles.bulkDelete}
          >
            âœ— Temizle
          </button>
          <button type="button" style={styles.bulkExcel} onClick={handleExcelExport}>
            â†“ Excel Ã‡Ä±ktÄ±sÄ±
          </button>
          <button type="button" style={styles.bulkNew} onClick={openCreateModal}>
            + Yeni Vardiya
          </button>
        </div>
      </section>

      {error && (
        <p style={{ color: "#dc2626", fontSize: 13, margin: "8px 0" }}>{error}</p>
      )}

      {/* â”€â”€ TABLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section style={styles.tableSection}>
        {loading && (
          <p style={{ padding: 20, color: "#64748b" }}>YÃ¼kleniyor...</p>
        )}

        {!loading && (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Tarih</th>
                  <th style={styles.th}>Personel</th>
                  <th style={styles.th}>Birim</th>
                  <th style={styles.th}>Vardiya</th>
                  <th style={styles.th}>BaÅŸlangÄ±Ã§</th>
                  <th style={styles.th}>BitiÅŸ</th>
                  <th style={styles.th}>Durum</th>
                  <th style={{ ...styles.th, textAlign: "center" }}>Ä°ÅŸlem</th>
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
                      SeÃ§ili filtrelere uygun vardiya kaydÄ± bulunamadÄ±.
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
                              Plan gÃ¼nÃ¼
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
                              BaÅŸlangÄ±Ã§ zamanÄ±
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
                              BitiÅŸ zamanÄ±
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
                              âœ DÃ¼zenle
                            </button>
                            <button
                              type="button"
                              style={styles.deleteBtn}
                              onClick={() => void handleDelete(row.id)}
                            >
                              ğŸ—‘ Sil
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
              <button type="button" style={styles.modalClose} onClick={closeCreateModal} aria-label="Modalı kapat">
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
                  />
                </span>
              </label>

              <label style={styles.modalField}>
                <span>Vardiya Tipi</span>
                <span style={styles.modalInputShell}>
                  <Tag size={17} />
                  <select
                    style={styles.modalSelect}
                    value={newAssignment.shiftTypeId}
                    onChange={(event) =>
                      setNewAssignment((previous) => ({
                        ...previous,
                        shiftTypeId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Vardiya tipi seçin</option>
                    {shiftTypeOptions.map((shiftType) => (
                      <option key={shiftType.id} value={String(shiftType.id)}>
                        {shiftType.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={17} />
                </span>
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
                  <span style={styles.modalInputShell}>
                    <CalendarDays size={17} />
                    <input
                      type="date"
                      style={styles.modalInput}
                      value={newAssignment.assignmentDate}
                      onChange={(event) =>
                        setNewAssignment((previous) => ({
                          ...previous,
                          assignmentDate: event.target.value,
                        }))
                      }
                    />
                  </span>
                </label>

                <label style={styles.modalField}>
                  <span>Başlangıç Saati</span>
                  <span style={styles.modalInputShell}>
                    <Clock size={17} />
                    <select defaultValue="08:00" style={styles.modalSelect}>
                      <option>08:00</option>
                      <option>12:00</option>
                      <option>16:00</option>
                      <option>20:00</option>
                      <option>22:00</option>
                    </select>
                    <ChevronDown size={17} />
                  </span>
                </label>

                <label style={styles.modalField}>
                  <span>Bitiş Saati</span>
                  <span style={styles.modalInputShell}>
                    <Clock size={17} />
                    <select defaultValue="16:00" style={styles.modalSelect}>
                      <option>16:00</option>
                      <option>20:00</option>
                      <option>00:00</option>
                      <option>06:00</option>
                      <option>08:00</option>
                    </select>
                    <ChevronDown size={17} />
                  </span>
                </label>
              </div>

              <label style={styles.nightShiftRow}>
                <div style={styles.nightShiftText}>
                  <Moon size={22} />
                  <div>
                    <strong style={styles.nightShiftTitle}>Gece vardiyası</strong>
                    <span style={styles.nightShiftDesc}>Vardiya 22:00 - 06:00 saatleri arasında</span>
                  </div>
                </div>
                <input type="checkbox" style={styles.hiddenCheckbox} />
                <span style={styles.modalSwitch}>
                  <span style={styles.modalSwitchKnob} />
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
              <span style={styles.modalInputShell}>
                <UserRound size={17} />
                <select
                  style={styles.modalSelect}
                  value={newAssignment.staffProfileId}
                  onChange={(event) =>
                    setNewAssignment((previous) => ({
                      ...previous,
                      staffProfileId: event.target.value,
                    }))
                  }
                >
                  <option value="">Personel seçin</option>
                  {filteredStaffOptions.map((staff) => (
                    <option key={staff.id} value={String(staff.id)}>
                      {staff.fullName}
                    </option>
                  ))}
                </select>
                <ChevronDown size={17} />
              </span>
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
              <button type="button" style={styles.modalSecondaryButton} onClick={closeCreateModal}>
                İptal
              </button>
              <button
                type="button"
                style={styles.modalPrimaryButton}
                onClick={() => void handleCreateAssignment()}
                disabled={creating}
              >
                <Check size={17} />
                {creating ? "Kaydediliyor..." : "Vardiyayı Kaydet"}
              </button>
            </div>
          </section>
        </div>
      )}    </main>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   INLINE STYLES
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

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

  /* â”€â”€ stats row â”€â”€ */
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

  /* â”€â”€ card â”€â”€ */
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

  /* â”€â”€ filter grid â”€â”€ */
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
  filterButton: {
    height: 42,
    padding: "0 28px",
    fontSize: 14,
    fontWeight: 700,
    color: "#ffffff",
    background: "linear-gradient(135deg, #4A6CF7 0%, #3B5BDB 100%)",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(74,108,247,0.35)",
    whiteSpace: "nowrap" as const,
  },

  /* â”€â”€ bulk â”€â”€ */
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

  /* â”€â”€ table â”€â”€ */
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
    fontWeight: 850,
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
    fontWeight: 800,
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
    fontWeight: 800,
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
    fontWeight: 800,
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
    fontWeight: 850,
    cursor: "pointer",
    boxShadow: "0 14px 24px rgba(35,75,220,0.24)",
  },};
