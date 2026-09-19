import apiClient from "@/_libs/api/client";

import {
  Transaction,
  TransactionsResponse,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionsResponseSchema,
  TransactionSchema,
} from "@/_models/transaction.model";

export const transactionService = {
  async getAll(params?: {
    year?: number;
    month?: number;
    page?: number;
    description?: string;
    period?: number;
    account?: number;
  }): Promise<TransactionsResponse> {
    const response = await apiClient.get("transactions/", { params });
    return TransactionsResponseSchema.parse(response.data);
  },

  async getById(id: number): Promise<Transaction> {
    const response = await apiClient.get(`transactions/${id}/`);
    return TransactionSchema.parse(response.data);
  },

  async create(data: CreateTransactionRequest): Promise<Transaction> {
    const response = await apiClient.post("transactions/", data);
    return TransactionSchema.parse(response.data);
  },

  async getByUpload(uploadId: number): Promise<TransactionsResponse> {
    const response = await apiClient.get("transactions/", {
      params: { upload: uploadId, ordering: "-created" },
    });
    return TransactionsResponseSchema.parse(response.data);
  },

  async update(id: number, data: UpdateTransactionRequest): Promise<void> {
    await apiClient.put(`transactions/${id}/`, data);
  },

  async patch(id: number, data: UpdateTransactionRequest): Promise<void> {
    await apiClient.patch(`transactions/${id}/`, data);
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`transactions/${id}/`);
  },
};
