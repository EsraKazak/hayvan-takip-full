//Hayvan durumu backend deki karşılığı
export type AnimalStatus = "AKTIF" | "SATILDI" | "OLDU";
export type Gender = "ERKEK" | "DISI";
export type PadokType = "TEKLI" | "IKILI"; // ahır tipini belirlemek için kullanılır

//section padok dtoları
//POST /api/sections için giden istek body'si
export interface SectionCreateDTO {
  name: string;
  capacity: number;
  barnId?: number | null;
  padokType: PadokType;
}

export interface SectionResponseDTO {
  id: number;
  name: string;
  capacity: number;
  currentAnimalCount: number; //padok doluluk oranını hesaplamak için gerekli
  barnId?: number | null;
  barnName?: string | null;
  padokType?: PadokType;
  animals?: AnimalResponseDTO[];
}

// animal hayvan dtoları

// POST /api/animals için giden istek body'si
export interface AnimalCreateDTO {
  tagNumber: string;
  birthDate: string;
  name?: string;
  gender: Gender | string;
  breed: string;
  sectionId: number;
  motherId?: number; //opsiyonel, eğer hayvanın annesi biliniyorsa
  slotNumber?: number | null; //opsiyonel, eğer hayvanın padokta hangi slotta durduğu biliniyorsa
}

// GET /api/animals/... yanıtı
export interface AnimalResponseDTO {
  id: number;
  tagNumber: string;
  name?: string;
  birthDate: string;
  deathDate?: string | null;
  gender: string;
  breed: string;
  sectionId: number;
  motherId?: number | null; //opsiyonel, eğer hayvanın annesi biliniyorsa
  animalStatus: AnimalStatus;
  sectionName: string; //padok ismi
  motherTagNumber?: string | null; //opsiyonel, eğer hayvanın annesi biliniyorsa
  slotNumber?: number | null; //opsiyonel, eğer hayvanın padokta hangi slotta durduğu biliniyorsa
  vaccinations?: VaccinationDTO[];
  vaccinationRecords?: VaccinationDTO[];
  inseminations?: InseminationDTO[];
  inseminationRecords?: InseminationDTO[];
}

export interface VaccinationDTO {
  id: number;
  vaccineName: string;
  appliedDate: string;
  nextDueDate?: string | null;
  notes?: string | null;
}

export interface InseminationDTO {
  id: number;
  inseminationDate: string;
  expectedBirthDate?: string | null;
  status: string;
  bullInfo?: string | null;
}

export interface bulkVaccinationDTO {
  animalIds?: number[];
  sectionId?: number;
  vaccineName: string;
  appliedDate: string;
  nextDueDate?: string | null;
  notes?: string | null;
}

export interface bulkVaccinationResponseDTO {
  message: string;
  vaccinatedCount: number;
}

export interface NotificationItemDTO {
  id: string;
  type: "VACCINATION" | "BIRTH";
  severity: "OVERDUE" | "UPCOMING";
  animalTagNumber: string;
  animalName?: string;
  sectionName: string;
  title: string;
  targetDate: string;
  daysRemaining: number;
}

export interface RecipientDTO {
  id?: number;
  fullName: string;
  email: string;
  role: string;
  receiveVaccinationAlerts: boolean;
  receiveBirthAlerts: boolean;
  active?: boolean;
}
export interface BarnDTO {
  id: number;
  name: string;
  description?: string | null;
}
