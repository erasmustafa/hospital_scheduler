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

type ShiftTypeRow = {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  isNight: boolean;
  color: string;
};

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getShiftDuration(row: ShiftTypeRow) {
  const [startHour] = row.startTime.split(":").map(Number);
  const [endHour] = row.endTime.split(":").map(Number);
  if (Number.isNaN(startHour) || Number.isNaN(endHour)) return 0;
  return endHour >= startHour ? endHour - startHour : 24 - startHour + endHour;
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

  /* planning rule options */
  const [nightBalance, setNightBalance] = useState(true);
  const [weeklyLimit, setWeeklyLimit] = useState(true);
  const [respectAvailability, setRespectAvailability] = useState(true);
  const [weekendBalance, setWeekendBalance] = useState(true);
  const [draftOnly, setDraftOnly] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(true);

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

  const shiftTypeCounts = useMemo(
    () => ({
      total: shiftTypes.length,
      day: shiftTypes.filter((row) => !row.isNight).length,
      night: shiftTypes.filter((row) => row.isNight).length,
      long: shiftTypes.filter((row) => getShiftDuration(row) >= 12).length,
    }),
    [shiftTypes]
  );

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

          {/* ── SHIFT TYPES ── */}
          <section style={styles.shiftTypesCard}>
            <div style={styles.shiftTypesHeader}>
              <div>
                <p style={styles.sectionEyebrow}>Vardiya Tipleri</p>
                <h2 style={styles.shiftTypesTitle}>Otomatik liste şablonları</h2>
                <p style={styles.shiftTypesDesc}>
                  Liste motorunun kullanacağı vardiya saatlerini ve nöbet ayrımını buradan takip edin.
                </p>
              </div>
              <span style={styles.recordBadge}>{shiftTypes.length} kayıt</span>
            </div>

            <div style={styles.shiftStatsGrid}>
              <div style={styles.shiftStatPill}>
                <span style={styles.shiftStatValue}>{shiftTypeCounts.total}</span>
                <span style={styles.shiftStatLabel}>Toplam</span>
              </div>
              <div style={styles.shiftStatPill}>
                <span style={styles.shiftStatValue}>{shiftTypeCounts.day}</span>
                <span style={styles.shiftStatLabel}>Gündüz</span>
              </div>
              <div style={styles.shiftStatPill}>
                <span style={styles.shiftStatValue}>{shiftTypeCounts.night}</span>
                <span style={styles.shiftStatLabel}>Nöbet</span>
              </div>
              <div style={styles.shiftStatPill}>
                <span style={styles.shiftStatValue}>{shiftTypeCounts.long}</span>
                <span style={styles.shiftStatLabel}>Uzun</span>
              </div>
            </div>

            {loadingShiftTypes ? (
              <p style={styles.shiftTypesStatus}>Vardiya tipleri yükleniyor...</p>
            ) : shiftTypes.length === 0 ? (
              <p style={styles.shiftTypesStatus}>Kayıtlı vardiya tipi bulunamadı.</p>
            ) : (
              <div style={styles.shiftTypeList}>
                {shiftTypes.map((row) => (
                  <div key={row.id} style={styles.shiftTypeItem}>
                    <span
                      style={{
                        ...styles.shiftColorBar,
                        backgroundColor: row.color,
                      }}
                    />
                    <div style={styles.shiftTypeInfo}>
                      <strong style={styles.shiftTypeName}>{row.name}</strong>
                      <span style={styles.shiftTypeTime}>
                        {row.startTime} - {row.endTime}
                      </span>
                    </div>
                    <span
                      style={{
                        ...styles.shiftTypeBadge,
                        backgroundColor: row.isNight ? "#ede9fe" : "#dbeafe",
                        color: row.isNight ? "#6d28d9" : "#2563eb",
                      }}
                    >
                      {row.isNight ? "Nöbet" : "Gündüz"}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
  shiftTypesCard: {
    background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
    borderRadius: 16,
    padding: "20px",
    border: "1px solid #dbeafe",
    boxShadow: "0 12px 32px rgba(37,99,235,0.08)",
    marginBottom: 20,
  },
  shiftTypesHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 16,
  },
  sectionEyebrow: {
    margin: "0 0 6px",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "#2563eb",
  },
  shiftTypesTitle: {
    margin: "0 0 4px",
    fontSize: 17,
    fontWeight: 800,
    color: "#172554",
  },
  shiftTypesDesc: {
    margin: 0,
    maxWidth: 520,
    fontSize: 12,
    lineHeight: 1.5,
    color: "#64748b",
  },
  shiftStatsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 10,
    marginBottom: 14,
  },
  shiftStatPill: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 58,
    borderRadius: 14,
    background: "#eff6ff",
    border: "1px solid #dbeafe",
  },
  shiftStatValue: {
    fontSize: 18,
    fontWeight: 800,
    lineHeight: 1,
    color: "#1d4ed8",
  },
  shiftStatLabel: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
  },
  shiftTypesStatus: {
    margin: 0,
    padding: "14px 12px",
    borderRadius: 12,
    background: "#f8fafc",
    fontSize: 13,
    color: "#64748b",
  },
  shiftTypeList: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },
  shiftTypeItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minHeight: 58,
    padding: "10px 12px",
    borderRadius: 14,
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 2px rgba(15,23,42,0.03)",
  },
  shiftColorBar: {
    width: 5,
    alignSelf: "stretch",
    borderRadius: 999,
    flexShrink: 0,
  },
  shiftTypeInfo: {
    display: "flex",
    minWidth: 0,
    flex: 1,
    flexDirection: "column",
    gap: 3,
  },
  shiftTypeName: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    fontSize: 13,
    color: "#1e293b",
  },
  shiftTypeTime: {
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
  },
  shiftTypeBadge: {
    flexShrink: 0,
    borderRadius: 999,
    padding: "4px 8px",
    fontSize: 10,
    fontWeight: 800,
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
