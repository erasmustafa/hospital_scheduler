"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api";

type ApprovalStatus = "pending" | "approved" | "rejected";

type ApprovalRow = {
  id: number;
  staffProfileName: string;
  departmentName: string;
  shiftTypeName: string | null;
  startDate: string;
  endDate: string;
  requestType: string;
  notes: string;
  approvalStatus: ApprovalStatus;
  createdByName: string;
  reviewedByName: string | null;
  reviewedAt: string | null;
  created_at: string;
};

const requestTypeLabel: Record<string, string> = {
  leave: "İzin",
  unavailable: "Uygun Değil",
  preferred_off: "Çalışmak İstemiyor",
};

const statusLabel: Record<ApprovalStatus, string> = {
  pending: "Bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
};

const statusColor: Record<ApprovalStatus, { bg: string; text: string }> = {
  pending: { bg: "#FEF3C7", text: "#D97706" },
  approved: { bg: "#ECFDF5", text: "#059669" },
  rejected: { bg: "#FEF2F2", text: "#DC2626" },
};

function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  const startLabel = start.toLocaleDateString("tr-TR");
  const endLabel = end.toLocaleDateString("tr-TR");
  return startDate === endDate ? startLabel : `${startLabel} - ${endLabel}`;
}

export default function ApprovalsPage() {
  const [rows, setRows] = useState<ApprovalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"" | ApprovalStatus>("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const suffix = filterType ? `?approvalStatus=${filterType}` : "";
      const data = await apiClient.get<{ availabilityRequests: ApprovalRow[] }>(
        `/availability-requests/${suffix}`
      );
      setRows(data.availabilityRequests);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Talepler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const handleDecision = async (id: number, decision: "approve" | "reject") => {
    setSavingId(id);
    try {
      const response = await apiClient.post<{ request: ApprovalRow }>(
        `/availability-requests/${id}/${decision}/`
      );
      setRows((previous) =>
        previous.map((item) => (item.id === id ? response.request : item))
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem tamamlanamadı.");
    } finally {
      setSavingId(null);
    }
  };

  const filteredRows = useMemo(() => {
    if (!filterType) return rows;
    return rows.filter((row) => row.approvalStatus === filterType);
  }, [filterType, rows]);

  return (
    <main style={styles.main}>
      <h1 style={styles.pageTitle}>İzin ve Uygunluk Talepleri</h1>
      <p style={styles.pageDesc}>
        Personelin talep ettiği izin türlerini ve gün aralıklarını burada
        görüntüleyip onaylayabilir ya da reddedebilirsin.
      </p>

      <div style={styles.filterRow}>
        <select
          value={filterType}
          onChange={(event) => setFilterType(event.target.value as "" | ApprovalStatus)}
          style={styles.filterSelect}
        >
          <option value="">Tüm Talepler</option>
          <option value="pending">Bekleyenler</option>
          <option value="approved">Onaylananlar</option>
          <option value="rejected">Reddedilenler</option>
        </select>
        <button type="button" onClick={() => void loadRequests()} style={styles.filterButton}>
          Yenile
        </button>
      </div>

      {error && <p style={styles.errorText}>{error}</p>}

      <section style={styles.tableSection}>
        {loading ? (
          <p style={styles.loadingText}>Yükleniyor...</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Personel</th>
                  <th style={styles.th}>Birim</th>
                  <th style={styles.th}>Talep Türü</th>
                  <th style={styles.th}>Günler</th>
                  <th style={styles.th}>Vardiya</th>
                  <th style={styles.th}>Not</th>
                  <th style={styles.th}>Oluşturan</th>
                  <th style={styles.th}>Durum</th>
                  <th style={styles.th}>İnceleyen</th>
                  <th style={{ ...styles.th, textAlign: "center" }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={styles.emptyCell}>
                      Gösterilecek izin veya uygunluk talebi bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, index) => {
                    const currentStatus = statusColor[row.approvalStatus];
                    const isPending = row.approvalStatus === "pending";
                    return (
                      <tr
                        key={row.id}
                        style={{
                          ...styles.tableRow,
                          backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8fafc",
                        }}
                      >
                        <td style={styles.td}>
                          <span style={styles.primaryText}>{row.staffProfileName}</span>
                        </td>
                        <td style={styles.td}>{row.departmentName || "-"}</td>
                        <td style={styles.td}>
                          <span style={styles.badge}>
                            {requestTypeLabel[row.requestType] || row.requestType}
                          </span>
                        </td>
                        <td style={styles.td}>{formatDateRange(row.startDate, row.endDate)}</td>
                        <td style={styles.td}>{row.shiftTypeName || "Tüm Gün"}</td>
                        <td style={styles.td}>
                          <span style={styles.secondaryText}>{row.notes || "-"}</span>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.metaCell}>
                            <span>{row.createdByName || "Sistem"}</span>
                            <span style={styles.metaDate}>
                              {row.created_at
                                ? new Date(row.created_at).toLocaleDateString("tr-TR")
                                : "-"}
                            </span>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              backgroundColor: currentStatus.bg,
                              color: currentStatus.text,
                            }}
                          >
                            {statusLabel[row.approvalStatus]}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.metaCell}>
                            <span>{row.reviewedByName || "-"}</span>
                            <span style={styles.metaDate}>
                              {row.reviewedAt
                                ? new Date(row.reviewedAt).toLocaleDateString("tr-TR")
                                : "-"}
                            </span>
                          </div>
                        </td>
                        <td style={{ ...styles.td, textAlign: "center" }}>
                          {isPending ? (
                            <div style={styles.actions}>
                              <button
                                type="button"
                                onClick={() => void handleDecision(row.id, "approve")}
                                disabled={savingId === row.id}
                                style={styles.approveBtn}
                              >
                                Onayla
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDecision(row.id, "reject")}
                                disabled={savingId === row.id}
                                style={styles.rejectBtn}
                              >
                                Reddet
                              </button>
                            </div>
                          ) : (
                            <span style={styles.secondaryText}>İşlem Tamamlandı</span>
                          )}
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
    </main>
  );
}

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
  filterRow: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  filterSelect: {
    width: 240,
    height: 42,
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    padding: "0 14px",
    fontSize: 14,
    color: "#334155",
    background: "#ffffff",
    fontFamily: "inherit",
    cursor: "pointer",
    outline: "none",
  },
  filterButton: {
    padding: "9px 18px",
    fontSize: 13,
    fontWeight: 700,
    color: "#ffffff",
    background: "#0d9488",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
  },
  errorText: {
    padding: "0 0 12px",
    color: "#dc2626",
    fontSize: 13,
  },
  loadingText: {
    padding: 20,
    color: "#64748b",
  },
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
    overflow: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "12px 16px",
    fontSize: 12,
    fontWeight: 700,
    color: "#64748b",
    textAlign: "left",
    borderBottom: "1px solid #e2e8f0",
    background: "#f8fafc",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "12px 16px",
    fontSize: 13,
    color: "#334155",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },
  tableRow: {
    transition: "background 0.15s ease",
  },
  emptyCell: {
    padding: "32px 20px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 13,
  },
  primaryText: {
    fontWeight: 600,
    color: "#1e293b",
  },
  secondaryText: {
    color: "#64748b",
    fontSize: 12,
  },
  badge: {
    display: "inline-block",
    padding: "3px 10px",
    fontSize: 12,
    fontWeight: 700,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
    color: "#4A6CF7",
  },
  statusBadge: {
    display: "inline-block",
    padding: "4px 12px",
    fontSize: 12,
    fontWeight: 700,
    borderRadius: 20,
  },
  metaCell: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  metaDate: {
    color: "#94a3b8",
    fontSize: 12,
  },
  actions: {
    display: "flex",
    gap: 6,
    justifyContent: "center",
  },
  approveBtn: {
    padding: "5px 12px",
    fontSize: 12,
    fontWeight: 700,
    color: "#059669",
    background: "#ECFDF5",
    border: "1px solid #A7F3D0",
    borderRadius: 8,
    cursor: "pointer",
  },
  rejectBtn: {
    padding: "5px 12px",
    fontSize: 12,
    fontWeight: 700,
    color: "#DC2626",
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    borderRadius: 8,
    cursor: "pointer",
  },
};
