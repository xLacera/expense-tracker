// API client para preferencias del usuario.
import client from "./client";
import type { UserSettingsResponse, UpdateUserSettingsRequest } from "../types";

export const userAPI = {
  getSettings: async (): Promise<UserSettingsResponse> => {
    const { data } = await client.get<UserSettingsResponse>("/user/settings");
    return data;
  },

  updateSettings: async (
    req: UpdateUserSettingsRequest,
  ): Promise<UserSettingsResponse> => {
    const { data } = await client.patch<UserSettingsResponse>(
      "/user/settings",
      req,
    );
    return data;
  },

  deleteAccount: async (): Promise<void> => {
    await client.delete("/user/account");
  },
};
