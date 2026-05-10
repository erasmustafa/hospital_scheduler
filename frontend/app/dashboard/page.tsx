"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bot,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  Info,
  UsersRound,
} from "lucide-react";
import { apiClient } from "@/lib/api";

type DashboardSummary = {
  activeStaff: number;
  todaysAssignments: number;
  pendingApprovals: number;
  unreadNotifications: number;
};

type ShiftKind = "Gündüz" | "Akşam" | "Gece" | "İzinli";

type ScheduleCell = {
  type: ShiftKind;
  time: string;
};

type ScheduleRow = {
  name: string;
  shifts: ScheduleCell[];
};

const weekDays = ["27 Pzt", "28 Sal", "29 Çar", "30 Per", "31 Cum", "1 Cmt", "2 Paz"];

const scheduleRows: ScheduleRow[] = [
  {
    name: "Ece Yılmaz",
    shifts: [
      { type: "Gündüz", time: "08:00 - 16:00" },
      { type: "Gündüz", time: "08:00 - 16:00" },
      { type: "Gündüz", time: "08:00 - 16:00" },
      { type: "Akşam", time: "16:00 - 00:00" },
      { type: "Akşam", time: "16:00 - 00:00" },
      { type: "Gündüz", time: "08:00 - 16:00" },
      { type: "İzinli", time: "Çalışmayacak" },
    ],
  },
  {
    name: "Mehmet Kaya",
    shifts: [
      { type: "Akşam", time: "16:00 - 00:00" },
      { type: "Akşam", time: "16:00 - 00:00" },
      { type: "Akşam", time: "16:00 - 00:00" },
      { type: "Gündüz", time: "08:00 - 16:00" },
      { type: "Gündüz", time: "08:00 - 16:00" },
      { type: "İzinli", time: "Çalışmayacak" },
      { type: "Akşam", time: "16:00 - 00:00" },
    ],
  },
  {
    name: "Ayşe Demir",
    shifts: [
      { type: "Gündüz", time: "08:00 - 16:00" },
      { type: "İzinli", time: "Çalışmayacak" },
      { type: "Akşam", time: "16:00 - 00:00" },
      { type: "Akşam", time: "16:00 - 00:00" },
      { type: "Gündüz", time: "08:00 - 16:00" },
      { type: "Gündüz", time: "08:00 - 16:00" },
      { type: "Gündüz", time: "08:00 - 16:00" },
    ],
  },
  {
    name: "Murat Şahin",
    shifts: [
      { type: "Gece", time: "00:00 - 08:00" },
      { type: "Gece", time: "00:00 - 08:00" },
      { type: "İzinli", time: "Çalışmayacak" },
      { type: "Gece", time: "00:00 - 08:00" },
      { type: "Gece", time: "00:00 - 08:00" },
      { type: "Akşam", time: "16:00 - 00:00" },
      { type: "İzinli", time: "Çalışmayacak" },
    ],
  },
  {
    name: "Zeynep Aksoy",
    shifts: [
      { type: "Gündüz", time: "08:00 - 16:00" },
      { type: "Gündüz", time: "08:00 - 16:00" },
      { type: "Akşam", time: "16:00 - 00:00" },
      { type: "İzinli", time: "Çalışmayacak" },
      { type: "Gündüz", time: "08:00 - 16:00" },
      { type: "Gündüz", time: "08:00 - 16:00" },
      { type: "İzinli", time: "Çalışmayacak" },
    ],
  },
  {
    name: "Ali Çelik",
    shifts: [
      { type: "Akşam", time: "16:00 - 00:00" },
      { type: "İzinli", time: "Çalışmayacak" },
      { type: "Gündüz", time: "08:00 - 16:00" },
      { type: "Gündüz", time: "08:00 - 16:00" },
      { type: "İzinli", time: "Çalışmayacak" },
      { type: "Gece", time: "00:00 - 08:00" },
      { type: "Gece", time: "00:00 - 08:00" },
    ],
  },
  {
    name: "Deniz Arslan",
    shifts: [
      { type: "İzinli", time: "Çalışmayacak" },
      { type: "Gündüz", time: "08:00 - 16:00" },
      { type: "Gündüz", time: "08:00 - 16:00" },
      { type: "Gündüz", time: "08:00 - 16:00" },
      { type: "Gündüz", time: "08:00 - 16:00" },
      { type: "Akşam", time: "16:00 - 00:00" },
      { type: "Gündüz", time: "08:00 - 16:00" },
    ],
  },
  {
    name: "Emre Yıldız",
    shifts: [
      { type: "Gece", time: "00:00 - 08:00" },
      { type: "Akşam", time: "16:00 - 00:00" },
      { type: "İzinli", time: "Çalışmayacak" },
      { type: "Gece", time: "00:00 - 08:00" },
      { type: "İzinli", time: "Çalışmayacak" },
      { type: "Gece", time: "00:00 - 08:00" },
      { type: "Akşam", time: "16:00 - 00:00" },
    ],
  },
  {
    name: "Seda Arıkan",
    shifts: [
      { type: "Gündüz", time: "08:00 - 16:00" },
      { type: "Akşam", time: "16:00 - 00:00" },
      { type: "Akşam", time: "16:00 - 00:00" },
      { type: "İzinli", time: "Çalışmayacak" },
      { type: "Akşam", time: "16:00 - 00:00" },
      { type: "Gündüz", time: "08:00 - 16:00" },
      { type: "İzinli", time: "Çalışmayacak" },
    ],
  },
  {
    name: "Burak Kılıç",
    shifts: [
      { type: "İzinli", time: "Çalışmayacak" },
      { type: "Gece", time: "00:00 - 08:00" },
      { type: "Gece", time: "00:00 - 08:00" },
      { type: "Akşam", time: "16:00 - 00:00" },
      { type: "İzinli", time: "Çalışmayacak" },
      { type: "Gece", time: "00:00 - 08:00" },
      { type: "Gece", time: "00:00 - 08:00" },
    ],
  },
];

const shiftStyles: Record<ShiftKind, { bg: string; text: string }> = {
  Gündüz: { bg: "#ecfdf3", text: "#078247" },
  Akşam: { bg: "#eef4ff", text: "#1554d1" },
  Gece: { bg: "#f2eafe", text: "#6d35d5" },
  İzinli: { bg: "#f4f6fa", text: "#46546b" },
};

function CompliancePill({ icon, text }: { icon: "check" | "info"; text: string }) {
  return (
    <div style={styles.compliancePill}>
      <span style={icon === "check" ? styles.successIcon : styles.infoIcon}>
        {icon === "check" ? <Check size={14} /> : <Info size={14} />}
      </span>
      {text}
    </div>
  );
}

function SummaryMetric({
  icon,
  value,
  label,
  note,
  tone,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  note: string;
  tone: "blue" | "green" | "purple";
}) {
  const palette = {
    blue: { bg: "#eef4ff", color: "#2563eb" },
    green: { bg: "#eafaf0", color: "#22a35a" },
    purple: { bg: "#f1e9ff", color: "#7c3aed" },
  }[tone];

  return (
    <div style={styles.summaryMetric}>
      <span style={{ ...styles.metricIcon, background: palette.bg, color: palette.color }}>{icon}</span>
      <div>
        <strong style={styles.metricValue}>{value}</strong>
        <p style={styles.metricLabel}>{label}</p>
        <small style={{ ...styles.metricNote, color: palette.color }}>{note}</small>
      </div>
    </div>
  );
}

function ShiftChip({ shift }: { shift: ScheduleCell }) {
  const tone = shiftStyles[shift.type];

  return (
    <div style={{ ...styles.shiftChip, background: tone.bg, color: tone.text }}>
      <strong>{shift.type}</strong>
      <span>{shift.time}</span>
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      const data = await apiClient.get<DashboardSummary>("/dashboard/summary/");
      setSummary(data);
      setSummaryError(null);
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : "Özet verisi alınamadı.");
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const totalAssignments = useMemo(
    () => scheduleRows.reduce((total, row) => total + row.shifts.filter((shift) => shift.type !== "İzinli").length, 0),
    []
  );

  const averageStaff = summary?.activeStaff ? Math.min(summary.activeStaff, 45) : 45;
  const workloadAverage = totalAssignments > 0 ? 44.6 : 0;

  return (
    <main style={styles.main}>
      <div style={styles.dashboardGrid}>
        <div style={styles.leftColumn}>
          <section style={styles.analysisBanner}>
            <div style={styles.botAvatar}>
              <Bot size={34} />
            </div>
            <div style={styles.bannerContent}>
              <h2 style={styles.bannerTitle}>Planınız analiz edildi ve en uygun vardiya planı oluşturuldu.</h2>
              <div style={styles.complianceGrid}>
                <CompliancePill icon="check" text="Gereksinimler karşılandı" />
                <CompliancePill icon="check" text="Adil dağılım sağlandı" />
                <CompliancePill icon="check" text="Yasa ve kural kontrolü" />
                <CompliancePill icon="info" text="Uygunluk Skoru: %94" />
              </div>
            </div>
          </section>

          {summaryError ? <p style={styles.errorText}>{summaryError}</p> : null}

          <section style={styles.planCard}>
            <div style={styles.planToolbar}>
              <div style={styles.viewToggle}>
                <button type="button" style={styles.viewToggleActive}>
                  <CalendarDays size={14} />
                  Haftalık
                </button>
                <button type="button" style={styles.viewToggleButton}>Günlük</button>
              </div>

              <div style={styles.weekNavigator}>
                <button type="button" style={styles.navButton} aria-label="Önceki hafta">
                  <ChevronLeft size={18} />
                </button>
                <strong>27 Mayıs – 2 Haziran 2024</strong>
                <button type="button" style={styles.navButton} aria-label="Sonraki hafta">
                  <ChevronRight size={18} />
                </button>
              </div>

              <button type="button" style={styles.filterButton}>
                <Filter size={15} />
                Filtreler
                <ChevronDown size={14} />
              </button>
            </div>

            <div style={styles.scheduleWrap}>
              <div style={styles.scheduleGrid}>
                <div style={styles.employeeHead}>Çalışanlar</div>
                {weekDays.map((day) => (
                  <div key={day} style={styles.dayHead}>{day}</div>
                ))}

                {scheduleRows.map((row) => (
                  <div key={row.name} style={styles.scheduleRowContents}>
                    <div style={styles.employeeCell}>{row.name}</div>
                    {row.shifts.map((shift, index) => (
                      <div key={`${row.name}-${weekDays[index]}`} style={styles.shiftCell}>
                        <ShiftChip shift={shift} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.legendRow}>
              <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: "#35b66a" }} />Gündüz <small>08:00 - 16:00</small></span>
              <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: "#2f6df6" }} />Akşam <small>16:00 - 00:00</small></span>
              <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: "#8b5cf6" }} />Gece <small>00:00 - 08:00</small></span>
              <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: "#cbd5e1" }} />İzinli <small>Çalışmayacak</small></span>
            </div>
          </section>
        </div>

        <aside style={styles.rightColumn}>
          <section style={styles.sideCard}>
            <h3 style={styles.sideTitle}>Plan Özeti</h3>
            <div style={styles.sideStack}>
              <SummaryMetric
                icon={<UsersRound size={23} />}
                value={`${averageStaff} / 45`}
                label="Günlük Ortalama Kişi"
                note="İhtiyaç karşılandı"
                tone="blue"
              />
              <SummaryMetric
                icon={<CheckCircle2 size={24} />}
                value="94%"
                label="Genel Uygunluk Skoru"
                note="Çok iyi"
                tone="green"
              />
              <SummaryMetric
                icon={<Clock3 size={24} />}
                value={String(workloadAverage)}
                label="Kişi Başına Ortalama Saat"
                note="Hedef: ≤ 45 saat"
                tone="purple"
              />
            </div>
          </section>

          <section style={styles.sideCard}>
            <h3 style={styles.sideTitle}>Dağılım Analizi</h3>
            <div style={styles.distributionWrap}>
              <div style={styles.donutChart} />
              <div style={styles.distributionList}>
                <span style={styles.distributionItem}><i style={{ ...styles.distributionDot, background: "#7ccf9a" }} />Gündüz <b>56%</b></span>
                <span style={styles.distributionItem}><i style={{ ...styles.distributionDot, background: "#6ca1ff" }} />Akşam <b>28%</b></span>
                <span style={styles.distributionItem}><i style={{ ...styles.distributionDot, background: "#9a7cf4" }} />Gece <b>12%</b></span>
                <span style={styles.distributionItem}><i style={{ ...styles.distributionDot, background: "#cbd5e1" }} />İzinli <b>4%</b></span>
              </div>
            </div>
          </section>

          <section style={styles.sideCard}>
            <h3 style={styles.sideTitle}>Kontroller</h3>
            <div style={styles.checkList}>
              {["Yasal saat sınırı", "Dinlenme süresi", "Hafta sonu dengesi", "Adil dağılım", "Minimum kişi ihtiyacı"].map((item) => (
                <div key={item} style={styles.checkRow}>
                  <span style={styles.checkLabel}><CheckCircle2 size={14} />{item}</span>
                  <strong>Uygun</strong>
                </div>
              ))}
            </div>
          </section>

          <section style={styles.sideCard}>
            <h3 style={styles.sideTitle}>Son Güncelleme</h3>
            <p style={styles.updateText}><Clock3 size={16} />24 Mayıs 2024 14:32</p>
            <p style={styles.updateSubtext}>Otomatik olarak oluşturuldu.</p>
          </section>
        </aside>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    height: "100%",
    minHeight: 0,
    overflow: "auto",
    padding: "10px 18px 18px",
    background: "#f8fafc",
    fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    color: "#0f1b3d",
    boxSizing: "border-box",
  },
  dashboardGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(760px, 1fr) 300px",
    gap: 18,
    alignItems: "start",
  },
  leftColumn: {
    display: "grid",
    gap: 16,
    minWidth: 0,
  },
  rightColumn: {
    display: "grid",
    gap: 12,
  },
  analysisBanner: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    minHeight: 94,
    borderRadius: 12,
    border: "1px solid #dfe7f4",
    background: "#ffffff",
    padding: "12px 18px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.035)",
  },
  botAvatar: {
    width: 70,
    height: 70,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    color: "#2456e8",
    background: "radial-gradient(circle at 50% 38%, #e7edff 0%, #d8e3ff 46%, #eef4ff 100%)",
    border: "1px solid #dbe5ff",
    flexShrink: 0,
  },
  bannerContent: {
    minWidth: 0,
    flex: 1,
  },
  bannerTitle: {
    margin: "0 0 12px",
    fontSize: 15,
    fontWeight: 800,
    color: "#0f1b3d",
  },
  complianceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(150px, 1fr))",
    gap: 14,
  },
  compliancePill: {
    minHeight: 36,
    display: "flex",
    alignItems: "center",
    gap: 10,
    borderRadius: 7,
    border: "1px solid #dfe7f4",
    background: "#ffffff",
    padding: "0 12px",
    fontSize: 12,
    fontWeight: 600,
    color: "#31415f",
  },
  successIcon: {
    width: 18,
    height: 18,
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    background: "#35b66a",
    color: "#ffffff",
  },
  infoIcon: {
    width: 18,
    height: 18,
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    background: "#2f6df6",
    color: "#ffffff",
  },
  errorText: {
    margin: 0,
    padding: "9px 12px",
    borderRadius: 8,
    background: "#fff1f2",
    color: "#dc2626",
    fontSize: 12,
    fontWeight: 700,
  },
  planCard: {
    borderRadius: 12,
    border: "1px solid #dfe7f4",
    background: "#ffffff",
    overflow: "hidden",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.035)",
  },
  planToolbar: {
    minHeight: 62,
    display: "grid",
    gridTemplateColumns: "220px 1fr 140px",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    borderBottom: "1px solid #edf2f7",
  },
  viewToggle: {
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    borderRadius: 7,
    border: "1px solid #dfe7f4",
    overflow: "hidden",
    background: "#ffffff",
  },
  viewToggleActive: {
    height: 36,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "0 14px",
    border: "none",
    borderRight: "1px solid #dfe7f4",
    background: "#f8fbff",
    color: "#1554d1",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  viewToggleButton: {
    height: 36,
    padding: "0 14px",
    border: "none",
    background: "#ffffff",
    color: "#31415f",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  weekNavigator: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 18,
    color: "#0f1b3d",
    fontSize: 15,
  },
  navButton: {
    width: 30,
    height: 30,
    display: "grid",
    placeItems: "center",
    border: "none",
    borderRadius: 8,
    background: "transparent",
    color: "#62708c",
    cursor: "pointer",
  },
  filterButton: {
    height: 36,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 7,
    border: "1px solid #dfe7f4",
    background: "#ffffff",
    color: "#46546b",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  scheduleWrap: {
    overflow: "auto",
  },
  scheduleGrid: {
    minWidth: 910,
    display: "grid",
    gridTemplateColumns: "150px repeat(7, minmax(112px, 1fr))",
  },
  employeeHead: {
    minHeight: 42,
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    borderRight: "1px solid #edf2f7",
    borderBottom: "1px solid #edf2f7",
    color: "#0f1b3d",
    fontSize: 13,
    fontWeight: 700,
  },
  dayHead: {
    minHeight: 42,
    display: "grid",
    placeItems: "center",
    borderRight: "1px solid #edf2f7",
    borderBottom: "1px solid #edf2f7",
    color: "#22304c",
    fontSize: 13,
    fontWeight: 700,
  },
  scheduleRowContents: {
    display: "contents",
  },
  employeeCell: {
    minHeight: 55,
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    borderRight: "1px solid #edf2f7",
    borderBottom: "1px solid #edf2f7",
    color: "#15233f",
    fontSize: 13,
    fontWeight: 700,
  },
  shiftCell: {
    minHeight: 55,
    display: "grid",
    placeItems: "center",
    padding: "7px 8px",
    borderRight: "1px solid #edf2f7",
    borderBottom: "1px solid #edf2f7",
  },
  shiftChip: {
    width: "100%",
    minHeight: 38,
    display: "grid",
    placeItems: "center",
    alignContent: "center",
    gap: 2,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    textAlign: "center",
  },
  legendRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(120px, 1fr))",
    gap: 12,
    padding: "16px 28px",
    background: "#ffffff",
  },
  legendItem: {
    display: "grid",
    gridTemplateColumns: "18px 1fr",
    columnGap: 8,
    rowGap: 2,
    alignItems: "center",
    color: "#46546b",
    fontSize: 12,
    fontWeight: 700,
  },
  legendDot: {
    width: 11,
    height: 11,
    borderRadius: "50%",
  },
  sideCard: {
    borderRadius: 11,
    border: "1px solid #dfe7f4",
    background: "#ffffff",
    padding: "16px 17px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.035)",
  },
  sideTitle: {
    margin: "0 0 12px",
    fontSize: 15,
    fontWeight: 800,
    color: "#0f1b3d",
  },
  sideStack: {
    display: "grid",
    gap: 12,
  },
  summaryMetric: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    minHeight: 72,
    borderRadius: 9,
    border: "1px solid #e3eaf4",
    background: "#ffffff",
    padding: "10px 12px",
  },
  metricIcon: {
    width: 46,
    height: 46,
    display: "grid",
    placeItems: "center",
    borderRadius: 10,
    flexShrink: 0,
  },
  metricValue: {
    display: "block",
    color: "#0f1b3d",
    fontSize: 18,
    lineHeight: 1,
  },
  metricLabel: {
    margin: "5px 0 3px",
    color: "#66708c",
    fontSize: 12,
    fontWeight: 600,
  },
  metricNote: {
    fontSize: 12,
    fontWeight: 700,
  },
  distributionWrap: {
    display: "grid",
    gridTemplateColumns: "110px 1fr",
    gap: 14,
    alignItems: "center",
  },
  donutChart: {
    width: 96,
    height: 96,
    borderRadius: "50%",
    background: "conic-gradient(#7ccf9a 0 56%, #6ca1ff 56% 84%, #9a7cf4 84% 96%, #cbd5e1 96% 100%)",
    position: "relative",
    boxShadow: "inset 0 0 0 22px #ffffff",
  },
  distributionList: {
    display: "grid",
    gap: 9,
    fontSize: 12,
    color: "#46546b",
    fontWeight: 600,
  },
  distributionItem: {
    display: "grid",
    gridTemplateColumns: "12px 1fr auto",
    alignItems: "center",
    gap: 8,
  },
  distributionDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    display: "inline-block",
  },
  checkList: {
    display: "grid",
    gap: 10,
  },
  checkRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    color: "#66708c",
    fontSize: 12,
    fontWeight: 600,
  },
  checkLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    color: "#66708c",
  },
  updateText: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    margin: 0,
    color: "#485875",
    fontSize: 12,
    fontWeight: 700,
  },
  updateSubtext: {
    margin: "8px 0 0 25px",
    color: "#7d8aa4",
    fontSize: 12,
    fontWeight: 600,
  },
};
