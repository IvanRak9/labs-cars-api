import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ZodError) {
        return res.status(400).json({
            message: 'Помилка валідації даних',
            errors: err.issues
        });
    }

    console.error(err);
    return res.status(500).json({ message: 'Внутрішня помилка сервера' });
};