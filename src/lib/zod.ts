import { carFuelTypes, carTypes } from "@/constants/cars";
import { z } from "zod";

export const generateImageSchema = z.object({
  description: z
    .string()
    .min(5, "Description must be at least 5 characters long"),
  name: z.string().min(3, "File Name is required"),
});

export type GenerateImageSchema = z.infer<typeof generateImageSchema>;


export const addCarSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  brand: z.string().min(1, "Brand is required"),
  type: z.enum(carTypes),
  year: z.coerce
    .number()
    .int() // Keep .int() here (years are always integers)
    .min(1900)
    .max(new Date().getFullYear() + 1),
  
  // Removed .int() if you want precise mileage (e.g. 12000.5), 
  // otherwise keep it if you only want whole numbers.
  mileage: z.coerce.number().nonnegative(), 

  colors: z.array(z.string()).min(1, "At least one color is required"),
  
  // Price already accepted floats (no .int() was present), which is correct for cents.
  price: z.coerce.number().positive("Price must be positive"),
  
  description: z.string().min(20, "Description must be at least 20 characters"),
  images: z.array(z.string()).optional(),
  transmission: z.enum(["AUTOMATIC", "MANUAL"]),
  features: z.array(z.string()).min(1, "At least one feature is required"),
  location: z.string().min(2, "Location is required"),
  fuelType: z.enum(carFuelTypes),

  // Specification details
  engineCapacity: z.coerce.number().positive().optional(), // Already allows float (e.g. 2.5 Liters)
  doors: z.coerce.number().int().positive().optional(),    // Keep .int() (cannot have 3.5 doors)
  seats: z.coerce.number().int().positive().optional(),    // Keep .int()
  topSpeed: z.coerce.number().int().positive().optional(), // Usually int (200 km/h)
  
  // --- CHANGED: Removed .int() ---
  // Acceleration is often a decimal (e.g. 3.4 seconds)
  acceleration: z.coerce.number().positive().optional(), 
  
  horsepower: z.coerce.number().int().positive().optional(),
  torque: z.coerce.number().int().positive().optional(),
  
  // Dimensions usually allow decimals, so ensure no .int() is present
  length: z.coerce.number().positive().optional(),
  width: z.coerce.number().positive().optional(),
  height: z.coerce.number().positive().optional(),
  weight: z.coerce.number().positive().optional(),

  // Seller details (unchanged)
  sellerName: z.string().min(2, "Seller name must be at least 2 characters"),
  sellerImage: z.string().optional(),
  sellerPhone: z.string().min(5, "Valid phone number required"),
  sellerEmail: z.string().email("Valid email required"),
  sellerAddress: z.string().min(5, "Address is required"),
  sellerCity: z.string().min(2, "City is required"),
  sellerState: z.string().min(2, "State is required"),
  sellerZip: z.string().min(2, "Zip code is required"),
  sellerCountry: z.string().min(2, "Country is required"),
  sellerWebsite: z.string().url("Valid URL required"),
});

export type AddCarSchema = z.infer<typeof addCarSchema>;

export const contactSellerSchema = z.object({
  carId: z.string().nonempty("Car ID is required"),
  content: z.string().nonempty("Message content is required"),
  firstName: z.string().nonempty("First name is required"),
  lastName: z.string().nonempty("Last name is required"),
  email: z.string().email("Invalid email format").nonempty("Email is required"),
  phone: z.string().nonempty("Phone number is required"),
});

export type ContactSellerSchema = z.infer<typeof contactSellerSchema>;
