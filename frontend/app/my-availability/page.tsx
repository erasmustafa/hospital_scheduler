"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api";
import { getMe } from "@/lib/auth";
import {
  AvailabilityMonthBoard,
  type AvailabilityDayState,
} from "@/components/calendar/availability-month-board";
import { CompactRequestForm } from "@/components/forms/compact-request-form";

type ShiftTypeOption = {
  id: number;
  name: string;
};

type AvailabilityRequestRow = {
  id: number;
  staffProfileName: string;
  departmentName: string;
  shiftTypeName: string | null;
  startDate: string;
  endDate: string;
  requestType: string;
  notes: string;
  approvalStatus: "pending" | "approved" | "rejected";
  created_at: string;
};

type CalendarEvent = {
  start: string;
  title?: string;
  extendedProps?: {
    kind?: string;
    availabilityStatus?: string;
    label?: string;
    hours?: string;
    department?: string;
    note?: string;
    shift_type?: string;
  };
};

const requestTypeLabel: Record<string, string> = {
  leave: "İzin",
  unavailable: "Uygun Değil",
  preferred_off: "Tercihli Boş Gün",
};

function formatDateLabel(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateRange(startDate: string, endDate: string) {
  const start = formatDateLabel(startDate);
  const end = formatDateLabel(endDate);
  return startDate === endDate ? start : `${start} - ${end}`;
}

export default function MyAvailabilityPage() {
  const [requests, setRequests] = useState<AvailabilityRequestRow[]>([]);
  const [shiftTypes, setShiftTypes] = useState<ShiftTypeOption[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [form, setForm] = useState({
    requestType: "leave" as "leave" | "unavailable" | "preferred_off",
    shiftTypeId: "",
    notes: "",
  });

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      const me = await getMe();
      const [requestResponse, shiftTypeResponse] = await Promise.all([
        apiClient.get<{ availabilityRequests: AvailabilityRequestRow[] }>(
          "/availability-requests/"
        ),
        apiClient.get<{ shiftTypes: ShiftTypeOption[] }>("/shift-types/"),
      ]);

      setRequests(requestResponse.availabilityRequests);
      setShiftTypes(shiftTypeResponse.shiftTypes);

      if (me.user.staffProfileId) {
        const eventsResponse = await apiClient.get<{ events: CalendarEvent[] }>(
          `/staff-calendar/events/?staffProfileId=${me.user.staffProfileId}`
        );
        setCalendarEvents(eventsResponse.events);
      } else {
        setCalendarEvents([]);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sayfa verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const dayStateMap = useMemo(() => {
    const map = new Map<string, AvailabilityDayState>();

    for (const event of calendarEvents) {
      const dateKey = event.start?.slice(0, 10);
      if (!dateKey) continue;

      const kind = event.extendedProps?.kind;
      const availabilityStatus = event.extendedProps?.availabilityStatus;

      if (kind === "availability") {
        if (availabilityStatus === "leave" || availabilityStatus === "unavailable") {
          map.set(dateKey, {
            tone: "leave",
            title: event.extendedProps?.label || event.title || "İzin",
            note: event.extendedProps?.note || "",
          });
        } else if (availabilityStatus === "preferred_off") {
          map.set(dateKey, {
            tone: "preferred",
            title: event.extendedProps?.label || event.title || "Tercihli Boş Gün",
            note: event.extendedProps?.note || "",
          });
        }
      } else if (kind === "assignment" && !map.has(dateKey)) {
        map.set(dateKey, {
          tone: "assignment",
          title: event.extendedProps?.shift_type || event.title || "Planlı Vardiya",
          note: event.extendedProps?.hours || "",
        });
      }
    }

    for (const request of requests) {
      if (request.approvalStatus !== "pending") continue;

      let current = new Date(`${request.startDate}T12:00:00`);
      const end = new Date(`${request.endDate}T12:00:00`);

      while (current <= end) {
        const key = current.toISOString().slice(0, 10);
        map.set(key, {
          tone: "pending",
          title: `${requestTypeLabel[request.requestType] || request.requestType} Bekliyor`,
          note: request.shiftTypeName || "Tüm vardiyalar",
        });
        current.setDate(current.getDate() + 1);
      }
    }

    return map;
  }, [calendarEvents, requests]);

  const selectedDateLabel = useMemo(() => {
    if (selectedDates.length === 0) {
      return "Takvimden bir veya birden fazla gün seç";
    }

    return selectedDates.map((item) => formatDateLabel(item)).join(", ");
  }, [selectedDates]);

  const handleDateToggle = useCallback((dateValue: string) => {
    setSelectedDates((previous) =>
      previous.includes(dateValue)
        ? previous.filter((item) => item !== dateValue)
        : [...previous, dateValue].sort()
    );
  }, []);

  const handleSubmit = async () => {
    if (selectedDates.length === 0) {
      setError("Lütfen en az bir gün seç.");
      return;
    }

    setSaving(true);
    try {
      await apiClient.post("/availability-requests/", {
        startDate: selectedDates[0],
        endDate: selectedDates[selectedDates.length - 1],
        requestType: form.requestType,
        shiftTypeId: form.shiftTypeId ? Number(form.shiftTypeId) : null,
        notes: form.notes.trim(),
      });

      setSelectedDates([]);
      setForm({
        requestType: "leave",
        shiftTypeId: "",
        notes: "",
      });
      await loadPage();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Talep oluşturulamadı.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main style={styles.main}>
      <div style={styles.pageWrap}>
        <section style={styles.layout}>
          <section style={styles.availabilityPanel}>
            <AvailabilityMonthBoard
              selectedDates={selectedDates}
              dayStateMap={dayStateMap}
              onDateToggle={handleDateToggle}
            />
          </section>

          <section style={styles.rightRail}>
            <CompactRequestForm
              requestType={form.requestType}
              shiftTypeId={form.shiftTypeId}
              notes={form.notes}
              selectedDates={selectedDates}
              selectedDateLabel={selectedDateLabel}
              shiftTypes={shiftTypes}
              saving={saving}
              error={error}
              onRequestTypeChange={(value) =>
                setForm((previous) => ({ ...previous, requestType: value }))
              }
              onShiftTypeChange={(value) =>
                setForm((previous) => ({ ...previous, shiftTypeId: value }))
              }
              onNotesChange={(value) =>
                setForm((previous) => ({ ...previous, notes: value }))
              }
              onClear={() => {
                setSelectedDates([]);
                setForm({
                  requestType: "leave",
                  shiftTypeId: "",
                  notes: "",
                });
                setError(null);
              }}
              onSubmit={() => void handleSubmit()}
            />

            <section style={styles.requestListCard}>
              <h3 style={styles.cardTitle}>Taleplerim</h3>
              <p style={styles.cardText}>
                Yetkili onayından geçen talepler takvimde işlenir ve planlamada dikkate
                alınır.
              </p>

              <div style={styles.requestList}>
                {loading ? (
                  <div style={styles.emptyState}>Yükleniyor...</div>
                ) : requests.length === 0 ? (
                  <div style={styles.emptyState}>
                    Henüz talep bulunmuyor. Takvim üzerinden gün seçerek ilk talebini
                    oluşturabilirsin.
                  </div>
                ) : (
                  requests.map((item) => (
                    <div key={item.id} style={styles.requestItem}>
                      <div style={styles.requestItemHead}>
                        <strong>{formatDateRange(item.startDate, item.endDate)}</strong>
                        <div style={styles.requestMeta}>
                          <span style={styles.requestTag}>
                            {requestTypeLabel[item.requestType] || item.requestType}
                          </span>
                          <span style={styles.requestTag}>
                            {item.shiftTypeName || "Tüm Vardiyalar"}
                          </span>
                          <span
                            style={{
                              ...styles.requestTag,
                              ...(item.approvalStatus === "pending" ? styles.pendingTag : {}),
                              ...(item.approvalStatus === "approved" ? styles.approvedTag : {}),
                              ...(item.approvalStatus === "rejected" ? styles.rejectedTag : {}),
                            }}
                          >
                            {item.approvalStatus === "pending"
                              ? "Bekliyor"
                              : item.approvalStatus === "approved"
                                ? "Onaylandı"
                                : "Reddedildi"}
                          </span>
                        </div>
                      </div>

                      <p style={styles.requestText}>{item.notes || "Not girilmedi."}</p>
                      <small style={styles.requestSmall}>
                        Oluşturulma:{" "}
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString("tr-TR")
                          : "-"}
                      </small>
                    </div>
                  ))
                )}
              </div>
            </section>
          </section>
        </section>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    padding: "20px 24px",
    fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 0,
    overflow: "auto",
    boxSizing: "border-box",
    background: "#f1f5f9",
  },
  pageWrap: {
    display: "grid",
    gap: 0,
    minHeight: 0,
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(420px, 460px)",
    gap: 16,
    alignItems: "stretch",
    minHeight: 0,
    height: "calc(100dvh - 40px)",
  },
  availabilityPanel: {
    background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
    border: "1px solid #dbe7f1",
    borderRadius: 24,
    boxShadow: "0 18px 42px rgba(35, 67, 99, 0.08)",
    padding: "18px 18px 16px",
    minHeight: 0,
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  rightRail: {
    display: "grid",
    gridTemplateRows: "auto minmax(0, 1fr)",
    gap: 16,
    width: "100%",
    minHeight: 0,
    height: "100%",
  },
  requestListCard: {
    background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
    border: "1px solid #dbe7f1",
    borderRadius: 22,
    boxShadow: "0 14px 34px rgba(35, 67, 99, 0.07)",
    padding: 16,
    display: "grid",
    gap: 8,
    minHeight: 0,
    height: "100%",
    overflow: "hidden",
  },
  cardTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 800,
    color: "#17324d",
    letterSpacing: "-0.03em",
  },
  cardText: {
    margin: "2px 0 0",
    color: "#6f8298",
    fontSize: 12,
    lineHeight: 1.45,
  },
  requestList: {
    display: "grid",
    gap: 8,
    marginTop: 2,
    minHeight: 0,
    overflowY: "auto",
    paddingRight: 4,
  },
  requestItem: {
    border: "1px solid #e1eaf2",
    borderRadius: 16,
    padding: "12px 14px",
    display: "grid",
    gap: 6,
    background: "#fff",
  },
  requestItemHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
  },
  requestMeta: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  requestTag: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 9px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    background: "#edf4ff",
    color: "#3a66df",
  },
  pendingTag: {
    background: "#fff3e0",
    color: "#9b680c",
  },
  approvedTag: {
    background: "#e8f8ee",
    color: "#25724b",
  },
  rejectedTag: {
    background: "#fff0f0",
    color: "#b54747",
  },
  requestText: {
    margin: 0,
    color: "#6f8298",
    fontSize: 11,
    lineHeight: 1.45,
  },
  requestSmall: {
    color: "#6f8298",
    fontSize: 11,
    lineHeight: 1.45,
  },
  emptyState: {
    border: "1px dashed #d6e2ec",
    borderRadius: 16,
    padding: 18,
    textAlign: "center",
    color: "#73859a",
    background: "#f8fbff",
  },
};
