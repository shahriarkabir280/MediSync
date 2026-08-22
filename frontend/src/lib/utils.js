// src/lib/utils.ts   (or utils.js if you’re in plain JS)
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

// Merge Tailwind classes and remove duplicates:
export function cn(...inputs) {
  return twMerge(clsx(...inputs));
}
