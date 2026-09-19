import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";

const SUMMARY_TTL_MS = 24 * 60 * 60 * 1000;

interface EntityService<TItem, TSummary, TCreate, TUpdate> {
  getAll: (isActive?: boolean) => Promise<TItem[]>;
  getSummary: () => Promise<TSummary>;
  create: (data: TCreate) => Promise<TItem>;
  update: (id: number, data: TUpdate) => Promise<TItem>;
  toggle: (id: number) => Promise<boolean>;
}

export interface EntityState<TItem, TSummary, TCreate, TUpdate> {
  items: TItem[];
  summary: TSummary | null;
  summaryFetchedAt: number | null;
  loading: boolean;
  summaryLoading: boolean;
  error: string | null;

  fetchAll: (isActive?: boolean) => Promise<void>;
  fetchSummary: (force?: boolean) => Promise<void>;
  add: (data: TCreate) => Promise<void>;
  edit: (id: number, data: TUpdate) => Promise<void>;
  toggle: (id: number) => Promise<void>;
}

export function createEntityStore<
  TItem extends { id: number; is_active: boolean },
  TSummary,
  TCreate,
  TUpdate,
>(
  service: EntityService<TItem, TSummary, TCreate, TUpdate>,
  label: string,
  persistName: string,
  labelPlural?: string,
) {
  const plural = labelPlural ?? `${label}s`;
  return create<EntityState<TItem, TSummary, TCreate, TUpdate>>()(
    persist(
      (set, get) => ({
        items: [],
        summary: null,
        summaryFetchedAt: null,
        loading: false,
        summaryLoading: false,
        error: null,

        fetchSummary: async (force = false) => {
          const { summary, summaryFetchedAt } = get();
          const isStale =
            !summaryFetchedAt || Date.now() - summaryFetchedAt > SUMMARY_TTL_MS;
          if (!force && summary && !isStale) return;

          set({ summaryLoading: true });
          try {
            const data = await service.getSummary();
            set({ summary: data, summaryFetchedAt: Date.now() });
          } catch (err) {
            console.error(
              `Failed to fetch ${plural.toLowerCase()} summary:`,
              err,
            );
            toast.error(`Failed to fetch ${plural.toLowerCase()} summary`);
          } finally {
            set({ summaryLoading: false });
          }
        },

        fetchAll: async (isActive?: boolean) => {
          set({ loading: true, error: null });
          try {
            const data = await service.getAll(isActive);
            set({ items: data });
          } catch {
            toast.error(`Failed to fetch ${plural.toLowerCase()}`);
          } finally {
            set({ loading: false });
          }
        },

        add: async (data) => {
          set({ loading: true, error: null });
          try {
            const newItem = await service.create(data);
            set((state) => ({ items: [...state.items, newItem] }));
            toast.success(`${label} created`);
            await get().fetchSummary(true);
          } catch (err) {
            console.error(`Failed to add ${label.toLowerCase()}:`, err);
            toast.error(`Failed to add ${label.toLowerCase()}`);
          } finally {
            set({ loading: false });
          }
        },

        edit: async (id, data) => {
          set({ loading: true, error: null });
          try {
            const updatedItem = await service.update(id, data);
            set((state) => ({
              items: state.items.map((item) =>
                item.id === id ? updatedItem : item,
              ),
            }));
            toast.success(`${label} updated`);
            await get().fetchSummary(true);
          } catch (err) {
            console.error(`Failed to update ${label.toLowerCase()}:`, err);
            toast.error(`Failed to update ${label.toLowerCase()}`);
          } finally {
            set({ loading: false });
          }
        },

        toggle: async (id) => {
          set({ loading: true, error: null });
          try {
            const isActive = await service.toggle(id);
            set((state) => ({
              items: state.items.map((item) =>
                item.id === id ? { ...item, is_active: isActive } : item,
              ),
            }));
            toast.success(
              `${label} marked as ${isActive ? "active" : "inactive"}`,
            );
            await get().fetchSummary(true);
          } catch {
            toast.error(`Failed to update ${label.toLowerCase()}`);
          } finally {
            set({ loading: false });
          }
        },
      }),
      {
        name: persistName,
        partialize: (state) => ({
          summary: state.summary,
          summaryFetchedAt: state.summaryFetchedAt,
        }),
      },
    ),
  );
}
