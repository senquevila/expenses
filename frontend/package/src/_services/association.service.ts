import apiClient from "@/_libs/api/client";
import {
  Association,
  AssociationSchema,
  AssociationsListSchema,
  CreateAssociationRequest,
  UpdateAssociationRequest,
} from "@/_models/association.model";

export const associationService = {
  async getAll(params?: {
    account?: number;
    token?: string;
  }): Promise<Association[]> {
    const response = await apiClient.get("associations/", {
      params,
    });
    return AssociationsListSchema.parse(response.data).results;
  },

  async getById(id: number): Promise<Association> {
    const response = await apiClient.get(`associations/${id}/`);
    return AssociationSchema.parse(response.data);
  },

  async create(data: CreateAssociationRequest): Promise<Association> {
    const response = await apiClient.post("associations/", data);
    return associationService.getById(response.data.id);
  },

  async update(
    id: number,
    data: UpdateAssociationRequest,
  ): Promise<Association> {
    await apiClient.put(`associations/${id}/`, data);
    return associationService.getById(id);
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`associations/${id}/`);
  },
};
