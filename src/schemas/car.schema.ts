import { z } from 'zod';

export const createCarSchema = z.object({
    model: z.string().min(1, "Модель обов'язкова").max(100),

    description: z.string().max(500).optional(),

    year: z.number().int().min(1886).max(new Date().getFullYear()),
    transmission: z.enum(['manual', 'automatic', 'robotic']),
    isAvailable: z.boolean().default(true)
});

export const updateCarSchema = createCarSchema.partial();

export type CreateCarInput = z.infer<typeof createCarSchema>;
export type UpdateCarInput = z.infer<typeof updateCarSchema>;

export type CarEntity = CreateCarInput & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
};