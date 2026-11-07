import { axiosClient } from "./axiosClient";
import type {
  AnimalCreateDTO,
  AnimalResponseDTO,
  AnimalStatus,
} from "../types";

export const animalApi = {
  create: async (dto: AnimalCreateDTO): Promise<AnimalResponseDTO> => {
    const response = await axiosClient.post<AnimalResponseDTO>("/animals", dto);
    return response.data;
  },

  getByTagNumber: async (tagNumber: string): Promise<AnimalResponseDTO> => {
    const response = await axiosClient.get<AnimalResponseDTO>(
      `/animals/tag/${tagNumber}`,
    );
    return response.data;
  },

  getBySectionId: async (sectionId: number): Promise<AnimalResponseDTO[]> => {
    const response = await axiosClient.get<AnimalResponseDTO[]>(
      `/animals/section/${sectionId}`,
    );
    return response.data;
  },

  transfer: async (
    animalId: number,
    targetSectionId: number,
  ): Promise<AnimalResponseDTO> => {
    const response = await axiosClient.put<AnimalResponseDTO>(
      `/animals/${animalId}/transfer`,
      null,
      { params: { targetSectionId } },
    );
    return response.data;
  },

  updateStatus: async (
    animalId: number,
    status: AnimalStatus,
  ): Promise<AnimalResponseDTO> => {
    const response = await axiosClient.put<AnimalResponseDTO>(
      `/animals/${animalId}/status`,
      null,
      { params: { status } },
    );
    return response.data;
  },
};
