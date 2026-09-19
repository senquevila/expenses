import apiClient from "@/_libs/api/client";
import {
  Account,
  AccountSchema,
  AccountsResponseSchema,
  CreateAccountRequest,
  UpdateAccountRequest,
} from "@/_models/account.model";

export const accountService = {
  async getAll(): Promise<Account[]> {
    const all: Account[] = [];
    let url: string | null = "accounts/";
    while (url) {
      const response = await apiClient.get(url);
      const parsed = AccountsResponseSchema.parse(response.data);
      all.push(...parsed.results);
      url = parsed.next;
    }
    return all.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getById(id: number): Promise<Account> {
    const response = await apiClient.get(`accounts/${id}/`);
    return AccountSchema.parse(response.data);
  },

  async create(data: CreateAccountRequest): Promise<void> {
    await apiClient.post("accounts/", data);
  },

  async update(id: number, data: UpdateAccountRequest): Promise<void> {
    await apiClient.put(`accounts/${id}/`, data);
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`accounts/${id}/`);
  },
};
