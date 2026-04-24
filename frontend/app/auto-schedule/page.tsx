"use client";

import { useEffect, useMemo, useState } from "react";
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

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10);
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

  /* planning rule options */
  const [nightBalance, setNightBalance] = useState(true);
  const [weeklyLimit, setWeeklyLimit] = useState(true);
  const [respectAvailability, setRespectAvailability] = useState(true);
  const [weekendBalance, setWeekendBalance] = useState(true);
  const [draftOnly, setDraftOnly] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(true);

  const [loadingDepartments, setLoadingDepartments] = useState(true);
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
      {error && (
        <p style={{ color: "#dc2626", fontSize: 13, margin: "0 0 12px 0" }}>
          {error}
        </p>
      )}
      {success && (
        <p style={{ color: "#059669", fontSize: 13, margin: "0 0 12px 0" }}>
          {success}
        </p>
      )}

      <div style={styles.twoCol}>
        {/* ── LEFT: FORM ─────────────────────────────────── */}
        <div>
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Liste Oluştur</h2>

            <label style={styles.formLabel}>
              <span style={styles.formLabelText}>Birim:</span>
              <select
                style={styles.formInput}
                value={departmentId ?? ""}
                onChange={(e) => setDepartmentId(Number(e.target.value))}
                disabled={loadingDepartments || departments.length === 0}
              >
                <option value="">----------</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.formLabel}>
              <span style={styles.formLabelText}>Başlangıç Tarihi:</span>
              <input
                type="date"
                style={styles.formInput}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>

            <label style={styles.formLabel}>
              <span style={styles.formLabelText}>Bitiş Tarihi:</span>
              <input
                type="date"
                style={styles.formInput}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>

            {/* ── Planning Rules ── */}
            <div style={styles.rulesSection}>
              <div style={styles.rulesHeader}>
                <h3 style={styles.rulesTitle}>Planlama Kuralları</h3>
                <span style={styles.rulesLink}>Akıllı dağıtım seçenekleri</span>
              </div>
              <div style={styles.rulesGrid}>
                <label style={styles.ruleItem}>
                  <span>Gece nöbetlerini dengeli dağıt:</span>
                  <input
                    type="checkbox"
                    checked={nightBalance}
                    onChange={(e) => setNightBalance(e.target.checked)}
                    style={styles.checkbox}
                  />
                </label>
                <label style={styles.ruleItem}>
                  <span>Haftalık saat sınırını uygula:</span>
                  <input
                    type="checkbox"
                    checked={weeklyLimit}
                    onChange={(e) => setWeeklyLimit(e.target.checked)}
                    style={styles.checkbox}
                  />
                </label>
                <label style={styles.ruleItem}>
                  <span>İzin/uygunluk kayıtlarını dikkate al:</span>
                  <input
                    type="checkbox"
                    checked={respectAvailability}
                    onChange={(e) => setRespectAvailability(e.target.checked)}
                    style={styles.checkbox}
                  />
                </label>
                <label style={styles.ruleItem}>
                  <span>Sadece taslak oluştur:</span>
                  <input
                    type="checkbox"
                    checked={draftOnly}
                    onChange={(e) => setDraftOnly(e.target.checked)}
                    style={styles.checkbox}
                  />
                </label>
                <label style={styles.ruleItem}>
                  <span>Hafta sonu görevlerini dengeli dağıt:</span>
                  <input
                    type="checkbox"
                    checked={weekendBalance}
                    onChange={(e) => setWeekendBalance(e.target.checked)}
                    style={styles.checkbox}
                  />
                </label>
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <div style={styles.formActions}>
              <button type="button" style={styles.backButton}>
                Vardiya Listesine Dön
              </button>
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={generating || loadingDepartments}
                style={styles.generateButton}
              >
                {generating ? "Oluşturuluyor..." : "Taslak Liste Oluştur"}
              </button>
            </div>
          </section>

          {/* ── WARNINGS ── */}
          {warnings.length > 0 && (
            <section
              style={{
                ...styles.card,
                borderColor: "#FCD34D",
                background: "#FFFBEB",
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#92400E",
                  margin: "0 0 8px 0",
                }}
              >
                Uyarılar
              </p>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 20,
                  listStyleType: "disc",
                }}
              >
                {warnings.map((w, i) => (
                  <li
                    key={`${w}-${i}`}
                    style={{ fontSize: 12, color: "#92400E", marginBottom: 4 }}
                  >
                    {w}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* ── RIGHT: PREVIEW ─────────────────────────────── */}
        <div>
          <section style={styles.previewCard}>
            <div style={styles.previewHeader}>
              <h2 style={styles.previewTitle}>Taslak Önizleme</h2>
              <span style={styles.previewBadge}>{rows.length} kayıt</span>
            </div>
            <p style={styles.previewDesc}>
              Oluşturulan taslaklar onay öncesi bu panelde görünür. Alan sabit
              kalır, liste içeride scroll olur.
            </p>

            {rows.length === 0 ? (
              <div style={styles.previewEmpty}>
                <p style={styles.previewEmptyTitle}>
                  Henüz taslak üretilmedi
                </p>
                <p style={styles.previewEmptyDesc}>
                  Formu doldurup &quot;Taslak Liste Oluştur&quot; butonuna
                  bastığınızda oluşturulan vardiyalar bu panelde listelenir.
                  Çok sayıda kayıt oluşsa bile tablo bu kart içinde scroll
                  olarak kalır ve ekran dışına taşmaz.
                </p>
              </div>
            ) : (
              <div style={styles.previewTableWrap}>
                {meta && (
                  <div style={styles.metaRow}>
                    <span>Fairness: {meta.fairnessScore}</span>
                    <span>Saat farkı: {meta.hourSpread}</span>
                    <span>Nöbet: {meta.totalNightSpread}</span>
                    <span>Mesai farkı: {meta.mesaiSpread}</span>
                  </div>
                )}
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Tarih</th>
                      <th style={styles.th}>Personel</th>
                      <th style={styles.th}>Birim</th>
                      <th style={styles.th}>Vardiya</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={`${row.assignmentDate}-${row.shiftTypeId}-${row.staffProfileId}`}
                        style={styles.tableRow}
                      >
                        <td style={styles.td}>{row.assignmentDate}</td>
                        <td style={styles.td}>{row.staffProfileName}</td>
                        <td style={styles.td}>{row.departmentName}</td>
                        <td style={styles.td}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                backgroundColor: row.shiftColor,
                                display: "inline-block",
                              }}
                            />
                            {row.shiftTypeName}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {rows.length > 0 && (
              <div
                style={{
                  padding: "14px 20px",
                  borderTop: "1px solid #e2e8f0",
                  display: "flex",
                  gap: 10,
                }}
              >
                <button
                  type="button"
                  onClick={() => void handleCommit()}
                  disabled={committing}
                  style={styles.commitButton}
                >
                  {committing ? "Kaydediliyor..." : "Taslağı Kaydet"}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
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
    overflow: "auto",
    boxSizing: "border-box",
    background: "#f1f5f9",
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1.3fr 1fr",
    gap: 24,
    alignItems: "start",
  },

  /* ── card ── */
  card: {
    background: "#ffffff",
    borderRadius: 16,
    padding: "24px 28px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: "#1e293b",
    margin: "0 0 20px 0",
  },

  /* ── form ── */
  formLabel: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
    marginBottom: 16,
  },
  formLabelText: {
    fontSize: 14,
    fontWeight: 700,
    color: "#334155",
  },
  formInput: {
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

  /* ── rules ── */
  rulesSection: {
    background: "#f8fafc",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    padding: "16px 20px",
    marginTop: 8,
    marginBottom: 20,
  },
  rulesHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  rulesTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: "#1e293b",
    margin: 0,
  },
  rulesLink: {
    fontSize: 12,
    fontWeight: 600,
    color: "#0d9488",
    cursor: "pointer",
  },
  rulesGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  ruleItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    fontSize: 13,
    fontWeight: 600,
    color: "#334155",
    cursor: "pointer",
  },
  checkbox: {
    width: 18,
    height: 18,
    accentColor: "#1e293b",
    cursor: "pointer",
  },

  /* ── form actions ── */
  formActions: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    padding: "10px 20px",
    fontSize: 13,
    fontWeight: 700,
    color: "#334155",
    background: "transparent",
    border: "none",
    cursor: "pointer",
  },
  generateButton: {
    padding: "12px 28px",
    fontSize: 14,
    fontWeight: 700,
    color: "#ffffff",
    background: "#DC2626",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  commitButton: {
    padding: "10px 24px",
    fontSize: 13,
    fontWeight: 700,
    color: "#ffffff",
    background: "#059669",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
  },

  /* ── preview card ── */
  previewCard: {
    background: "#ffffff",
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    overflow: "hidden",
    position: "sticky" as const,
    top: 20,
  },
  previewHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 24px 8px",
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#1e293b",
    margin: 0,
  },
  previewBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "3px 12px",
    fontSize: 12,
    fontWeight: 700,
    color: "#059669",
    background: "#ECFDF5",
    borderRadius: 20,
  },
  previewDesc: {
    fontSize: 12,
    color: "#94a3b8",
    margin: "0 0 0 0",
    padding: "0 24px 16px",
    lineHeight: 1.5,
  },
  previewEmpty: {
    padding: "24px 24px 32px",
  },
  previewEmptyTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: "#1e293b",
    margin: "0 0 8px 0",
  },
  previewEmptyDesc: {
    fontSize: 13,
    color: "#94a3b8",
    margin: 0,
    lineHeight: 1.6,
  },
  previewTableWrap: {
    maxHeight: 460,
    overflowY: "auto" as const,
  },
  metaRow: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap" as const,
    padding: "10px 20px",
    borderBottom: "1px solid #e2e8f0",
    background: "#f8fafc",
    fontSize: 12,
    fontWeight: 600,
    color: "#475569",
  },

  /* ── table ── */
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
  },
  th: {
    padding: "10px 20px",
    fontSize: 12,
    fontWeight: 700,
    color: "#64748b",
    textAlign: "left" as const,
    borderBottom: "1px solid #e2e8f0",
    background: "#f8fafc",
    whiteSpace: "nowrap" as const,
    position: "sticky" as const,
    top: 0,
    zIndex: 10,
  },
  td: {
    padding: "10px 20px",
    fontSize: 13,
    color: "#334155",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "middle" as const,
  },
  tableRow: {
    transition: "background 0.15s ease",
  },
};
