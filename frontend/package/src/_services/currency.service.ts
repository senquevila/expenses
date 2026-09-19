import apiClient from '@/_libs/api/client';
import { Currency, CurrencySchema, CurrenciesResponseSchema } from '@/_models/currency.model';

export const currencyService = {
    async getAll(): Promise<Currency[]> {
        const response = await apiClient.get('currencies/');
        return CurrenciesResponseSchema.parse(response.data).results;
    },

    async getById(id: number): Promise<Currency> {
        const response = await apiClient.get(`currencies/${id}/`);
        return CurrencySchema.parse(response.data);
    },
};
