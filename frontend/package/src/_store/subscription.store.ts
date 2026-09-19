import {
  Subscription,
  SubscriptionSummary,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
} from "@/_models/subscription.model";
import { subscriptionService } from "@/_services/subscription.service";
import { createEntityStore } from "./createEntityStore";

export const useSubscriptionStore = createEntityStore<
  Subscription,
  SubscriptionSummary,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest
>(subscriptionService, "Subscription", "subscription-summary-cache");
