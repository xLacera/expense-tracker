import client from "./client";
import type { Category, CreateCategoryRequest } from "../types";

export const categoriesAPI = {
  getAll: async (): Promise<Category[]> => {
    const { data } = await client.get<{ categories: Category[] }>(
      "/categories",
    );
    return data.categories;
  },

  create: async (req: CreateCategoryRequest): Promise<Category> => {
    const { data } = await client.post<Category>("/categories", req);
    return data;
  },

  update: async (
    id: string,
    req: Partial<CreateCategoryRequest>,
  ): Promise<Category> => {
    const { data } = await client.put<Category>(`/categories/${id}`, req);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/categories/${id}`);
  },
};
