import { axiosClient } from "./axiosClient";
import type { SectionCreateDTO, SectionResponseDTO } from "../types";

export const sectionApi = {
  getAllSections: async (): Promise<SectionResponseDTO[]> => {
    const response = await axiosClient.get<SectionResponseDTO[]>("/sections");
    return response.data;
  },

  getById: async (id: number): Promise<SectionResponseDTO> => {
    const response = await axiosClient.get<SectionResponseDTO>(
      `/sections/${id}`,
    );
    return response.data;
  },

  create: async (dto: SectionCreateDTO): Promise<SectionResponseDTO> => {
    const response = await axiosClient.post<SectionResponseDTO>(
      "/sections",
      dto,
    );
    return response.data;
  },
};
