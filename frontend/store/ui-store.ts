import { create } from "zustand";

type UiState = {
  sidebarCollapsed: boolean;
  unreadCount: number;
  toggleSidebar: () => void;
  setUnreadCount: (count: number) => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  unreadCount: 0,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setUnreadCount: (count) => set({ unreadCount: count })
}));
