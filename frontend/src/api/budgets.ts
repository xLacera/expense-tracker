import client from "./client";
import type { Budget, CreateBudgetRequest } from "../types";

export const budgetsAPI = {
  getByPeriod: async (month: number, year: number): Promise<Budget[]> => {
    const { data } = await client.get<{ budgets: Budget[] }>(
      `/budgets?month=${month}&year=${year}`,
    );
    return data.budgets;
  },

  create: async (req: CreateBudgetRequest): Promise<Budget> => {
    const { data } = await client.post<Budget>("/budgets", req);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/budgets/${id}`);
  },
};
