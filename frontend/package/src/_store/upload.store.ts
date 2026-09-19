import { create } from "zustand";
import { toast } from "sonner";
import axios from "axios";
import { ZodError } from "zod";
import { Upload, CreateUploadRequest } from "@/_models/upload.model";
import { uploadService } from "@/_services/upload.service";

function getUploadErrorMessage(
  error: unknown,
  action: "create" | "delete" | "fetch" = "create",
): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return "Network error — check your connection";
    const { status, data } = error.response;
    if (status === 404)
      return "Upload not found — it may have already been deleted";
    if (status === 413) return "File is too large";
    if (status === 415) return "File format is not supported";
    if (status === 400) {
      const detail =
        data?.detail ?? data?.file?.[0] ?? data?.non_field_errors?.[0];
      return detail ?? "Invalid request";
    }
    if (status === 401 || status === 403) return "Not authorized";
    if (status >= 500) return "Server error — please try again later";
  }
  if (error instanceof ZodError) return "Unexpected response from server";
  if (action === "delete") return "Failed to delete upload";
  if (action === "fetch") return "Failed to fetch uploads";
  return "Failed to create upload";
}

interface UploadFilters {
  identifier?: string;
  upload_type?: string;
}

interface UploadState {
  uploads: Upload[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  filters: UploadFilters;

  fetchPage: (page?: number) => Promise<void>;
  setFilters: (filters: UploadFilters) => Promise<void>;
  add: (data: CreateUploadRequest) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export const useUploadStore = create<UploadState>((set, get) => ({
  uploads: [],
  count: 0,
  page: 1,
  pageSize: 10,
  totalPages: 1,
  loading: false,
  filters: {},

  fetchPage: async (page = 1) => {
    set({ loading: true });
    try {
      const data = await uploadService.getPage(page, get().filters);
      const pageSize = data.next ? data.results.length : get().pageSize;
      const totalPages = Math.ceil(data.count / pageSize) || 1;
      set({
        uploads: data.results,
        count: data.count,
        page,
        pageSize,
        totalPages,
      });
    } catch (e) {
      toast.error(getUploadErrorMessage(e, "fetch"));
    } finally {
      set({ loading: false });
    }
  },

  setFilters: async (filters) => {
    set({ filters });
    await get().fetchPage(1);
  },

  add: async (data) => {
    set({ loading: true });
    try {
      const newUpload = await uploadService.create(data);
      set((state) => ({
        uploads: [newUpload, ...state.uploads],
        count: state.count + 1,
        totalPages: Math.ceil((state.count + 1) / state.pageSize) || 1,
      }));
      toast.success("Upload created");
    } catch (e) {
      toast.error(getUploadErrorMessage(e));
    } finally {
      set({ loading: false });
    }
  },

  remove: async (id) => {
    set({ loading: true });
    try {
      await uploadService.delete(id);
      const newCount = get().count - 1;
      set((state) => ({
        uploads: state.uploads.filter((u) => u.id !== id),
        count: newCount,
        totalPages: Math.ceil(newCount / state.pageSize) || 1,
      }));
      toast.success("Upload deleted");
    } catch (e) {
      toast.error(getUploadErrorMessage(e, "delete"));
    } finally {
      set({ loading: false });
    }
  },
}));
