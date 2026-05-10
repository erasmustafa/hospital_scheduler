"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { apiClient } from "@/lib/api";
import { getMe, logout as logoutRequest, type AuthUser } from "@/lib/auth";
import { RealtimeMessage } from "@/lib/websocket";
import { useWebsocket } from "@/hooks/use-websocket";
import { useUiStore } from "@/store/ui-store";

const DASHBOARD_LOADING_KEY = "medishift-dashboard-loading";
const DASHBOARD_MIN_VISIBLE_MS = 850;
const LOGOUT_REDIRECT_DELAY_MS = 650;
const STAFF_ALLOWED_PREFIXES = ["/dashboard", "/my-availability", "/calendar"];

const titleByPath: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Kontrol Paneli",
    subtitle: "Günün kritik metrikleri ve hızlı erişim alanı",
  },
  // Other paths don't display the topbar according to user request, 
  // but keeping structure extensible.
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const setUnreadCount = useUiStore((state) => state.setUnreadCount);
  const [showDashboardLoading, setShowDashboardLoading] = useState(false);
  const [showLogoutLoading, setShowLogoutLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(true);
  const isLogoutInFlight = useRef(false);
  const isLogin = pathname.startsWith("/login");
  const isSignup = pathname.startsWith("/signup");
  const isPublicLanding = pathname === "/";
  const isShellDisabled = isLogin || isSignup || isPublicLanding;

  const pageInfo = useMemo(() => {
    const match = Object.keys(titleByPath).find((key) =>
      pathname.startsWith(key)
    );
    return match ? titleByPath[match] : null;
  }, [pathname]);

  const hasManagerAccess = Boolean(
    currentUser?.isSuperuser || currentUser?.canManageDepartment
  );
  const canViewPath = useMemo(() => {
    if (!currentUser) {
      return false;
    }
    if (hasManagerAccess) {
      return true;
    }
    return STAFF_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  }, [currentUser, hasManagerAccess, pathname]);

  useEffect(() => {
    if (isShellDisabled) {
      setIsAuthorizing(false);
      return;
    }

    let isCancelled = false;
    setIsAuthorizing(true);

    void (async () => {
      try {
        const response = await getMe();
        if (isCancelled) {
          return;
        }
        setCurrentUser(response.user);
      } catch {
        if (isCancelled) {
          return;
        }
        setCurrentUser(null);
        router.replace("/login");
      } finally {
        if (!isCancelled) {
          setIsAuthorizing(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [isShellDisabled, router]);

  useEffect(() => {
    if (isShellDisabled || isAuthorizing || !currentUser || hasManagerAccess) {
      return;
    }
    if (!canViewPath) {
      router.replace("/dashboard");
    }
  }, [canViewPath, currentUser, hasManagerAccess, isAuthorizing, isShellDisabled, router]);

  const refreshNotifications = useCallback(async () => {
    if (isShellDisabled) {
      return;
    }
    try {
      const data = await apiClient.get<{
        notifications: Array<{ isRead: boolean }>;
      }>("/notifications/");
      const unread = data.notifications.filter((item) => !item.isRead).length;
      setUnreadCount(unread);
    } catch {
      setUnreadCount(0);
    }
  }, [isShellDisabled, setUnreadCount]);

  useEffect(() => {
    if (isShellDisabled) {
      return;
    }
    void refreshNotifications();
  }, [isShellDisabled, refreshNotifications]);

  const onNotification = useCallback(
    (message: RealtimeMessage) => {
      if (message.type === "notification.read") {
        const unreadCount = message.payload.unreadCount;
        if (typeof unreadCount === "number") {
          setUnreadCount(unreadCount);
          return;
        }
      }
      void refreshNotifications();
    },
    [refreshNotifications, setUnreadCount]
  );

  useWebsocket({
    path: "/notifications/",
    onMessage: onNotification,
    enabled: !isShellDisabled,
  });

  useEffect(() => {
    if (isShellDisabled || !pathname.startsWith("/dashboard")) {
      setShowDashboardLoading(false);
      return;
    }

    const shouldShow = window.sessionStorage.getItem(DASHBOARD_LOADING_KEY) === "1";
    if (!shouldShow) {
      return;
    }

    let isCancelled = false;
    let timerId: number | undefined;
    const start = Date.now();
    const hideOverlay = () => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, DASHBOARD_MIN_VISIBLE_MS - elapsed);
      timerId = window.setTimeout(() => {
        if (isCancelled) {
          return;
        }
        setShowDashboardLoading(false);
        window.sessionStorage.removeItem(DASHBOARD_LOADING_KEY);
      }, remaining);
    };

    setShowDashboardLoading(true);

    if (document.readyState === "complete") {
      hideOverlay();
    } else {
      window.addEventListener("load", hideOverlay, { once: true });
    }

    return () => {
      isCancelled = true;
      if (timerId) {
        window.clearTimeout(timerId);
      }
      window.removeEventListener("load", hideOverlay);
    };
  }, [isShellDisabled, pathname]);

  const handleLogout = useCallback(() => {
    if (isLogoutInFlight.current) {
      return;
    }

    isLogoutInFlight.current = true;
    setShowLogoutLoading(true);

    window.setTimeout(async () => {
      try {
        await logoutRequest();
      } catch {
        // Keep redirect behavior even if backend logout fails.
      } finally {
        document.cookie = "hwm_session=; Path=/; Max-Age=0; SameSite=Lax";
        setShowLogoutLoading(false);
        isLogoutInFlight.current = false;
        setCurrentUser(null);
        router.replace("/login");
        router.refresh();
      }
    }, LOGOUT_REDIRECT_DELAY_MS);
  }, [router]);

  if (isShellDisabled) {
    return <>{children}</>;
  }

  if (isAuthorizing || !currentUser || !canViewPath) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: "#f1f5f9",
          color: "#64748b",
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        Yetkiler kontrol ediliyor...
      </div>
    );
  }

  const isDashboard = pathname.startsWith("/dashboard");
  const shouldShowTopbar = isDashboard && !pathname.startsWith("/dashboard/chat");

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#f1f5f9",
      }}
    >
      {/* ── SIDEBAR ── */}
      <Sidebar
        onLogout={handleLogout}
        isLoggingOut={showLogoutLoading}
        user={currentUser}
      />

      {/* ── MAIN CONTENT ── */}
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          minWidth: 0,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {shouldShowTopbar && pageInfo && (
          <Topbar title={pageInfo.title} subtitle={pageInfo.subtitle} />
        )}
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>{children}</div>
      </div>

      {isDashboard && (
        <div
          className={`dashboard-loading-overlay${showDashboardLoading ? " is-visible" : ""}`}
          aria-hidden={!showDashboardLoading}
        >
          <div className="dashboard-loading-card">
            <div className="dashboard-loading-brand">
              <img src="/icons/medishift-brand.png" alt="MediShift" />
              <span>MediPlan</span>
            </div>
            <div className="dashboard-loading-title">Yükleniyor...</div>
            <p className="dashboard-loading-copy">
              Vardiya özeti, ekip metrikleri ve takvim verileri güvenli biçimde yükleniyor
            </p>
            <div className="dashboard-loading-progress">
              <span />
            </div>
            <div className="dashboard-loading-meta">Operasyon verileri senkronize ediliyor</div>
          </div>
        </div>
      )}

      <div
        className={`logout-loading-overlay${showLogoutLoading ? " is-visible" : ""}`}
        aria-hidden={!showLogoutLoading}
      >
        <div className="logout-loading-card">
          <div className="logout-loading-icon">
            <img src="/icons/medishift-brand.png" alt="MediShift" />
          </div>
          <div className="logout-loading-title">Çıkış yapılıyor...</div>
          <p className="logout-loading-copy">
            Oturum güvenli biçimde sonlandırılırken kısa bir an bekleyin.
          </p>
        </div>
      </div>
    </div>
  );
}
