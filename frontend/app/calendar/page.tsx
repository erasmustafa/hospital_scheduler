import { CalendarBoard } from "@/components/calendar/calendar-board";

export default function CalendarPage() {
  return (
    <main
      style={{
        padding: "24px 30px",
        fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        boxSizing: "border-box",
        background: "linear-gradient(135deg, #f8fbff 0%, #f3f7ff 100%)",
      }}
    >
      <CalendarBoard />
    </main>
  );
}
