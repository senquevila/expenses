import apiClient from "@/_libs/api/client";
import {
  Upload,
  Step1Upload,
  Step1UploadSchema,
  CreateUploadRequest,
  UploadSchema,
} from "@/_models/upload.model";

export interface UploadPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: Upload[];
}

export const uploadService = {
  async getPage(
    page = 1,
    filters: { identifier?: string; upload_type?: string } = {},
  ): Promise<UploadPage> {
    const response = await apiClient.get("uploads/", {
      params: { page, ordering: "-created", ...filters },
    });
    const raw = response.data;
    return {
      count: raw.count ?? 0,
      next: raw.next ?? null,
      previous: raw.previous ?? null,
      results: raw.results ?? [],
    };
  },

  async create(data: CreateUploadRequest): Promise<Upload> {
    const formData = new FormData();
    formData.append("file", data.file);
    formData.append("upload_type", data.upload_type);
    if (data.row_start) formData.append("row_start", String(data.row_start));
    if (data.row_end) formData.append("row_end", String(data.row_end));
    if (data.start_date) formData.append("start_date", data.start_date);
    if (data.end_date) formData.append("end_date", data.end_date);

    const response = await apiClient.post("uploads/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return UploadSchema.parse(response.data);
  },

  async getById(id: number): Promise<Upload> {
    const response = await apiClient.get(`uploads/${id}/`);
    return UploadSchema.parse(response.data);
  },

  async getIdentifiers(): Promise<string[]> {
    const response = await apiClient.get("uploads/identifiers/");
    return response.data.identifiers ?? [];
  },

  async step1(file: File, identifier?: string): Promise<Step1Upload> {
    const formData = new FormData();
    formData.append("file", file);
    if (identifier) formData.append("identifier", identifier);
    const response = await apiClient.post("uploads/step1/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return Step1UploadSchema.parse(response.data);
  },

  async step2(
    id: number,
    result: unknown,
    uploadType: string,
  ): Promise<Upload> {
    const response = await apiClient.post(`uploads/${id}/step2/`, {
      result,
      upload_type: uploadType.toUpperCase(),
      start_date: null,
      end_date: null,
    });
    return UploadSchema.parse(response.data);
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`uploads/${id}/`);
  },

  async getAll(): Promise<Upload[]> {
    const all: Upload[] = [];
    let page = 1;
    for (;;) {
      const res = await this.getPage(page);
      all.push(...res.results);
      if (!res.next) break;
      page++;
    }
    return all;
  },
};
