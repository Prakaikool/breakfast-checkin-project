// In-memory manual crowd override store.
// Resets on server restart - intentional for a daily-use case.

export type CrowdLevel = "LOW" | "MODERATE" | "BUSY" | "VERY_BUSY";

interface CrowdOverride {
  active: boolean;
  level: CrowdLevel;
  updatedBy: string;
  updatedAt: string | null;
}

const store: CrowdOverride = {
  active: false,
  level: "LOW",
  updatedBy: "",
  updatedAt: null,
};

export function getCrowdOverride(): CrowdOverride {
  return { ...store };
}

export function setCrowdOverride(level: CrowdLevel, updatedBy: string): void {
  store.active = true;
  store.level = level;
  store.updatedBy = updatedBy;
  store.updatedAt = new Date().toISOString();
}

export function clearCrowdOverride(): void {
  store.active = false;
  store.level = "LOW";
  store.updatedBy = "";
  store.updatedAt = null;
}
