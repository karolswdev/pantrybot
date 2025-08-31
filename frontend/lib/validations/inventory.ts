import { z } from "zod";

export const inventoryItemSchema = z.object({
  name: z.string().min(1, "Item name is required").max(100, "Name must be less than 100 characters"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required").max(20, "Unit must be less than 20 characters"),
  location: z.enum(["fridge", "freezer", "pantry"], {
    errorMap: () => ({ message: "Please select a valid location" })
  }),
  category: z.string().optional(),
  expirationDate: z.string().optional().refine((date) => {
    if (!date) return true;
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  }, "Invalid date format"),
  bestBeforeDate: z.string().optional().refine((date) => {
    if (!date) return true;
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  }, "Invalid date format"),
  purchaseDate: z.string().optional().refine((date) => {
    if (!date) return true;
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  }, "Invalid date format"),
  price: z.coerce.number().optional().refine((val) => {
    if (val === undefined) return true;
    return val >= 0;
  }, "Price must be a positive number"),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
});

export type InventoryItemFormData = z.infer<typeof inventoryItemSchema>;

// Categories for the dropdown
export const ITEM_CATEGORIES = [
  "Dairy",
  "Produce",
  "Meat",
  "Seafood",
  "Bakery",
  "Grains",
  "Beverages",
  "Snacks",
  "Condiments",
  "Frozen",
  "Canned Goods",
  "Prepared Meals",
  "Desserts",
  "Other"
] as const;

// Common units for the dropdown
export const ITEM_UNITS = [
  "item",
  "items",
  "piece",
  "pieces",
  "pack",
  "packs",
  "box",
  "boxes",
  "bag",
  "bags",
  "bottle",
  "bottles",
  "can",
  "cans",
  "jar",
  "jars",
  "lb",
  "lbs",
  "oz",
  "kg",
  "g",
  "L",
  "mL",
  "gal",
  "qt",
  "pt",
  "cup",
  "cups",
  "tbsp",
  "tsp",
  "loaf",
  "loaves",
  "dozen",
] as const;

export type ItemCategory = typeof ITEM_CATEGORIES[number];
export type ItemUnit = typeof ITEM_UNITS[number];