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
  link,
  children,
}: {
  title: string;
  link: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-black text-slate-950">{title}</h3>
        <button type="button" className="text-xs font-black text-blue-600">
          {link}
        </button>
      </div>
      <div className="space-y-3">{children}</div>
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
    <aside className="hidden min-h-0 flex-col gap-4 overflow-y-auto rounded-[28px] border border-slate-200 bg-slate-50/90 p-4 xl:flex">
      <Section title="Bugunku Vardiyalar" link="Tumunu Gor">
        {shifts.map((shift) => (
          <ShiftMiniCard key={shift.id} shift={shift} />
        ))}
      </Section>

      <Section title="Yaklasan Hatirlaticilar" link="Tumunu Gor">
        {reminders.map((reminder) => (
          <ReminderMiniCard key={reminder.id} reminder={reminder} />
        ))}
      </Section>

      <Section title="Acik Gorevler" link="Tum Gorevler">
        {tasks.map((task) => (
          <TaskMiniCard key={task.id} task={task} />
        ))}
      </Section>

      <Section title="Sabitlenen Kararlar" link="Tumunu Gor">
        {decisions.map((decision) => (
          <DecisionCard key={decision.id} decision={decision} />
        ))}
      </Section>

      <Section title="Son Aktiviteler" link="Tumunu Gor">
        {activities.map((item) => (
          <ActivityFeedCard key={item.id} item={item} />
        ))}
      </Section>
    </aside>
  );
}
