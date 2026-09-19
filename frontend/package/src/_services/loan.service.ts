import { z } from "zod";
import apiClient from "@/_libs/api/client";

import {
  Loan,
  LoanSummary,
  CreateLoanRequest,
  UpdateLoanRequest,
  LoansResponseSchema,
  LoanSchema,
  LoanSummarySchema,
  ToggleResponseSchema,
} from "@/_models/loan.model";

export const loanService = {
  async getAll(isActive?: boolean): Promise<Loan[]> {
    const params: Record<string, unknown> = {};
    if (isActive !== undefined) params.is_active = isActive;

    const results: Loan[] = [];
    let response = await apiClient.get("loans/", { params });
    let data = LoansResponseSchema.parse(response.data);
    results.push(...data.results);

    while (data.next) {
      response = await apiClient.get(data.next);
      data = LoansResponseSchema.parse(response.data);
      results.push(...data.results);
    }

    return results;
  },

  async getById(id: number): Promise<Loan> {
    const response = await apiClient.get(`loans/${id}/`);
    return LoanSchema.parse(response.data);
  },

  async create(data: CreateLoanRequest): Promise<Loan> {
    const response = await apiClient.post("loans/", data);
    const { id } = z.object({ id: z.number() }).parse(response.data);
    return loanService.getById(id);
  },

  async update(id: number, data: UpdateLoanRequest): Promise<Loan> {
    await apiClient.put(`loans/${id}/`, data);
    return loanService.getById(id);
  },

  async toggle(id: number): Promise<boolean> {
    const response = await apiClient.post(`loans/${id}/toggle/`);
    return ToggleResponseSchema.parse(response.data).is_active;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`loans/${id}/`);
  },

  async getSummary(): Promise<LoanSummary> {
    const response = await apiClient.get("loans/summary/");
    return LoanSummarySchema.parse(response.data);
  },
};
