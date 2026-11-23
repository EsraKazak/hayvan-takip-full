import { axiosClient } from "./axiosClient";
import type { BarnDTO } from "../types";

export const barnApi = {
  getAllBarns: async (): Promise<BarnDTO[]> => {
    const response = await axiosClient.get<BarnDTO[]>("/barns");
    return response.data;
  },
  create: async (data: {
    name: string;
    description?: string;
  }): Promise<BarnDTO> => {
    const response = await axiosClient.post<BarnDTO>("/barns", data);
    return response.data;
  },
  deleteBarn: async (id: number): Promise<void> => {
    await axiosClient.delete(`/barns/${id}`);
  },
};
