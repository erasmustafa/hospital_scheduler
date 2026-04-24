"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api";

type Conversation = {
  id: number;
  name: string;
  conversationType: string;
  createdAt: string;
  memberCount: number;
  lastMessage: {
    id: number;
    content: string;
    createdAt: string;
    sender: {
      id: number | null;
      username: string | null;
    };
  } | null;
};

type ConversationMessage = {
  id: number;
  content: string;
  createdAt: string;
  sender: {
    id: number | null;
    username: string | null;
  };
};

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      const data = await apiClient.get<{ conversations: Conversation[] }>(
        "/messages/conversations/"
      );
      setConversations(data.conversations);
      if (data.conversations.length > 0) {
        setSelectedConversationId((previous) => previous ?? data.conversations[0].id);
      } else {
        setSelectedConversationId(null);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mesaj kanalları alınamadı.");
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const loadMessages = useCallback(async () => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    try {
      const data = await apiClient.get<{ messages: ConversationMessage[] }>(
        `/messages/conversations/${selectedConversationId}/messages/`
      );
      setMessages(data.messages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mesajlar alınamadı.");
    } finally {
      setLoadingMessages(false);
    }
  }, [selectedConversationId]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const selectedConversation = useMemo(() => {
    return conversations.find((item) => item.id === selectedConversationId) ?? null;
  }, [conversations, selectedConversationId]);

  const filteredConversations = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("tr-TR");
    if (normalized.length === 0) {
      return conversations;
    }
    return conversations.filter((item) => {
      const haystack = `${item.name} ${item.lastMessage?.content ?? ""}`.toLocaleLowerCase(
        "tr-TR"
      );
      return haystack.includes(normalized);
    });
  }, [conversations, search]);

  const submitMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !selectedConversationId) return;

    setSending(true);
    try {
      const data = await apiClient.post<{ message: ConversationMessage }>(
        `/messages/conversations/${selectedConversationId}/messages/`,
        { content }
      );
      setMessages((previous) => [...previous, data.message]);
      setDraft("");
      setError(null);
      await loadConversations();
      
      // Auto-scroll logic could go here
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mesaj gönderilemedi.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main style={styles.main}>
      <div style={styles.layout}>
        {/* ── LEFT: CONVERSATION LIST ───────────────────────── */}
        <aside style={styles.sidebarCard}>
          <div style={styles.sidebarHeader}>
            <h1 style={styles.title}>Mesajlar</h1>
            <p style={styles.subtitle}>Duyuruları ve ekip iletişimini buradan yönetin.</p>
          </div>

          <div style={styles.searchWrap}>
            <span style={{ fontSize: 16, color: "#94a3b8" }}>🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kanallarda ara..."
              style={styles.searchInput}
            />
          </div>

          {loadingConversations && (
            <p style={{ fontSize: 13, color: "#64748b", margin: "16px 0" }}>
              Kanallar yükleniyor...
            </p>
          )}

          <div style={styles.conversationList}>
            {!loadingConversations && filteredConversations.length === 0 && (
              <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                Aramaya uygun kanal bulunamadı.
              </p>
            )}

            {filteredConversations.map((item) => {
              const isActive = selectedConversationId === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setSelectedConversationId(item.id)}
                  style={{
                    ...styles.conversationItem,
                    ...(isActive ? styles.conversationItemActive : {}),
                  }}
                >
                  <div style={styles.itemHeader}>
                    <p
                      style={{
                        ...styles.itemName,
                        color: isActive ? "#ffffff" : "#1e293b",
                      }}
                    >
                      {item.name}
                    </p>
                    <span
                      style={{
                        ...styles.itemBadge,
                        backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "#e2e8f0",
                        color: isActive ? "#ffffff" : "#475569",
                      }}
                    >
                      {item.memberCount} üye
                    </span>
                  </div>
                  <p
                    style={{
                      ...styles.itemPreview,
                      color: isActive ? "#bfdbfe" : "#64748b",
                    }}
                  >
                    {item.lastMessage?.content ?? "Henüz mesaj yok"}
                  </p>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── RIGHT: MESSAGE AREA ──────────────────────────── */}
        <section style={styles.chatCard}>
          <header style={styles.chatHeader}>
            <h2 style={styles.chatTitle}>
              {selectedConversation?.name ?? "Kanal seçin"}
            </h2>
            <p style={styles.chatSubtitle}>
              {selectedConversation
                ? `${selectedConversation.memberCount} üye`
                : "Soldan bir kanal seçerek yazışmaya başlayın."}
            </p>
          </header>

          {error && (
            <div style={styles.errorBanner}>{error}</div>
          )}

          <div style={styles.messageArea}>
            {loadingMessages && (
              <p style={{ fontSize: 13, color: "#64748b" }}>Mesajlar yükleniyor...</p>
            )}

            {!loadingMessages && messages.length === 0 && (
              <div style={styles.emptyMessages}>
                Bu kanalda henüz mesaj yok.
              </div>
            )}

            {messages.map((item) => (
              <article key={item.id} style={styles.messageBubble}>
                <div style={styles.bubbleHeader}>
                  <p style={styles.senderName}>
                    {item.sender.username ?? "Kullanıcı"}
                  </p>
                  <p style={styles.messageTime}>
                    {new Date(item.createdAt).toLocaleString("tr-TR")}
                  </p>
                </div>
                <p style={styles.messageText}>{item.content}</p>
              </article>
            ))}
          </div>

          <form onSubmit={submitMessage} style={styles.inputArea}>
            <div style={styles.inputWrap}>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  selectedConversationId
                    ? "Mesajınızı yazın..."
                    : "Önce bir kanal seçin..."
                }
                disabled={!selectedConversationId || sending}
                style={{
                  ...styles.textarea,
                  backgroundColor: !selectedConversationId ? "#f8fafc" : "#ffffff",
                }}
              />
              <button
                type="submit"
                disabled={
                  !selectedConversationId || sending || draft.trim().length === 0
                }
                style={{
                  ...styles.sendButton,
                  opacity:
                    !selectedConversationId || sending || draft.trim().length === 0
                      ? 0.6
                      : 1,
                }}
              >
                {sending ? "Gönderiliyor..." : "Gönder"}
              </button>
            </div>
          </form>
        </section>
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
  layout: {
    display: "grid",
    gridTemplateColumns: "340px 1fr",
    gap: 20,
    flex: 1,
    minHeight: 0,
  },

  /* ── sidebar ── */
  sidebarCard: {
    background: "#ffffff",
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
  },
  sidebarHeader: {
    padding: "24px 24px 16px",
    borderBottom: "1px solid #f1f5f9",
  },
  title: {
    fontSize: 20,
    fontWeight: 800,
    color: "#1e293b",
    margin: "0 0 4px 0",
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    margin: 0,
    lineHeight: 1.4,
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    margin: "16px 20px 8px",
    padding: "0 14px",
    height: 42,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    background: "transparent",
    border: "none",
    outline: "none",
    fontSize: 13,
    color: "#334155",
    fontFamily: "inherit",
  },
  conversationList: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "12px 20px 20px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  conversationItem: {
    width: "100%",
    minHeight: 76,
    padding: "14px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    background: "#ffffff",
    textAlign: "left" as const,
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
  },
  conversationItemActive: {
    background: "linear-gradient(135deg, #4A6CF7 0%, #3B5BDB 100%)",
    border: "1px solid transparent",
    boxShadow: "0 4px 12px rgba(74,108,247,0.3)",
  },
  itemHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 6,
  },
  itemName: {
    margin: 0,
    fontSize: 14,
    fontWeight: 700,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  itemBadge: {
    padding: "2px 8px",
    borderRadius: 20,
    fontSize: 10,
    fontWeight: 800,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    flexShrink: 0,
  },
  itemPreview: {
    margin: 0,
    fontSize: 12,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  /* ── chat area ── */
  chatCard: {
    background: "#ffffff",
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
  },
  chatHeader: {
    padding: "20px 24px",
    borderBottom: "1px solid #e2e8f0",
    background: "#ffffff",
    zIndex: 10,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#1e293b",
    margin: "0 0 4px 0",
  },
  chatSubtitle: {
    fontSize: 13,
    color: "#64748b",
    margin: 0,
  },
  errorBanner: {
    padding: "10px 24px",
    background: "#FEF2F2",
    borderBottom: "1px solid #FECACA",
    color: "#DC2626",
    fontSize: 13,
    fontWeight: 600,
  },
  messageArea: {
    flex: 1,
    background: "#f8fafc",
    padding: "24px",
    overflowY: "auto" as const,
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
  },
  emptyMessages: {
    padding: "20px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    fontSize: 13,
    color: "#64748b",
  },
  messageBubble: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "14px 18px",
    maxWidth: "85%",
    alignSelf: "flex-start",
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
  },
  bubbleHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 6,
  },
  senderName: {
    margin: 0,
    fontSize: 12,
    fontWeight: 800,
    color: "#475569",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  },
  messageTime: {
    margin: 0,
    fontSize: 11,
    color: "#94a3b8",
  },
  messageText: {
    margin: 0,
    fontSize: 14,
    color: "#1e293b",
    lineHeight: 1.5,
  },

  /* ── input area ── */
  inputArea: {
    padding: "20px 24px",
    background: "#ffffff",
    borderTop: "1px solid #e2e8f0",
  },
  inputWrap: {
    display: "flex",
    alignItems: "flex-end",
    gap: 12,
  },
  textarea: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    resize: "vertical" as const,
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: 14,
    fontFamily: "inherit",
    color: "#1e293b",
    outline: "none",
    transition: "border-color 0.2s",
  },
  sendButton: {
    height: 46,
    padding: "0 28px",
    background: "#1e293b",
    color: "#ffffff",
    border: "none",
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
};
