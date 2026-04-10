import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ZodError) {
        return res.status(400).json({
            message: 'Помилка валідації даних (Zod)',
            errors: err.issues
        });
    }

    if (err instanceof mongoose.Error.CastError || err.name === 'CastError') {
        return res.status(400).json({ message: 'Невалідний формат ID' });
    }

    if (err instanceof mongoose.Error.ValidationError) {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({
            message: 'Помилка валідації БД',
            errors: messages
        });
    }

    if (err.code === 11000) {
        return res.status(409).json({ message: 'Дублікат унікального ключа (Конфлікт)' });
    }

    console.error('Непередбачувана помилка:', err);
    return res.status(500).json({ message: 'Внутрішня помилка сервера' });
};