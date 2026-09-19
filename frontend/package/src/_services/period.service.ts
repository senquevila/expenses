import apiClient from "@/_libs/api/client";
import {
  Period,
  CreatePeriodRequest,
  UpdatePeriodRequest,
  PeriodsResponseSchema,
  PeriodSchema,
  PeriodSummary,
  PeriodSummarySchema,
} from "@/_models/period.model";

export const periodService = {
  async getAll(): Promise<Period[]> {
    const PAGE_SIZE = 100;
    const firstResponse = await apiClient.get(
      `periods/?page_size=${PAGE_SIZE}`,
    );
    const firstPage = PeriodsResponseSchema.parse(firstResponse.data);

    if (!firstPage.next) {
      return firstPage.results;
    }

    const totalPages = Math.ceil(firstPage.count / PAGE_SIZE);
    const remainingPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        apiClient
          .get(`periods/?page_size=${PAGE_SIZE}&page=${i + 2}`)
          .then((r) => PeriodsResponseSchema.parse(r.data).results),
      ),
    );

    return [...firstPage.results, ...remainingPages.flat()];
  },

  async toggle(id: number): Promise<Period> {
    await apiClient.post(`periods/${id}/toggle/`, {});
    const updated = await apiClient.get(`periods/${id}/`);
    return PeriodSchema.parse(updated.data);
  },

  async getById(id: number): Promise<Period> {
    const response = await apiClient.get(`periods/${id}/`);
    return PeriodSchema.parse(response.data);
  },

  async create(data: CreatePeriodRequest): Promise<Period> {
    const response = await apiClient.post("periods/", data);
    return PeriodSchema.parse(response.data);
  },

  async update(id: number, data: UpdatePeriodRequest): Promise<Period> {
    const response = await apiClient.put(`periods/${id}/`, data);
    return PeriodSchema.parse(response.data);
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`periods/${id}/`);
  },

  async getSummary(id: number): Promise<PeriodSummary> {
    const response = await apiClient.get(`periods/${id}/summary/`);
    return PeriodSummarySchema.parse(response.data);
  },
};
