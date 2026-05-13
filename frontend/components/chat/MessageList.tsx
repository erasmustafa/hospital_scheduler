import MessageBubble from "@/components/chat/MessageBubble";
import { formatMessageDay } from "@/components/chat/utils/messageFormatters";
import type { Message } from "@/types/chat";
import type { MessageActionType } from "@/components/chat/overlays/MessageActionMenu";

type MessageListProps = {
  messages: Message[];
  isLoading: boolean;
  typingUsers: string[];
  onMessageAction: (message: Message, action: MessageActionType) => void;
};

export default function MessageList({
  messages,
  isLoading,
  typingUsers,
  onMessageAction,
}: MessageListProps) {
  let lastDay = "";

  return (
    <section
      className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.02), rgba(255,255,255,0.08)), url('/images/chat/chat-area-bg-v2.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="mx-auto max-w-5xl">
        {isLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm font-medium text-slate-500">
            Mesajlar yükleniyor...
          </div>
        ) : null}

        {!isLoading && messages.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-8 text-center text-sm text-slate-500">
            Bu kanalda henüz mesaj yok. İlk mesajı göndererek akışı başlatabilirsiniz.
          </div>
        ) : null}

        <div className="space-y-3">
          {messages.map((message) => {
            const dayLabel = formatMessageDay(message.createdAt);
            const showDay = dayLabel !== lastDay;
            lastDay = dayLabel;

            return (
              <div key={message.id} className="space-y-2">
                {showDay ? (
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[11px] font-bold text-slate-700 shadow-sm">
                      {dayLabel}
                    </span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>
                ) : null}

                <MessageBubble
                  message={message}
                  isOwnMessage={
                    message.sender.id === "current-user" ||
                    message.sender.name === "Mustafa Bedir" ||
                    message.sender.name === "Mustafa Demir"
                  }
                  onAction={onMessageAction}
                />
              </div>
            );
          })}
        </div>

        {typingUsers.length > 0 ? (
          <div className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-500 shadow-sm">
            <span className="flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.2s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:-0.1s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-blue-300" />
            </span>
            {typingUsers.join(", ")} yazıyor...
          </div>
        ) : null}
      </div>
    </section>
  );
}
