import { create } from 'zustand';
import { toast } from 'sonner';
import { Account, CreateAccountRequest, UpdateAccountRequest } from '@/_models/account.model';
import { accountService } from '@/_services/account.service';

interface AccountState {
    accounts: Account[];
    loading: boolean;

    fetchAll: () => Promise<void>;
    add: (data: CreateAccountRequest) => Promise<void>;
    edit: (id: number, data: UpdateAccountRequest) => Promise<void>;
    remove: (id: number) => Promise<void>;
}

export const useAccountStore = create<AccountState>((set) => ({
    accounts: [],
    loading: false,

    fetchAll: async () => {
        set({ loading: true });
        try {
            const data = await accountService.getAll();
            set({ accounts: data });
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
            toast.error('Failed to fetch accounts');
        } finally {
            set({ loading: false });
        }
    },

    add: async (data) => {
        set({ loading: true });
        try {
            await accountService.create(data);
            const accounts = await accountService.getAll();
            set({ accounts });
            toast.success('Account created');
        } catch (error) {
            console.error('Failed to create account:', error);
            toast.error('Failed to create account');
        } finally {
            set({ loading: false });
        }
    },

    edit: async (id, data) => {
        set({ loading: true });
        try {
            await accountService.update(id, data);
            const accounts = await accountService.getAll();
            set({ accounts });
            toast.success('Account updated');
        } catch (error) {
            console.error('Failed to update account:', error);
            toast.error('Failed to update account');
        } finally {
            set({ loading: false });
        }
    },

    remove: async (id) => {
        set({ loading: true });
        try {
            await accountService.delete(id);
            set((state) => ({ accounts: state.accounts.filter((a) => a.id !== id) }));
            toast.success('Account deleted');
        } catch (error) {
            console.error('Failed to delete account:', error);
            toast.error('Failed to delete account');
        } finally {
            set({ loading: false });
        }
    },
}));
