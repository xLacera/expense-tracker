import client from "./client";
import type { MonthlySummary, YearlySummary } from "../types";

export const reportsAPI = {
  getMonthly: async (month: number, year: number): Promise<MonthlySummary> => {
    const { data } = await client.get<MonthlySummary>(
      `/reports/monthly?month=${month}&year=${year}`,
    );
    return data;
  },

  getYearly: async (year: number): Promise<YearlySummary> => {
    const { data } = await client.get<YearlySummary>(
      `/reports/yearly?year=${year}`,
    );
    return data;
  },
};
