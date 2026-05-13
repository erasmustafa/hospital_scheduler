"use client";

import { Fragment, useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  Archive,
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  Filter,
  MoreVertical,
  RefreshCw,
  Search,
  Sun,
  Trash2,
  UserRound,
  X,
  Ban,
  BriefcaseBusiness,
  Clock3,
} from "lucide-react";
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

const requestTypeStyle: Record<string, CSSProperties> = {
  leave: { background: "#eff6ff", color: "#2563eb" },
  unavailable: { background: "#f4f0ff", color: "#6d5dfc" },
  preferred_off: { background: "#fff7ed", color: "#f97316" },
};

const statusStyle: Record<ApprovalStatus, CSSProperties> = {
  pending: { background: "#fff7ed", color: "#d97706" },
  approved: { background: "#ecfdf5", color: "#059669" },
  rejected: { background: "#fff1f2", color: "#dc2626" },
};

const filterOptions: Array<{ value: "" | ApprovalStatus; label: string }> = [
  { value: "", label: "Tüm Talepler" },
  { value: "pending", label: "Bekleyenler" },
  { value: "approved", label: "Onaylananlar" },
  { value: "rejected", label: "Reddedilenler" },
];

function formatDate(date: string | null) {
  if (!date) return "-";
  return new Date(`${date}T12:00:00`).toLocaleDateString("tr-TR");
}

function formatDateRange(startDate: string, endDate: string) {
  return startDate === endDate ? formatDate(startDate) : `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("tr-TR"))
    .join("") || "MB";
}

function RequestTypeBadge({ type }: { type: string }) {
  const style = requestTypeStyle[type] ?? requestTypeStyle.unavailable;
  const Icon = type === "leave" ? CalendarDays : type === "preferred_off" ? Clock3 : Ban;

  return (
    <span style={{ ...styles.typeBadge, ...style }}>
      <Icon size={13} />
      {requestTypeLabel[type] || type}
    </span>
  );
}

function ShiftBadge({ label }: { label: string | null }) {
  const normalized = label || "Tüm Gün";
  const Icon = normalized.toLocaleLowerCase("tr-TR").includes("nöbet") ? Clock3 : normalized === "Tüm Gün" ? Sun : BriefcaseBusiness;

  return (
    <span style={styles.shiftText}>
      <Icon size={13} />
      {normalized}
    </span>
  );
}

function StatusBadge({ status }: { status: ApprovalStatus }) {
  const Icon = status === "approved" ? Check : status === "rejected" ? X : Clock3;

  return (
    <span style={{ ...styles.statusBadge, ...statusStyle[status] }}>
      <Icon size={13} />
      {statusLabel[status]}
    </span>
  );
}

export default function ApprovalsPage() {
  const [rows, setRows] = useState<ApprovalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"" | ApprovalStatus>("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [openActionId, setOpenActionId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

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

  const handleReportDownload = () => {
    const headers = [
      "Personel",
      "Birim",
      "Talep Türü",
      "Günler",
      "Vardiya",
      "Not",
      "Oluşturan",
      "Durum",
      "İnceleyen",
    ];
    const escapeCsv = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const csvRows = filteredRows.map((row) =>
      [
        row.staffProfileName,
        row.departmentName || "-",
        requestTypeLabel[row.requestType] || row.requestType,
        formatDateRange(row.startDate, row.endDate),
        row.shiftTypeName || "Tüm Gün",
        row.notes || "-",
        row.createdByName || "Sistem",
        statusLabel[row.approvalStatus],
        row.reviewedByName || "-",
      ].map(escapeCsv).join(",")
    );
    const csv = [headers.map(escapeCsv).join(","), ...csvRows].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `izin-uygunluk-talepleri-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase("tr-TR");
    return rows.filter((row) => {
      if (filterType && row.approvalStatus !== filterType) return false;
      if (!normalizedSearch) return true;

      return [
        row.staffProfileName,
        row.departmentName,
        row.shiftTypeName || "Tüm Gün",
        requestTypeLabel[row.requestType] || row.requestType,
        row.notes,
      ]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(normalizedSearch);
    });
  }, [filterType, rows, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchTerm, rows.length]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedRows = filteredRows.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );
  const activeFilterLabel = filterOptions.find((option) => option.value === filterType)?.label ?? "Tüm Talepler";

  return (
    <>
    <style
      dangerouslySetInnerHTML={{
        __html: `
          .approvals-action {
            transition: transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease, background 150ms ease, color 150ms ease;
          }
          .approvals-action:hover:not(:disabled) {
            transform: translateY(-1px);
            border-color: #b8c6ff !important;
            box-shadow: 0 12px 24px rgba(79, 70, 229, 0.12) !important;
          }
          .approvals-action:active:not(:disabled) {
            transform: translateY(0) scale(0.97);
          }
          .approvals-action:disabled {
            cursor: not-allowed;
            opacity: 0.45;
          }
          .approvals-filter-option {
            transition: transform 140ms ease, background 140ms ease, color 140ms ease;
          }
          .approvals-filter-option:hover {
            transform: translateX(2px);
            background: linear-gradient(135deg, #eef2ff 0%, #ffffff 100%) !important;
            color: #4f46e5 !important;
          }
          .approvals-more-item {
            transition: transform 140ms ease, background 140ms ease, color 140ms ease;
          }
          .approvals-more-item:hover {
            transform: translateX(2px);
            background: #f6f8ff !important;
            color: #4f46e5 !important;
          }
          .approvals-more-item-danger:hover {
            background: #fff1f2 !important;
            color: #dc2626 !important;
          }
        `,
      }}
    />
    <main style={styles.main}>
      <section style={styles.pageShell}>
        <header style={styles.header}>
          <div style={styles.titleGroup}>
            <span style={styles.headerIcon}>
              <CalendarDays size={24} />
            </span>
            <div>
              <h1 style={styles.pageTitle}>İzin ve Uygunluk Talepleri</h1>
              <p style={styles.pageDesc}>
                Personelin talep ettiği izin türlerini ve gün aralıklarını burada görüntüleyip onaylayabilir ya da reddedebilirsin.
              </p>
            </div>
          </div>
          <button type="button" className="approvals-action" style={styles.reportButton} onClick={handleReportDownload}>
            <Download size={16} />
            Raporu İndir
          </button>
        </header>

        <section style={styles.toolbar}>
          <div style={styles.toolbarLeft}>
            <div
              style={styles.filterDropdown}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setFilterOpen(false);
                }
              }}
            >
              <button
                type="button"
                className="approvals-action"
                style={styles.filterDropdownButton}
                onClick={() => setFilterOpen((current) => !current)}
                aria-haspopup="listbox"
                aria-expanded={filterOpen}
              >
                <span>{activeFilterLabel}</span>
                <ChevronDown
                  size={16}
                  style={{
                    ...styles.filterDropdownChevron,
                    transform: filterOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </button>
              {filterOpen ? (
                <div style={styles.filterDropdownMenu} role="listbox">
                  {filterOptions.map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      className="approvals-filter-option"
                      style={{
                        ...styles.filterDropdownItem,
                        ...(option.value === filterType ? styles.filterDropdownItemActive : {}),
                      }}
                      onClick={() => {
                        setFilterType(option.value);
                        setFilterOpen(false);
                      }}
                      role="option"
                      aria-selected={option.value === filterType}
                    >
                      <span>{option.label}</span>
                      {option.value === filterType ? <Check size={14} /> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <button type="button" className="approvals-action" style={styles.refreshButton} onClick={() => void loadRequests()} aria-label="Talepleri yenile">
              <RefreshCw size={17} />
            </button>
          </div>
          <div style={styles.toolbarRight}>
            <label style={styles.searchShell}>
              <Search size={17} />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Personel, birim veya talep türü ara..."
                style={styles.searchInput}
              />
            </label>
            <button type="button" className="approvals-action" onClick={() => void loadRequests()} style={styles.filterButton}>
              <Filter size={16} />
              Filtrele
            </button>
          </div>
        </section>

        {error ? <p style={styles.errorText}>{error}</p> : null}

        <section style={styles.tableSection}>
          {loading ? (
            <p style={styles.loadingText}>Yükleniyor...</p>
          ) : (
            <>
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
                      <th style={{ ...styles.th, width: 44 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRows.length === 0 ? (
                      <tr>
                        <td colSpan={11} style={styles.emptyCell}>
                          Gösterilecek izin veya uygunluk talebi bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      pagedRows.map((row, index) => {
                        const isPending = row.approvalStatus === "pending";
                        return (
                          <tr
                            key={row.id}
                            style={{
                              ...styles.tableRow,
                              background: index % 2 === 0 ? "#ffffff" : "#f8fafc",
                            }}
                          >
                            <td style={styles.td}>
                              <div style={styles.personCell}>
                                <span style={styles.avatar}>{getInitials(row.staffProfileName)}</span>
                                <span style={styles.primaryText}>{row.staffProfileName}</span>
                              </div>
                            </td>
                            <td style={styles.td}>{row.departmentName || "-"}</td>
                            <td style={styles.td}>
                              <RequestTypeBadge type={row.requestType} />
                            </td>
                            <td style={styles.td}>
                              <span style={styles.dateCell}>
                                <CalendarDays size={14} />
                                {formatDateRange(row.startDate, row.endDate)}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <ShiftBadge label={row.shiftTypeName} />
                            </td>
                            <td style={styles.td}>
                              <span style={styles.secondaryText}>{row.notes || "-"}</span>
                            </td>
                            <td style={styles.td}>
                              <div style={styles.metaCell}>
                                <span style={styles.metaName}>
                                  <UserRound size={13} />
                                  {row.createdByName || "Sistem"}
                                </span>
                                <span style={styles.metaDate}>{formatDate(row.created_at?.slice(0, 10) || null)}</span>
                              </div>
                            </td>
                            <td style={styles.td}>
                              <StatusBadge status={row.approvalStatus} />
                            </td>
                            <td style={styles.td}>
                              <div style={styles.metaCell}>
                                <span>{row.reviewedByName || "-"}</span>
                                <span style={styles.metaDate}>{row.reviewedAt ? formatDate(row.reviewedAt.slice(0, 10)) : "-"}</span>
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
                                <span style={styles.doneButton}>İşlem Tamamlandı</span>
                              )}
                            </td>
                            <td style={{ ...styles.td, textAlign: "center" }}>
                              <div
                                style={styles.moreMenuWrap}
                                onBlur={(event) => {
                                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                                    setOpenActionId(null);
                                  }
                                }}
                              >
                              <button
                                type="button"
                                className="approvals-action"
                                style={styles.moreButton}
                                aria-label="Diğer işlemler"
                                aria-haspopup="menu"
                                aria-expanded={openActionId === row.id}
                                onClick={() => setOpenActionId((current) => (current === row.id ? null : row.id))}
                              >
                                <MoreVertical size={17} />
                              </button>
                              {openActionId === row.id ? (
                                <div style={styles.moreMenu} role="menu">
                                  <button type="button" className="approvals-more-item" style={styles.moreMenuItem} role="menuitem" onClick={() => setOpenActionId(null)}>
                                    <Archive size={14} />
                                    Arşivle
                                  </button>
                                  <button type="button" className="approvals-more-item" style={styles.moreMenuItem} role="menuitem" onClick={() => setOpenActionId(null)}>
                                    <RefreshCw size={14} />
                                    Yeniden Değerlendir
                                  </button>
                                  <button type="button" className="approvals-more-item approvals-more-item-danger" style={{ ...styles.moreMenuItem, ...styles.moreMenuItemDanger }} role="menuitem" onClick={() => setOpenActionId(null)}>
                                    <Trash2 size={14} />
                                    Sil
                                  </button>
                                </div>
                              ) : null}
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
                <span>Toplam {filteredRows.length} kayıt</span>
                <div style={styles.pagination}>
                  <button type="button" className="approvals-action" style={styles.pageSelect}>10 / sayfa</button>
                  <button
                    type="button"
                    className="approvals-action"
                    style={styles.pageButton}
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={safeCurrentPage === 1}
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, index) => index + 1)
                    .filter((page) => page <= 5 || page === totalPages || Math.abs(page - safeCurrentPage) <= 1)
                    .map((page, index, pages) => (
                      <Fragment key={page}>
                        {index > 0 && page - pages[index - 1] > 1 ? <span style={styles.pageDots}>...</span> : null}
                        <button
                          type="button"
                          className="approvals-action"
                          style={{
                            ...styles.pageButton,
                            ...(page === safeCurrentPage ? styles.pageButtonActive : {}),
                          }}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      </Fragment>
                    ))}
                  <button
                    type="button"
                    className="approvals-action"
                    style={styles.pageButton}
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={safeCurrentPage === totalPages}
                  >
                    ›
                  </button>
                </div>
              </footer>
            </>
          )}
        </section>
      </section>
    </main>
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  main: {
    padding: "10px 12px",
    fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    height: "100%",
    minHeight: 0,
    overflow: "hidden",
    boxSizing: "border-box",
    background: "#f1f5f9",
  },
  pageShell: {
    height: "100%",
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    borderRadius: 18,
    padding: "28px 26px 24px",
    background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
    border: "1px solid #e5edf8",
    boxShadow: "0 18px 44px rgba(15, 23, 42, 0.08)",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 20,
    marginBottom: 34,
  },
  titleGroup: {
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
  },
  headerIcon: {
    width: 48,
    height: 48,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    color: "#5b5cf6",
    background: "linear-gradient(145deg, #eef2ff 0%, #f4f0ff 100%)",
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: "#0f1b3d",
    margin: "0 0 8px",
    letterSpacing: "-0.02em",
  },
  pageDesc: {
    fontSize: 13,
    fontWeight: 600,
    color: "#7381a3",
    margin: 0,
    lineHeight: 1.55,
  },
  reportButton: {
    height: 40,
    display: "inline-flex",
    alignItems: "center",
    gap: 9,
    padding: "0 18px",
    borderRadius: 8,
    border: "1px solid #dce6f6",
    background: "#ffffff",
    color: "#5b5cf6",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(15, 23, 42, 0.04)",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    marginBottom: 20,
  },
  toolbarLeft: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  toolbarRight: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 14,
    flex: 1,
  },
  filterDropdown: {
    position: "relative",
    display: "inline-flex",
    width: 240,
  },
  filterDropdownButton: {
    width: "100%",
    height: 42,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderRadius: 8,
    border: "1px solid #dce6f6",
    padding: "0 13px 0 16px",
    fontSize: 13,
    fontWeight: 700,
    color: "#243754",
    background: "#ffffff",
    fontFamily: "inherit",
    cursor: "pointer",
    outline: "none",
  },
  filterDropdownChevron: {
    color: "#52627f",
    transition: "transform 150ms ease",
  },
  filterDropdownMenu: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "calc(100% + 8px)",
    zIndex: 30,
    padding: 6,
    borderRadius: 12,
    border: "1px solid #dce6f6",
    background: "rgba(255,255,255,0.98)",
    boxShadow: "0 18px 38px rgba(15, 23, 42, 0.14)",
    backdropFilter: "blur(12px)",
  },
  filterDropdownItem: {
    width: "100%",
    minHeight: 34,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    border: "none",
    borderRadius: 9,
    padding: "0 10px",
    background: "transparent",
    color: "#334155",
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "inherit",
    cursor: "pointer",
  },
  filterDropdownItemActive: {
    background: "linear-gradient(135deg, #eef2ff 0%, #f8fbff 100%)",
    color: "#4f46e5",
    boxShadow: "inset 3px 0 0 #5b5cf6",
  },
  refreshButton: {
    height: 42,
    width: 42,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    border: "1px solid #dce6f6",
    background: "#ffffff",
    color: "#5b5cf6",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(15, 23, 42, 0.04)",
  },
  searchShell: {
    width: "min(440px, 100%)",
    height: 42,
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    padding: "0 14px",
    borderRadius: 8,
    border: "1px solid #dce6f6",
    background: "#ffffff",
    color: "#8190ad",
  },
  searchInput: {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#243754",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "inherit",
  },
  filterButton: {
    height: 42,
    display: "inline-flex",
    alignItems: "center",
    gap: 9,
    padding: "0 18px",
    borderRadius: 8,
    border: "1px solid #dce6f6",
    background: "#ffffff",
    color: "#5b5cf6",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  errorText: {
    margin: "0 0 12px",
    color: "#dc2626",
    fontSize: 13,
    fontWeight: 700,
  },
  loadingText: {
    padding: 20,
    color: "#64748b",
  },
  tableSection: {
    background: "#ffffff",
    borderRadius: 12,
    border: "1px solid #dce6f6",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
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
    position: "sticky",
    top: 0,
    zIndex: 2,
    padding: "18px 24px",
    fontSize: 12,
    fontWeight: 700,
    color: "#52627f",
    textAlign: "left",
    borderBottom: "1px solid #e5edf8",
    background: "#ffffff",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "12px 24px",
    fontSize: 13,
    fontWeight: 600,
    color: "#465674",
    borderBottom: "1px solid #edf2f8",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },
  tableRow: {
    transition: "background 0.15s ease",
  },
  emptyCell: {
    padding: "36px 20px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: 700,
  },
  personCell: {
    display: "inline-flex",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    background: "#f1edff",
    color: "#6d5dfc",
    fontSize: 13,
    fontWeight: 700,
  },
  primaryText: {
    fontWeight: 700,
    color: "#0f1b3d",
  },
  secondaryText: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: 700,
  },
  typeBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "7px 12px",
    fontSize: 12,
    fontWeight: 700,
    borderRadius: 8,
  },
  dateCell: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "#465674",
  },
  shiftText: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "#465674",
    fontSize: 12,
    fontWeight: 700,
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "7px 13px",
    fontSize: 12,
    fontWeight: 700,
    borderRadius: 999,
  },
  metaCell: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  metaName: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    color: "#4f46e5",
    fontWeight: 700,
  },
  metaDate: {
    color: "#7180a0",
    fontSize: 12,
    fontWeight: 700,
  },
  actions: {
    display: "inline-flex",
    gap: 8,
    justifyContent: "center",
  },
  approveBtn: {
    padding: "7px 12px",
    fontSize: 12,
    fontWeight: 700,
    color: "#059669",
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    borderRadius: 8,
    cursor: "pointer",
  },
  rejectBtn: {
    padding: "7px 12px",
    fontSize: 12,
    fontWeight: 700,
    color: "#dc2626",
    background: "#fff1f2",
    border: "1px solid #fecaca",
    borderRadius: 8,
    cursor: "pointer",
  },
  doneButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 34,
    padding: "0 14px",
    borderRadius: 8,
    border: "1px solid #dce6f6",
    background: "#ffffff",
    color: "#465674",
    fontSize: 12,
    fontWeight: 700,
  },
  moreButton: {
    width: 30,
    height: 30,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    borderRadius: 8,
    background: "transparent",
    color: "#243754",
    cursor: "pointer",
  },
  moreMenuWrap: {
    position: "relative",
    display: "inline-flex",
    justifyContent: "center",
  },
  moreMenu: {
    position: "absolute",
    right: 0,
    top: "calc(100% + 8px)",
    zIndex: 35,
    width: 176,
    padding: 6,
    borderRadius: 12,
    border: "1px solid #dce6f6",
    background: "rgba(255,255,255,0.98)",
    boxShadow: "0 18px 38px rgba(15, 23, 42, 0.14)",
    backdropFilter: "blur(12px)",
  },
  moreMenuItem: {
    width: "100%",
    minHeight: 34,
    display: "flex",
    alignItems: "center",
    gap: 9,
    border: "none",
    borderRadius: 9,
    padding: "0 10px",
    background: "transparent",
    color: "#334155",
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "inherit",
    textAlign: "left",
    cursor: "pointer",
  },
  moreMenuItemDanger: {
    color: "#dc2626",
  },
  tableFooter: {
    minHeight: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    padding: "0 22px",
    borderTop: "1px solid #dce6f6",
    background: "#ffffff",
    color: "#465674",
    fontSize: 12,
    fontWeight: 700,
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  pageSelect: {
    height: 36,
    padding: "0 18px",
    borderRadius: 8,
    border: "1px solid #dce6f6",
    background: "#ffffff",
    color: "#465674",
    fontSize: 12,
    fontWeight: 700,
  },
  pageButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    border: "1px solid transparent",
    background: "#ffffff",
    color: "#243754",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  pageButtonActive: {
    color: "#ffffff",
    background: "linear-gradient(135deg, #6d5dfc 0%, #4f46e5 100%)",
    boxShadow: "0 10px 20px rgba(79, 70, 229, 0.25)",
  },
  pageDots: {
    color: "#64748b",
    fontWeight: 700,
  },
};
