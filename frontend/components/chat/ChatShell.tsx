"use client";

import { useEffect, useMemo, useState } from "react";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatRightPanel from "@/components/chat/ChatRightPanel";
import ChatSidebar from "@/components/chat/ChatSidebar";
import MessageComposer from "@/components/chat/MessageComposer";
import MessageList from "@/components/chat/MessageList";
import useChannels from "@/components/chat/hooks/useChannels";
import useChatMessages from "@/components/chat/hooks/useChatMessages";
import useDepartments from "@/components/chat/hooks/useDepartments";
import useMessageActions from "@/components/chat/hooks/useMessageActions";
import usePlannerOverlay from "@/components/chat/hooks/usePlannerOverlay";
import useReminderEngine from "@/components/chat/hooks/useReminderEngine";
import CommandPalette from "@/components/chat/overlays/CommandPalette";
import CreateTaskModal from "@/components/chat/overlays/CreateTaskModal";
import FloatingPlanner from "@/components/chat/overlays/FloatingPlanner";
import ReminderPopover from "@/components/chat/overlays/ReminderPopover";
import parseSlashCommand from "@/components/chat/utils/parseSlashCommand";
import type { ActivityItem, Message, ShiftCardItem } from "@/types/chat";
import type { Reminder } from "@/types/reminder";
import type { Task } from "@/types/task";

const MOCK_SHIFTS: ShiftCardItem[] = [
  {
    id: "shift-1",
    staffName: "Emin Oral",
    shiftLabel: "Gunduz Vardiyasi",
    start: "08:00",
    end: "16:00",
    departmentId: "er",
  },
  {
    id: "shift-2",
    staffName: "Demet Çelik Gelen",
    shiftLabel: "Gece Vardiyasi",
    start: "16:00",
    end: "00:00",
    departmentId: "icu",
  },
];

const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: "act-1",
    title: "İzin talebi güncellendi",
    description: "Ameliyathane kanalındaki onay akışına yeni talep düştü.",
    createdAt: "2026-04-26T09:05:00",
    tone: "info",
  },
  {
    id: "act-2",
    title: "Görev tamamlandı",
    description: "Gece vardiyası doğrulama görevi başarıyla kapatıldı.",
    createdAt: "2026-04-26T10:12:00",
    tone: "success",
  },
];

type TaskModalDraft = {
  title: string;
  departmentId?: string;
} | null;

type ReminderModalDraft = {
  title: string;
  departmentId?: string;
} | null;

export default function ChatShell() {
  const [search, setSearch] = useState("");
  const [taskDraft, setTaskDraft] = useState<TaskModalDraft>(null);
  const [reminderDraft, setReminderDraft] = useState<ReminderModalDraft>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [composerPrefill, setComposerPrefill] = useState<string | null>(null);

  const {
    departments,
    activeDepartment,
    activeDepartmentId,
    setActiveDepartmentId,
  } = useDepartments();
  const { channels, activeChannel, activeChannelId, setActiveChannelId } =
    useChannels({ activeDepartmentId });
  const { messages, isLoading, typingUsers, sendMessage } = useChatMessages({
    channelId: activeChannelId,
    activeDepartmentId,
  });
  const planner = usePlannerOverlay();
  const reminderEngine = useReminderEngine();
  const messageActions = useMessageActions();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const visibleChannels = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("tr-TR");
    if (!normalized) {
      return channels;
    }

    return channels.filter((channel) =>
      `${channel.name} ${channel.description ?? ""}`
        .toLocaleLowerCase("tr-TR")
        .includes(normalized)
    );
  }, [channels, search]);

  const handleSend = (content: string) => {
    const slash = parseSlashCommand(content);
    const nextMessage = sendMessage(content);

    if (!slash.isCommand) {
      return;
    }

    if (slash.command === "task") {
      setTaskDraft({
        title: slash.args || nextMessage.content,
        departmentId: activeDepartmentId ?? undefined,
      });
    }

    if (slash.command === "reminder") {
      setReminderDraft({
        title: slash.args || nextMessage.content,
        departmentId: activeDepartmentId ?? undefined,
      });
    }

    if (slash.command === "agenda") {
      planner.openPlanner();
    }
  };

  const handleMessageAction = (message: Message, action: string) => {
    if (action === "reply") {
      setComposerPrefill(`@${message.sender.name} `);
      return;
    }

    if (action === "create_task") {
      setTaskDraft({
        title: message.content,
        departmentId: message.departmentId,
      });
      return;
    }

    if (action === "create_reminder") {
      setReminderDraft({
        title: message.content,
        departmentId: message.departmentId,
      });
      return;
    }

    if (action === "add_to_agenda") {
      planner.addPlannerItem(messageActions.addMessageToAgenda(message));
      planner.openPlanner();
      return;
    }

    if (action === "mark_as_decision") {
      messageActions.markAsDecision(message);
      return;
    }

    if (action === "pin") {
      messageActions.pinMessage(message.id);
      return;
    }

    if (action === "copy_link" && typeof navigator !== "undefined") {
      void navigator.clipboard.writeText(`chat://${message.channelId}/${message.id}`);
    }
  };

  const handleTaskCreate = (task: Task) => {
    messageActions.addTask(task);
  };

  const handleReminderCreate = (reminder: Reminder) => {
    reminderEngine.createReminder(reminder);
  };

  return (
    <div className="h-full min-h-0 overflow-hidden bg-[#F4F7FB] p-4 xl:p-5">
      <div className="grid h-full min-h-0 grid-cols-1 gap-4 rounded-[30px] border border-slate-200 bg-white p-3 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.28)] xl:grid-cols-[222px_minmax(0,1fr)_289px]">
        <ChatSidebar
          search={search}
          onSearchChange={setSearch}
          channels={visibleChannels}
          activeChannelId={activeChannelId}
          onSelectChannel={setActiveChannelId}
          departments={departments}
          activeDepartmentId={activeDepartmentId}
          onSelectDepartment={setActiveDepartmentId}
        />

        <main className="relative flex min-w-0 min-h-0 flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white">
          <ChatHeader
            activeChannel={activeChannel}
            activeDepartment={activeDepartment}
            onOpenPlanner={planner.openPlanner}
            onOpenReminder={() =>
              setReminderDraft({
                title: "",
                departmentId: activeDepartmentId ?? undefined,
              })
            }
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          />
          <MessageList
            messages={messages}
            isLoading={isLoading}
            typingUsers={typingUsers}
            onMessageAction={handleMessageAction}
          />
          <MessageComposer
            onSend={handleSend}
            prefillText={composerPrefill}
            onPrefillConsumed={() => setComposerPrefill(null)}
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          />
        </main>

        <ChatRightPanel
          shifts={MOCK_SHIFTS}
          reminders={reminderEngine.upcomingReminders}
          tasks={messageActions.openTasks}
          decisions={messageActions.pinnedDecisions}
          activities={MOCK_ACTIVITIES}
        />

        <FloatingPlanner
          open={planner.isOpen}
          selectedDate={planner.selectedDate}
          onSelectDate={planner.setSelectedDate}
          onClose={planner.closePlanner}
          plannerItems={planner.plannerItems}
          todaysItems={planner.todaysItems}
          shifts={MOCK_SHIFTS}
          tasks={messageActions.openTasks}
          reminders={reminderEngine.upcomingReminders}
          departments={departments}
        />

        <CreateTaskModal
          open={Boolean(taskDraft)}
          initialTitle={taskDraft?.title}
          departmentId={taskDraft?.departmentId}
          onClose={() => setTaskDraft(null)}
          onCreate={handleTaskCreate}
        />

        <ReminderPopover
          open={Boolean(reminderDraft)}
          initialTitle={reminderDraft?.title}
          departmentId={reminderDraft?.departmentId}
          onClose={() => setReminderDraft(null)}
          onCreate={handleReminderCreate}
        />

        <CommandPalette
          open={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          onRunCommand={(value) => {
            if (value.includes("Hatırlatıcı")) {
              setReminderDraft({ title: "", departmentId: activeDepartmentId ?? undefined });
            }
            if (value.includes("Yeni görev")) {
              setTaskDraft({ title: "", departmentId: activeDepartmentId ?? undefined });
            }
            if (value.includes("Karar")) {
              planner.openPlanner();
            }
          }}
        />
      </div>
    </div>
  );
}
