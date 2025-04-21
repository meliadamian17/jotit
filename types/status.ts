export const STATUSES = [
  "backlog",
  "in-progress",
  "blocked",
  "done",
  "canceled",
] as const;

export type Status = (typeof STATUSES)[number];

export type Priority = "low" | "medium" | "high" | "urgent";

