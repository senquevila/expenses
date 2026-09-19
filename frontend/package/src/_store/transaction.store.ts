import { create } from "zustand";
import { toast } from "sonner";
import {
  Transaction,
  CreateTransactionRequest,
  UpdateTransactionRequest,
} from "@/_models/transaction.model";
import { transactionService } from "@/_services/transaction.service";
import { parseApiError } from "@/_libs/api/error";

type FetchParams = {
  year?: number;
  month?: number;
  page?: number;
  description?: string;
  period?: number;
  account?: number;
};

interface TransactionState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  page: number;
  totalCount: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  fetchParams: FetchParams;

  fetchAll: (params?: FetchParams) => Promise<void>;
  add: (data: CreateTransactionRequest) => Promise<void>;
  edit: (id: number, data: UpdateTransactionRequest) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  loading: false,
  error: null,
  page: 1,
  totalCount: 0,
  pageSize: 20,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
  fetchParams: {},

  fetchAll: async (params) => {
    set({ loading: true, error: null, fetchParams: params ?? {} });
    try {
      const data = await transactionService.getAll(params);
      const pageSize = data.next ? data.results.length : get().pageSize;
      const totalPages = Math.ceil(data.count / pageSize) || 1;
      set({
        transactions: data.results,
        totalCount: data.count,
        pageSize,
        totalPages,
        hasNext: data.next !== null,
        hasPrevious: data.previous !== null,
        page: params?.page ?? 1,
      });
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      toast.error("Failed to fetch transactions");
    } finally {
      set({ loading: false });
    }
  },

  add: async (data) => {
    set({ loading: true, error: null });
    try {
      const newTransaction = await transactionService.create(data);
      set((state) => ({
        transactions: [...state.transactions, newTransaction],
      }));
      toast.success("Transaction created");
    } catch (error) {
      toast.error("Failed to add transaction");
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  edit: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await transactionService.patch(id, data);
      toast.success("Transaction updated");
      const { fetchAll, fetchParams } = get();
      await fetchAll(fetchParams);
    } catch (error) {
      const details = parseApiError(error);
      toast.error(details ?? "Failed to update transaction");
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  remove: async (id) => {
    set({ loading: true, error: null });
    try {
      await transactionService.delete(id);
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
      }));
      toast.success("Transaction deleted");
    } catch (error) {
      toast.error("Failed to delete transaction");
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));
