import { CATEGORIES } from "./types.ts";
import type { Category } from "./types";
const aliases: Record<string, Category> = {
  bar_tape: "tape",
  brake_hoods: "hoods",
  rim_brakes: "brakes",
  disc_brakes: "brakes",
  wheelsets: "wheels",
  front_derailleurs: "derailleurs",
  rear_derailleurs: "derailleurs",
  front_lights: "lights",
  rear_lights: "lights",
  bottle_cages: "bottles",
  cockpit_adapters: "adapters",
  forks: "fork",
};
export const productCategory = (category: string): Category =>
  aliases[category] || (category as Category);
export const supportedProductCategory = (category: string) =>
  CATEGORIES.some((c) => c.id === productCategory(category));
