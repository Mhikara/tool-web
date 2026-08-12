"use client";

export const GENRES = [
  { id: "", label: "Semua" },
  { id: "391b0423-d847-4e45-8cd9-b62ee8941a91", label: "Action" },
  { id: "87cc87cd-a395-47af-b27f-477aadbdf3b5", label: "Adventure" },
  { id: "4d32cc48-9f00-4cca-9b5a-a839f076a428", label: "Comedy" },
  { id: "b9af3a63-f058-46de-aeaf-3a18dbbd1bd1", label: "Drama" },
  { id: "cdc58593-87dd-415e-bac9-2cd5d0d54bea", label: "Fantasy" },
  { id: "cdad7e68-1419-41fc-b994-f7b89bc6aed9", label: "Horror" },
  { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", label: "Romance" },
  { id: "a3c67850-4684-404e-9b7f-c603f29aae4e", label: "Adult" },
  { id: "e5301a38-98e6-4595-be2e-2a329bdd1d86", label: "Slice of Life" },
  { id: "eabc5b4c-6aff-42f3-b831-7e82c5a229e6", label: "Supernatural" },
] as const;

const NSFW_KEY = "bk_nsfw_v1";
const AGE_KEY = "bk_age_ok_v1";

export function getNsfw(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(NSFW_KEY) === "1";
}
export function setNsfw(on: boolean) {
  localStorage.setItem(NSFW_KEY, on ? "1" : "0");
}
export function getAgeOk(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AGE_KEY) === "1";
}
export function setAgeOk(ok: boolean) {
  localStorage.setItem(AGE_KEY, ok ? "1" : "0");
}
