import client from "./client";
import type {
  Transaction,
  CreateTransactionRequest,
  TransactionListResponse,
  TransactionFilter,
} from "../types";

export const transactionsAPI = {
  getAll: async (
    filter: TransactionFilter = {},
  ): Promise<TransactionListResponse> => {
    const params = new URLSearchParams();
    if (filter.type) params.set("type", filter.type);
    if (filter.category_id) params.set("category_id", filter.category_id);
    if (filter.date_from) params.set("date_from", filter.date_from);
    if (filter.date_to) params.set("date_to", filter.date_to);
    if (filter.page) params.set("page", filter.page.toString());
    if (filter.limit) params.set("limit", filter.limit.toString());

    const { data } = await client.get<TransactionListResponse>(
      `/transactions?${params}`,
    );
    return data;
  },

  create: async (req: CreateTransactionRequest): Promise<Transaction> => {
    const { data } = await client.post<Transaction>("/transactions", req);
    return data;
  },

  update: async (
    id: string,
    req: Partial<CreateTransactionRequest>,
  ): Promise<Transaction> => {
    const { data } = await client.put<Transaction>(`/transactions/${id}`, req);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/transactions/${id}`);
  },

  exportCSV: async (dateFrom?: string, dateTo?: string): Promise<void> => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);

    const { data } = await client.get(`/transactions/export?${params}`, {
      responseType: "blob",
    });

    // Crear un enlace temporal para descargar el archivo
    const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "transacciones.csv";
    link.click();
    URL.revokeObjectURL(url);
  },
};
