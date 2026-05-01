"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  MessageSquare,
  Settings2,
  Sparkles,
  Users,
  PlaneTakeoff,
  Store,
} from "lucide-react";
import type { AuthUser } from "@/lib/auth";
import { useUiStore } from "@/store/ui-store";

const generalLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, managerOnly: false },
  { href: "/approvals", label: "Onaylar", icon: ClipboardCheck, managerOnly: false },
  { href: "/my-availability", label: "Izin/Uygunluk", icon: PlaneTakeoff, managerOnly: false },
  { href: "/shifts", label: "Vardiyalar", icon: ListChecks, managerOnly: true },
  { href: "/staff", label: "Personel", icon: Users, managerOnly: true },
  { href: "/shift-types", label: "Vardiya Tipleri", icon: Settings2, managerOnly: true },
  { href: "/auto-schedule", label: "Otomatik Liste", icon: Sparkles, managerOnly: true },
  { href: "/shift-market", label: "Vardiya Pazarı", icon: Store, managerOnly: false },
  { href: "/analytics", label: "Analiz", icon: BarChart3, managerOnly: true },
];

const userLinks = [
  { href: "/dashboard/chat", label: "Kurumsal Chat", icon: MessageSquare, managerOnly: false },
  { href: "/calendar", label: "Takvim", icon: CalendarDays, managerOnly: false },
];

type SidebarProps = {
  onLogout?: () => void;
  isLoggingOut?: boolean;
  user?: AuthUser | null;
};

function roleLabel(user?: AuthUser | null) {
  if (!user) return "Personel";
  if (user.isSuperuser) return "Yonetici";
  if (user.canManageDepartment) return "Birim Yetkilisi";
  return "Personel";
}

export function Sidebar({ onLogout, isLoggingOut = false, user = null }: SidebarProps) {
  const pathname = usePathname();
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const hasManagerAccess = Boolean(user?.isSuperuser || user?.canManageDepartment);
  const visibleGeneralLinks = generalLinks.filter(
    (link) =>
      (!link.managerOnly || hasManagerAccess) &&
      !(!hasManagerAccess && link.href === "/approvals") &&
      !(hasManagerAccess && link.href === "/my-availability")
  );
  const visibleUserLinks = userLinks.filter(
    (link) => !link.managerOnly || hasManagerAccess
  );
  const displayName =
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() ||
    user?.username ||
    "kullanici";
  const avatarLetter = (displayName[0] || "K").toUpperCase();
  const isActiveLink = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <aside
      style={{
        ...styles.sidebar,
        width: collapsed ? 80 : 280,
      }}
    >
      <div style={styles.header}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", overflow: "hidden" }}>
          <div style={styles.logoBox}>
            <Image
              src="/icons/medishift-brand.png"
              alt="MediShift"
              width={24}
              height={24}
              unoptimized
              style={styles.logoImage}
            />
          </div>
          {!collapsed && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={styles.logoText}>MediShift</span>
              <span style={styles.logoSubtext}>Akilli vardiya planlama sistemi</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={toggleSidebar}
          style={styles.menuButton}
          title={collapsed ? "Sidebar ac" : "Sidebar daralt"}
          aria-label={collapsed ? "Sidebar ac" : "Sidebar daralt"}
        >
          <Menu size={18} />
        </button>
      </div>

      <div style={styles.scrollArea}>
        <div style={styles.navGroup}>
          {!collapsed && <p style={styles.groupLabel}>GENEL</p>}
          <nav style={styles.nav}>
            {visibleGeneralLinks.map((link) => {
              const Icon = link.icon;
              const active = isActiveLink(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    ...styles.navItem,
                    backgroundColor: active ? "#ffffff" : "transparent",
                    color: active ? "#3B5BDB" : "rgba(255,255,255,0.8)",
                    justifyContent: collapsed ? "center" : "flex-start",
                    ...(active && !collapsed ? styles.activeNavIndicator : {}),
                  }}
                  title={collapsed ? link.label : undefined}
                >
                  <Icon size={20} style={{ flexShrink: 0, opacity: active ? 1 : 0.8 }} />
                  {!collapsed && <span style={styles.navLabel}>{link.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div style={styles.navGroup}>
          {!collapsed && <p style={styles.groupLabel}>KULLANICI</p>}
          <nav style={styles.nav}>
            {visibleUserLinks.map((link) => {
              const Icon = link.icon;
              const active = isActiveLink(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    ...styles.navItem,
                    backgroundColor: active ? "#ffffff" : "transparent",
                    color: active ? "#3B5BDB" : "rgba(255,255,255,0.8)",
                    justifyContent: collapsed ? "center" : "flex-start",
                    ...(active && !collapsed ? styles.activeNavIndicator : {}),
                  }}
                  title={collapsed ? link.label : undefined}
                >
                  <Icon size={20} style={{ flexShrink: 0, opacity: active ? 1 : 0.8 }} />
                  {!collapsed && <span style={styles.navLabel}>{link.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div style={styles.footer}>
        <div
          style={{
            ...styles.profileBox,
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
          <div style={styles.avatar}>{avatarLetter}</div>
          {!collapsed && (
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <span style={styles.profileName}>{displayName}</span>
              <span style={styles.profileRole}>{roleLabel(user)}</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          style={{
            ...styles.logoutButton,
            justifyContent: "center",
            opacity: isLoggingOut ? 0.75 : 1,
            cursor: isLoggingOut ? "wait" : "pointer",
          }}
          title={collapsed ? "Cikis Yap" : undefined}
        >
          <LogOut size={16} />
          {!collapsed && <span>{isLoggingOut ? "Cikis..." : "Logout"}</span>}
        </button>
      </div>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(180deg, #5F7BFF 0%, #4A6CF7 40%, #3B5BDB 100%)",
    color: "#ffffff",
    position: "sticky",
    top: 0,
    transition: "width 0.3s ease",
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    margin: "12px 0 12px 12px",
    height: "calc(100vh - 24px)",
    overflow: "hidden",
    boxShadow: "4px 0 24px rgba(59,91,219,0.15)",
  },
  header: {
    padding: "24px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  logoImage: {
    width: 24,
    height: 24,
    objectFit: "cover",
  },
  logoText: {
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    lineHeight: 1.1,
  },
  logoSubtext: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    whiteSpace: "nowrap",
  },
  menuButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    border: "none",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  scrollArea: {
    flex: 1,
    overflowY: "auto",
    padding: "0 16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 24,
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  },
  navGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  groupLabel: {
    margin: "0 0 0 12px",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.06em",
    color: "rgba(255,255,255,0.6)",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    borderRadius: 12,
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 600,
    transition: "all 0.2s",
    position: "relative",
  },
  activeNavIndicator: {
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  navLabel: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  footer: {
    padding: "20px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  profileBox: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "rgba(255,255,255,0.1)",
    padding: "10px",
    borderRadius: 16,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    backgroundColor: "#ffffff",
    color: "#3B5BDB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 800,
    flexShrink: 0,
  },
  profileName: {
    fontSize: 14,
    fontWeight: 700,
    color: "#ffffff",
    margin: 0,
    lineHeight: 1.2,
  },
  profileRole: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    margin: 0,
  },
  logoutButton: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px",
    backgroundColor: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 12,
    color: "#ffffff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    transition: "background 0.2s",
  },
};
