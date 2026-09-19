import apiClient from "@/_libs/api/client";

import {
  Subscription,
  SubscriptionSummary,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  SubscriptionsResponseSchema,
  SubscriptionSchema,
  SubscriptionSummarySchema,
  ToggleResponseSchema,
} from "@/_models/subscription.model";

export const subscriptionService = {
  async getAll(isActive?: boolean): Promise<Subscription[]> {
    const params: Record<string, unknown> = {};
    if (isActive !== undefined) params.is_active = isActive;

    const results: Subscription[] = [];
    let response = await apiClient.get("subscriptions/", { params });
    let data = SubscriptionsResponseSchema.parse(response.data);
    results.push(...data.results);

    while (data.next) {
      response = await apiClient.get(data.next);
      data = SubscriptionsResponseSchema.parse(response.data);
      results.push(...data.results);
    }

    return results;
  },

  async getById(id: number): Promise<Subscription> {
    const response = await apiClient.get(`subscriptions/${id}/`);
    return SubscriptionSchema.parse(response.data);
  },

  async create(data: CreateSubscriptionRequest): Promise<Subscription> {
    const response = await apiClient.post("subscriptions/", data);
    return subscriptionService.getById(response.data.id);
  },

  async update(
    id: number,
    data: UpdateSubscriptionRequest,
  ): Promise<Subscription> {
    await apiClient.put(`subscriptions/${id}/`, data);
    return subscriptionService.getById(id);
  },

  async toggle(id: number): Promise<boolean> {
    const response = await apiClient.post(`subscriptions/${id}/toggle/`);
    return ToggleResponseSchema.parse(response.data).is_active;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`subscriptions/${id}/`);
  },

  async getSummary(): Promise<SubscriptionSummary> {
    const response = await apiClient.get("subscriptions/summary/");
    return SubscriptionSummarySchema.parse(response.data);
  },
};
