"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  FolderArchive,
  GitBranch,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Sparkles,
  Users,
  PlaneTakeoff,
  Store,
  ChevronRight,
} from "lucide-react";
import type { AuthUser } from "@/lib/auth";
import { useUiStore } from "@/store/ui-store";

const generalLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, managerOnly: false },
  { href: "/approvals", label: "Onaylar", icon: ClipboardCheck, managerOnly: false },
  { href: "/my-availability", label: "İzin/Uygunluk", icon: PlaneTakeoff, managerOnly: false },
  { href: "/shifts", label: "Vardiyalar", icon: ListChecks, managerOnly: true },
  { href: "/staff", label: "Personel", icon: Users, managerOnly: true },
  { href: "/auto-schedule", label: "Otomatik Liste", icon: Sparkles, managerOnly: true },
  { href: "/shift-market", label: "Vardiya Pazarı", icon: Store, managerOnly: false },
  { href: "/analytics", label: "Analiz", icon: BarChart3, managerOnly: true },
];

const userLinks = [
  { href: "/dashboard/chat", label: "Kurumsal Chat", icon: MessageSquare, managerOnly: false },
  { href: "/calendar", label: "Takvim", icon: CalendarDays, managerOnly: false },
];

const managerProfileLinks = [
  { href: "/archive", label: "Arşiv / Evrak", icon: FolderArchive },
  { href: "/settings", label: "Ayarlar", icon: Settings },
  { href: "/department-control", label: "Birim Kontrolü", icon: GitBranch },
];

type SidebarProps = {
  onLogout?: () => void;
  isLoggingOut?: boolean;
  user?: AuthUser | null;
};

function roleLabel(user?: AuthUser | null) {
  if (!user) return "Personel";
  if (user.isSuperuser) return "Yönetici";
  if (user.canManageDepartment) return "Birim Yetkilisi";
  return "Personel";
}

export function Sidebar({ onLogout, isLoggingOut = false, user = null }: SidebarProps) {
  const pathname = usePathname();
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
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
    <>
    <style jsx global>{`
      @keyframes medishiftSidebarSpin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `}</style>
    <aside
      style={{
        ...styles.sidebar,
        width: collapsed ? 80 : 252,
      }}
    >
      <div style={styles.header}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", overflow: "hidden" }}>
          <button
            type="button"
            onClick={collapsed ? toggleSidebar : undefined}
            style={{
              ...styles.logoButton,
              cursor: collapsed ? "pointer" : "default",
            }}
            title={collapsed ? "Sidebar ac" : undefined}
            aria-label={collapsed ? "Sidebar ac" : undefined}
          >
          <div
            style={{
              ...styles.logoBox,
              ...(collapsed ? styles.collapsedLogoBox : {}),
            }}
          >
            <Image
              src="/icons/medishift-brand.png"
              alt="MediShift"
              width={30}
              height={30}
              unoptimized
              style={styles.logoImage}
            />
          </div>
          </button>
          {!collapsed && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={styles.logoText}>MediShift</span>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            type="button"
            onClick={toggleSidebar}
            style={styles.menuButton}
            title="Sidebar daralt"
            aria-label="Sidebar daralt"
          >
            <Menu size={18} />
          </button>
        )}
      </div>

      <div style={styles.scrollArea}>
        <div style={styles.navGroup}>
          {!collapsed && <p style={styles.groupLabel}>GENEL</p>}
          <nav style={styles.nav}>
            {visibleGeneralLinks.map((link) => {
              const Icon = link.icon;
              const active = isActiveLink(link.href);
              const hovered = hoveredHref === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onMouseEnter={() => setHoveredHref(link.href)}
                  onMouseLeave={() => setHoveredHref((current) => (current === link.href ? null : current))}
                  style={{
                    ...styles.navItem,
                    backgroundColor: active
                      ? "#ffffff"
                      : hovered
                        ? "rgba(255,255,255,0.12)"
                        : "transparent",
                    color: active ? "#3B5BDB" : "rgba(255,255,255,0.88)",
                    justifyContent: collapsed ? "center" : "flex-start",
                    border: hovered && !active ? "1px solid rgba(255,255,255,0.16)" : "1px solid transparent",
                    boxShadow: hovered && !active ? "0 10px 20px rgba(30,64,175,0.14)" : "none",
                    transform: hovered && !active ? "translateX(2px)" : "translateX(0)",
                    backdropFilter: hovered && !active ? "blur(12px)" : "none",
                    ...(active && !collapsed ? styles.activeNavIndicator : {}),
                  }}
                  title={collapsed ? link.label : undefined}
                >
                  <Icon size={20} style={{ flexShrink: 0, opacity: active || hovered ? 1 : 0.82 }} />
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
              const hovered = hoveredHref === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onMouseEnter={() => setHoveredHref(link.href)}
                  onMouseLeave={() => setHoveredHref((current) => (current === link.href ? null : current))}
                  style={{
                    ...styles.navItem,
                    backgroundColor: active
                      ? "#ffffff"
                      : hovered
                        ? "rgba(255,255,255,0.12)"
                        : "transparent",
                    color: active ? "#3B5BDB" : "rgba(255,255,255,0.88)",
                    justifyContent: collapsed ? "center" : "flex-start",
                    border: hovered && !active ? "1px solid rgba(255,255,255,0.16)" : "1px solid transparent",
                    boxShadow: hovered && !active ? "0 10px 20px rgba(30,64,175,0.14)" : "none",
                    transform: hovered && !active ? "translateX(2px)" : "translateX(0)",
                    backdropFilter: hovered && !active ? "blur(12px)" : "none",
                    ...(active && !collapsed ? styles.activeNavIndicator : {}),
                  }}
                  title={collapsed ? link.label : undefined}
                >
                  <Icon size={20} style={{ flexShrink: 0, opacity: active || hovered ? 1 : 0.82 }} />
                  {!collapsed && <span style={styles.navLabel}>{link.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div style={styles.footer}>
        <div
          role={hasManagerAccess ? "button" : undefined}
          tabIndex={hasManagerAccess ? 0 : undefined}
          onClick={() => {
            if (!collapsed && hasManagerAccess) {
              setProfileMenuOpen((value) => !value);
            }
          }}
          style={{
            ...styles.profileBox,
            justifyContent: collapsed ? "center" : "flex-start",
            cursor: !collapsed && hasManagerAccess ? "pointer" : "default",
          }}
        >
          <div style={styles.avatar}>{avatarLetter}</div>
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <span style={styles.profileName}>{displayName}</span>
                <span style={styles.profileRole}>{roleLabel(user)}</span>
              </div>
              {hasManagerAccess && (
                <ChevronRight
                  size={15}
                  style={{
                    color: "rgba(255,255,255,0.75)",
                    transform: profileMenuOpen ? "translateX(2px)" : "translateX(0)",
                    transition: "transform 160ms ease",
                    flexShrink: 0,
                  }}
                />
              )}
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
            title={collapsed ? "Çıkış Yap" : undefined}
        >
          <LogOut size={16} />
          {!collapsed && <span>{isLoggingOut ? "Çıkış..." : "Logout"}</span>}
        </button>
      </div>
    </aside>
    {!collapsed && hasManagerAccess && profileMenuOpen && (
      <div style={styles.profileMenu}>
        {managerProfileLinks.map((item) => {
          const Icon = item.icon;
          const active = isActiveLink(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setProfileMenuOpen(false)}
              style={{
                ...styles.profileMenuItem,
                ...(active ? styles.profileMenuItemActive : {}),
              }}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    )}
    </>
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
    width: 44,
    height: 44,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  logoButton: {
    padding: 0,
    margin: 0,
    border: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  collapsedLogoBox: {
    animation: "medishiftSidebarSpin 6s linear infinite",
    transformOrigin: "center",
  },
  logoImage: {
    width: 30,
    height: 30,
    objectFit: "cover",
  },
  logoText: {
    fontSize: 20,
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
    transition: "background 160ms ease, box-shadow 160ms ease",
  },
  profileMenu: {
    position: "fixed",
    left: 276,
    bottom: 94,
    zIndex: 80,
    width: 210,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: "10px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.96)",
    border: "1px solid rgba(219,229,246,0.92)",
    boxShadow: "0 22px 50px rgba(30,64,175,0.18)",
    backdropFilter: "blur(18px)",
  },
  profileMenuItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minHeight: 42,
    padding: "0 12px",
    borderRadius: 12,
    color: "#334155",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 700,
    transition: "background 160ms ease, transform 160ms ease",
  },
  profileMenuItemActive: {
    color: "#3B5BDB",
    background: "#eef2ff",
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
