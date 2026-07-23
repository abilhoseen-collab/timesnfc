// Reusable zod schema primitives for edge function inputs.
import { z } from "npm:zod@3.23.8";

export const zEmail = z.string().trim().toLowerCase().email({ message: "সঠিক email দিন" }).max(255);
export const zUUID = z.string().uuid({ message: "সঠিক ID দিন" });
export const zNonEmpty = (max = 500) => z.string().trim().min(1, { message: "খালি রাখা যাবে না" }).max(max);
export const zOptionalString = (max = 500) => z.string().trim().max(max).optional().or(z.literal(""));
export const zPhone = z.string().trim().min(6).max(20).regex(/^[+0-9 ()-]+$/, { message: "সঠিক ফোন নম্বর দিন" });
export const zPositiveInt = z.number().int().positive();
export const zPositiveAmount = z.number().finite().positive();

export { z };
