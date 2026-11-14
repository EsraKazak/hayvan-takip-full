import { axiosClient } from "./axiosClient";
import type {
  AnimalCreateDTO,
  AnimalResponseDTO,
  AnimalStatus,
  bulkVaccinationDTO,
  bulkVaccinationResponseDTO,
  InseminationDTO,
  VaccinationDTO,
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
    targetSlotNumber?: number | null,
  ): Promise<AnimalResponseDTO> => {
    const response = await axiosClient.put<AnimalResponseDTO>(
      `/animals/${animalId}/transfer`,
      null,
      {
        params: {
          targetSectionId,
          targetSlotNumber: targetSlotNumber
            ? Number(targetSlotNumber)
            : undefined,
        },
      },
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

  // src/api/animalApi.ts dosyasına eklenecek fonksiyonlar:

  addVaccination: async (
    animalId: number,
    data: Omit<VaccinationDTO, "id">,
  ): Promise<VaccinationDTO> => {
    const response = await axiosClient.post<VaccinationDTO>(
      `/animals/${animalId}/vaccinations`,
      data,
    );
    return response.data;
  },

  addInsemination: async (
    animalId: number,
    data: Omit<InseminationDTO, "id">,
  ): Promise<InseminationDTO> => {
    const response = await axiosClient.post<InseminationDTO>(
      `/animals/${animalId}/inseminations`,
      data,
    );
    return response.data;
  },

  addBulkVaccination: async (
    dto: bulkVaccinationDTO,
  ): Promise<bulkVaccinationResponseDTO> => {
    const response = await axiosClient.post<bulkVaccinationResponseDTO>(
      "/animals/bulk-vaccinations",
      dto,
    );
    return response.data;
  },
};
