import ActivityFeedCard from "@/components/chat/cards/ActivityFeedCard";
import DecisionCard from "@/components/chat/cards/DecisionCard";
import ReminderMiniCard from "@/components/chat/cards/ReminderMiniCard";
import ShiftMiniCard from "@/components/chat/cards/ShiftMiniCard";
import TaskMiniCard from "@/components/chat/cards/TaskMiniCard";
import type { ActivityItem, PinnedDecision, ShiftCardItem } from "@/types/chat";
import type { Reminder } from "@/types/reminder";
import type { Task } from "@/types/task";

type ChatRightPanelProps = {
  shifts: ShiftCardItem[];
  reminders: Reminder[];
  tasks: Task[];
  decisions: PinnedDecision[];
  activities: ActivityItem[];
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

export default function ChatRightPanel({
  shifts,
  reminders,
  tasks,
  decisions,
  activities,
}: ChatRightPanelProps) {
  return (
    <aside className="hidden h-full min-h-0 flex-col gap-4 overflow-y-auto bg-slate-50 p-4 xl:flex">
      <Section title="Bugünkü vardiyalar">
        {shifts.map((shift) => (
          <ShiftMiniCard key={shift.id} shift={shift} />
        ))}
      </Section>

      <Section title="Yaklaşan hatırlatıcılar">
        {reminders.map((reminder) => (
          <ReminderMiniCard key={reminder.id} reminder={reminder} />
        ))}
      </Section>

      <Section title="Açık görevler">
        {tasks.map((task) => (
          <TaskMiniCard key={task.id} task={task} />
        ))}
      </Section>

      <Section title="Sabitlenen kararlar">
        {decisions.map((decision) => (
          <DecisionCard key={decision.id} decision={decision} />
        ))}
      </Section>

      <Section title="Son aktiviteler">
        {activities.map((item) => (
          <ActivityFeedCard key={item.id} item={item} />
        ))}
      </Section>
    </aside>
  );
}
