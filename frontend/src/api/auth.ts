import client from "./client";
import type { AuthResponse } from "../types";

export const authAPI = {
  register: async (
    email: string,
    password: string,
    name: string,
  ): Promise<AuthResponse> => {
    const { data } = await client.post<AuthResponse>("/auth/register", {
      email,
      password,
      name,
    });
    return data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await client.post<AuthResponse>("/auth/login", {
      email,
      password,
    });
    return data;
  },
};
