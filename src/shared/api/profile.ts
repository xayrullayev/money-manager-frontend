import { apiClient } from "./client";
export interface Profile {
  id: string; displayName?: string; baseCurrency: string; timezone: string;
  locale: string; onboardingCompleted: boolean;
}
export async function fetchProfile(): Promise<Profile> {
  return (await apiClient.get<Profile>("/profile")).data;
}

export async function updateProfile(input: {displayName?:string;timezone?:string}): Promise<Profile> {
  return (await apiClient.patch<Profile>("/profile",input)).data;
}
