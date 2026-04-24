import { CalendarBoard } from "@/components/calendar/calendar-board";

export default function CalendarPage() {
  return (
    <main
      style={{
        padding: "28px 32px",
        fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        boxSizing: "border-box",
        background: "#f1f5f9",
      }}
    >
      <CalendarBoard />
    </main>
  );
}
