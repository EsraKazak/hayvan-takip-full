import { axiosClient } from "./axiosClient";
import type { NotificationItemDTO, RecipientDTO } from "../types";

export const notificationApi = {
  getAlerts: async (): Promise<NotificationItemDTO[]> => {
    const response = await axiosClient.get("/notifications/alerts");
    return response.data;
  },

  getRecipients: async (): Promise<RecipientDTO[]> => {
    const response = await axiosClient.get("/notifications/recipients");
    return response.data;
  },

  addRecipient: async (data: RecipientDTO): Promise<RecipientDTO> => {
    const response = await axiosClient.post("/notifications/recipients", data);
    return response.data;
  },

  deleteRecipient: async (id: number): Promise<void> => {
    await axiosClient.delete(`/notifications/recipients/${id}`);
  },

  sendEmails: async (): Promise<{ sentCount: number; message: string }> => {
    const response = await axiosClient.post("/notifications/send-emails");
    return response.data;
  },

  dismissAlert: async (alertId: string): Promise<void> => {
    await axiosClient.post(`/notifications/alerts/${alertId}/dismiss`);
  },
};
