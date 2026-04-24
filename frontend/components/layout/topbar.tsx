"use client";

import { Bell, Search, X } from "lucide-react";
import { useUiStore } from "@/store/ui-store";

type TopbarProps = {
  title: string;
  subtitle: string;
};

export function Topbar({ title, subtitle }: TopbarProps) {
  const unreadCount = useUiStore((state) => state.unreadCount);

  return (
    <header style={styles.header}>
      <div style={styles.titleArea}>
        <h1 style={styles.title}>{title}</h1>
        <p style={styles.subtitle}>{subtitle}</p>
      </div>

      <div style={styles.actionsArea}>
        {/* ── SEARCH BOX ── */}
        <div style={styles.searchBox}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Panel içinde ara"
            style={styles.searchInput}
          />
          <span style={styles.searchShortcut}>⌘K</span>
        </div>

        {/* ── NOTIFICATIONS BUTTON ── */}
        <button type="button" style={styles.iconButton}>
          <Bell size={18} color="#475569" />
          {unreadCount > 0 && <span style={styles.unreadBadge}>{unreadCount}</span>}
        </button>

        {/* ── CLOSE/X BUTTON ── */}
        <button type="button" style={styles.iconButton}>
          <X size={18} color="#475569" />
        </button>

        {/* ── PROFILE WIDGET ── */}
        <div style={styles.profileWidget}>
          <div style={styles.avatar}>M</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={styles.profileName}>mustafa</span>
            <span style={styles.profileRole}>Yönetici</span>
          </div>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginLeft: 4 }}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════
   INLINE STYLES
   ═══════════════════════════════════════════════════════════ */

const styles: Record<string, React.CSSProperties> = {
  header: {
    height: 80,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 32px",
    background: "transparent", // It blends with the background of the app
    marginTop: 12,
  },
  titleArea: {
    display: "flex",
    flexDirection: "column",
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    color: "#1e293b",
    margin: "0 0 4px 0",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    margin: 0,
  },
  actionsArea: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "0 14px",
    height: 44,
    width: 260,
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
  },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: 13,
    color: "#334155",
    fontFamily: "inherit",
  },
  searchShortcut: {
    fontSize: 11,
    fontWeight: 700,
    color: "#94a3b8",
    background: "#f1f5f9",
    padding: "2px 6px",
    borderRadius: 6,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
    position: "relative",
  },
  unreadBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    backgroundColor: "#DC2626",
    borderRadius: "50%",
    border: "2px solid #ffffff",
  },
  profileWidget: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 40,
    padding: "4px 14px 4px 4px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    cursor: "pointer",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    backgroundColor: "#EEF2FF",
    color: "#4A6CF7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    fontWeight: 800,
  },
  profileName: {
    fontSize: 13,
    fontWeight: 700,
    color: "#1e293b",
    lineHeight: 1.2,
  },
  profileRole: {
    fontSize: 11,
    color: "#64748b",
  },
};
