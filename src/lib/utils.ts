import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const extractJSON = (str: string) => {
  const match = str.match(/\{[\s\S]*?\}/);
  if (!match) throw new Error("No JSON object found in string");
  return JSON.parse(match[0]);
};
