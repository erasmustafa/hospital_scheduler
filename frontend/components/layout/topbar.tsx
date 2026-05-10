"use client";

import { Bell, ChevronDown, Search } from "lucide-react";
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
        <label style={styles.searchBox}>
          <Search size={14} color="#71809b" />
          <input type="text" placeholder="Panel içinde ara" style={styles.searchInput} />
          <span style={styles.searchShortcut}>⌘K</span>
        </label>

        <button type="button" style={styles.iconButton} aria-label="Bildirimler">
          <Bell size={16} />
          {unreadCount > 0 ? <span style={styles.unreadBadge}>{unreadCount}</span> : null}
        </button>

        <button type="button" style={styles.profileWidget} aria-label="Profil menüsü">
          <span style={styles.avatar}>M</span>
          <span style={styles.profileText}>
            <strong>mustafa</strong>
            <small>Yönetici</small>
          </span>
          <ChevronDown size={13} />
        </button>
      </div>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    minHeight: 58,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    padding: "8px 18px 6px",
    background: "#f8fafc",
    borderBottom: "1px solid rgba(226, 232, 240, 0.74)",
    flexShrink: 0,
  },
  titleArea: {
    display: "grid",
    gap: 2,
    minWidth: 0,
  },
  title: {
    margin: 0,
    color: "#0f1b3d",
    fontSize: 17,
    fontWeight: 800,
    letterSpacing: "-0.015em",
    lineHeight: 1.15,
  },
  subtitle: {
    margin: 0,
    color: "#6b7892",
    fontSize: 11,
    fontWeight: 600,
    lineHeight: 1.25,
  },
  actionsArea: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },
  searchBox: {
    width: 230,
    height: 36,
    display: "flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid #dfe7f4",
    borderRadius: 9,
    background: "#ffffff",
    padding: "0 10px",
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.03)",
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#263b61",
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "inherit",
  },
  searchShortcut: {
    minWidth: 28,
    height: 20,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    background: "#f1f5f9",
    color: "#7b879d",
    fontSize: 10,
    fontWeight: 800,
  },
  iconButton: {
    position: "relative",
    width: 36,
    height: 36,
    display: "grid",
    placeItems: "center",
    borderRadius: 9,
    border: "1px solid #dfe7f4",
    background: "#ffffff",
    color: "#43536f",
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.03)",
  },
  unreadBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 17,
    height: 17,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    background: "#2563eb",
    color: "#ffffff",
    border: "2px solid #f8fafc",
    fontSize: 10,
    fontWeight: 800,
  },
  profileWidget: {
    height: 36,
    display: "inline-flex",
    alignItems: "center",
    gap: 9,
    border: "1px solid #dfe7f4",
    borderRadius: 18,
    background: "#ffffff",
    color: "#43536f",
    padding: "3px 9px 3px 4px",
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.03)",
  },
  avatar: {
    width: 28,
    height: 28,
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    background: "#eaf0ff",
    color: "#2456e8",
    fontSize: 13,
    fontWeight: 800,
  },
  profileText: {
    display: "grid",
    gap: 0,
    color: "#0f1b3d",
    fontSize: 12,
    lineHeight: 1.08,
    textAlign: "left",
  },
};
