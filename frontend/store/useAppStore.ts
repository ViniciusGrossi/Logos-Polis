import { create } from 'zustand';

interface AppState {
  globalRegionFilter: string | null;
  setGlobalRegionFilter: (region: string | null) => void;
  
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  globalRegionFilter: null,
  setGlobalRegionFilter: (region) => set({ globalRegionFilter: region }),

  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
}));
