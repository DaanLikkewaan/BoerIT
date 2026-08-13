export interface Farm {
  id: string;
  userId: string;
  name: string;
  description?: string;
  location?: string;
  landHectares: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateFarmPayload {
  name: string;
  description?: string;
  location?: string;
  landHectares: number;
}

export interface UpdateFarmPayload extends CreateFarmPayload {}
