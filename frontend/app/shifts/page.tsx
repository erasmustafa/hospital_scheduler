"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  planned: "Planlandı",
  approved: "Onaylandı",
  cancelled: "İptal",
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

  const resetCreateForm = useCallback(() => {
    setNewAssignment({
      departmentId: departmentFilter || "",
      staffProfileId: "",
      shiftTypeId: "",
      assignmentDate: startDate || "",
      status: "planned",
      notes: "",
    });
  }, [departmentFilter, startDate]);

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
      setError("Yeni vardiya için birim, personel, vardiya tipi ve tarih seçilmelidir.");
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
      setError(err instanceof Error ? err.message : "Yeni vardiya oluşturulamadı.");
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
              type="date"
              style={styles.filterInput}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label style={styles.filterLabel}>
            <span style={styles.filterLabelText}>Bitiş Tarihi</span>
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
        )}
      </section>

      {showCreateModal && (
        <div style={styles.modalOverlay} onClick={closeCreateModal}>
          <div style={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>Yeni Vardiya</h2>
                <p style={styles.modalSubtitle}>
                  Yeni bir vardiya kaydı oluşturup listeye ekleyin.
                </p>
              </div>
              <button type="button" style={styles.modalClose} onClick={closeCreateModal}>
                Kapat
              </button>
            </div>

            <div style={styles.modalBody}>
              <label style={styles.filterLabel}>
                <span style={styles.filterLabelText}>Birim</span>
                <select
                  style={styles.filterInput}
                  value={newAssignment.departmentId}
                  onChange={(e) =>
                    setNewAssignment((previous) => ({
                      ...previous,
                      departmentId: e.target.value,
                      staffProfileId: "",
                    }))
                  }
                >
                  <option value="">Seçin</option>
                  {departments.map((department) => (
                    <option key={department.id} value={String(department.id)}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>

              <label style={styles.filterLabel}>
                <span style={styles.filterLabelText}>Personel</span>
                <select
                  style={styles.filterInput}
                  value={newAssignment.staffProfileId}
                  onChange={(e) =>
                    setNewAssignment((previous) => ({
                      ...previous,
                      staffProfileId: e.target.value,
                    }))
                  }
                >
                  <option value="">Seçin</option>
                  {filteredStaffOptions.map((staff) => (
                    <option key={staff.id} value={String(staff.id)}>
                      {staff.fullName}
                    </option>
                  ))}
                </select>
              </label>

              <label style={styles.filterLabel}>
                <span style={styles.filterLabelText}>Vardiya Tipi</span>
                <select
                  style={styles.filterInput}
                  value={newAssignment.shiftTypeId}
                  onChange={(e) =>
                    setNewAssignment((previous) => ({
                      ...previous,
                      shiftTypeId: e.target.value,
                    }))
                  }
                >
                  <option value="">Seçin</option>
                  {shiftTypeOptions.map((shiftType) => (
                    <option key={shiftType.id} value={String(shiftType.id)}>
                      {shiftType.name} ({shiftType.startTime} - {shiftType.endTime})
                    </option>
                  ))}
                </select>
              </label>

              <label style={styles.filterLabel}>
                <span style={styles.filterLabelText}>Tarih</span>
                <input
                  type="date"
                  style={styles.filterInput}
                  value={newAssignment.assignmentDate}
                  onChange={(e) =>
                    setNewAssignment((previous) => ({
                      ...previous,
                      assignmentDate: e.target.value,
                    }))
                  }
                />
              </label>

              {duplicateAssignmentWarning ? (
                <div style={styles.warningPanel}>
                  <span style={styles.warningPanelLabel}>Ön Uyarı</span>
                  <strong style={styles.warningPanelValue}>
                    {duplicateAssignmentWarning}
                  </strong>
                </div>
              ) : null}

              <label style={styles.filterLabel}>
                <span style={styles.filterLabelText}>Durum</span>
                <select
                  style={styles.filterInput}
                  value={newAssignment.status}
                  onChange={(e) =>
                    setNewAssignment((previous) => ({
                      ...previous,
                      status: e.target.value,
                    }))
                  }
                >
                  <option value="planned">Taslak</option>
                  <option value="approved">Onaylı</option>
                  <option value="cancelled">İptal</option>
                </select>
              </label>

              <label style={{ ...styles.filterLabel, gridColumn: "1 / -1" }}>
                <span style={styles.filterLabelText}>Not</span>
                <textarea
                  style={styles.notesInput}
                  value={newAssignment.notes}
                  onChange={(e) =>
                    setNewAssignment((previous) => ({
                      ...previous,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="İsteğe bağlı açıklama"
                />
              </label>
            </div>

            <div style={styles.modalActions}>
              <button type="button" style={styles.modalSecondaryButton} onClick={closeCreateModal}>
                Vazgeç
              </button>
              <button
                type="button"
                style={styles.modalPrimaryButton}
                onClick={() => void handleCreateAssignment()}
                disabled={creating}
              >
                {creating ? "Kaydediliyor..." : "Vardiyayı Oluştur"}
              </button>
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
    backgroundColor: "rgba(15, 23, 42, 0.42)",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 640,
    maxHeight: "min(760px, calc(100vh - 48px))",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column" as const,
    background: "#ffffff",
    borderRadius: 18,
    border: "1px solid #e2e8f0",
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
  },
  modalHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    padding: "22px 24px 16px",
    borderBottom: "1px solid #e2e8f0",
  },
  modalTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 800,
    color: "#1e293b",
  },
  modalSubtitle: {
    margin: "4px 0 0 0",
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.5,
  },
  modalClose: {
    height: 38,
    padding: "0 14px",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    fontSize: 13,
    fontWeight: 700,
    color: "#334155",
    cursor: "pointer",
  },
  modalBody: {
    padding: 24,
    overflowY: "auto" as const,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  notesInput: {
    minHeight: 96,
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    padding: "12px 14px",
    fontSize: 14,
    color: "#334155",
    background: "#ffffff",
    fontFamily: "inherit",
    outline: "none",
    width: "100%",
    resize: "vertical" as const,
    boxSizing: "border-box" as const,
  },
  warningPanel: {
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    minHeight: 84,
    padding: "14px 16px",
    borderRadius: 12,
    border: "1px solid #fecaca",
    background: "#fff7f7",
  },
  warningPanelLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#b91c1c",
    marginBottom: 6,
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  },
  warningPanelValue: {
    fontSize: 14,
    fontWeight: 700,
    color: "#991b1b",
    lineHeight: 1.5,
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    padding: "16px 24px 24px",
    borderTop: "1px solid #e2e8f0",
  },
  modalSecondaryButton: {
    height: 42,
    padding: "0 18px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    fontSize: 14,
    fontWeight: 700,
    color: "#334155",
    cursor: "pointer",
  },
  modalPrimaryButton: {
    height: 42,
    padding: "0 20px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #4A6CF7 0%, #3B5BDB 100%)",
    fontSize: 14,
    fontWeight: 700,
    color: "#ffffff",
    cursor: "pointer",
  },
};
