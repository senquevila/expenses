import { create } from "zustand";
import { toast } from "sonner";
import { Period } from "@/_models/period.model";
import { periodService } from "@/_services/period.service";

interface PeriodState {
  periods: Period[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchAll: () => Promise<void>;
  add: (data: Omit<Period, "id">) => Promise<void>;
  toggle: (id: number) => Promise<void>;
  edit: (id: number, data: Partial<Omit<Period, "id">>) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export const usePeriodStore = create<PeriodState>((set) => ({
  periods: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const data = await periodService.getAll();
      set({ periods: data });
    } catch (error) {
      console.error("Failed to fetch periods:", error);
      toast.error("Failed to fetch periods");
    } finally {
      set({ loading: false });
    }
  },

  add: async (data) => {
    set({ loading: true, error: null });
    try {
      const newPeriod = await periodService.create(data);
      set((state) => ({ periods: [...state.periods, newPeriod] }));
      toast.success("Period created");
    } catch {
      toast.error("Failed to add period");
    } finally {
      set({ loading: false });
    }
  },

  toggle: async (id) => {
    set({ loading: true, error: null });
    try {
      const updated = await periodService.toggle(id);
      set((state) => ({
        periods: state.periods.map((p) => (p.id === id ? updated : p)),
      }));
      toast.success("Period updated");
    } catch {
      toast.error("Failed to toggle period");
    } finally {
      set({ loading: false });
    }
  },

  edit: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const updated = await periodService.update(id, data);
      set((state) => ({
        periods: state.periods.map((p) => (p.id === id ? updated : p)),
      }));
      toast.success("Period updated");
    } catch {
      toast.error("Failed to edit period");
    } finally {
      set({ loading: false });
    }
  },

  remove: async (id) => {
    set({ loading: true, error: null });
    try {
      await periodService.delete(id);
      set((state) => ({
        periods: state.periods.filter((p) => p.id !== id),
      }));
      toast.success("Period deleted");
    } catch {
      toast.error("Failed to delete period");
    } finally {
      set({ loading: false });
    }
  },
}));
