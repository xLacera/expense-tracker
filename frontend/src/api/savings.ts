// API client para cuentas de ahorro.
import client from "./client";
import type {
  SavingsAccount,
  SavingsListResponse,
  CreateSavingsAccountRequest,
  UpdateSavingsAccountRequest,
  AdjustBalanceRequest,
} from "../types";

export const savingsAPI = {
  getAll: async (): Promise<SavingsListResponse> => {
    const { data } = await client.get<SavingsListResponse>("/savings");
    return data;
  },

  create: async (req: CreateSavingsAccountRequest): Promise<SavingsAccount> => {
    const { data } = await client.post<SavingsAccount>("/savings", req);
    return data;
  },

  update: async (
    id: string,
    req: UpdateSavingsAccountRequest,
  ): Promise<SavingsAccount> => {
    const { data } = await client.put<SavingsAccount>(`/savings/${id}`, req);
    return data;
  },

  adjustBalance: async (
    id: string,
    req: AdjustBalanceRequest,
  ): Promise<SavingsAccount> => {
    const { data } = await client.post<SavingsAccount>(
      `/savings/${id}/adjust`,
      req,
    );
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/savings/${id}`);
  },
};
