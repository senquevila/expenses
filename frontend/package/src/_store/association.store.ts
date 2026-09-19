import { create } from "zustand";
import { toast } from "sonner";
import {
  Association,
  CreateAssociationRequest,
  UpdateAssociationRequest,
} from "@/_models/association.model";
import { associationService } from "@/_services/association.service";

interface AssociationState {
  associations: Association[];
  loading: boolean;

  fetchAll: (params?: { account?: number; token?: string }) => Promise<void>;
  add: (data: CreateAssociationRequest) => Promise<void>;
  edit: (id: number, data: UpdateAssociationRequest) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export const useAssociationStore = create<AssociationState>((set) => ({
  associations: [],
  loading: false,

  fetchAll: async (params) => {
    set({ loading: true });
    try {
      const data = await associationService.getAll(params);
      set({ associations: data });
    } catch (error) {
      console.error("Failed to fetch associations:", error);
      toast.error("Failed to fetch associations");
    } finally {
      set({ loading: false });
    }
  },

  add: async (data) => {
    set({ loading: true });
    try {
      const created = await associationService.create(data);
      set((state) => ({ associations: [...state.associations, created] }));
      toast.success("Association created");
    } catch (error) {
      console.error("Failed to create association:", error);
      toast.error("Failed to create association");
    } finally {
      set({ loading: false });
    }
  },

  edit: async (id, data) => {
    set({ loading: true });
    try {
      const updated = await associationService.update(id, data);
      set((state) => ({
        associations: state.associations.map((a) =>
          a.id === id ? updated : a,
        ),
      }));
      toast.success("Association updated");
    } catch (error) {
      console.error("Failed to update association:", error);
      toast.error("Failed to update association");
    } finally {
      set({ loading: false });
    }
  },

  remove: async (id) => {
    set({ loading: true });
    try {
      await associationService.delete(id);
      set((state) => ({
        associations: state.associations.filter((a) => a.id !== id),
      }));
      toast.success("Association deleted");
    } catch (error) {
      console.error("Failed to delete association:", error);
      toast.error("Failed to delete association");
    } finally {
      set({ loading: false });
    }
  },
}));
