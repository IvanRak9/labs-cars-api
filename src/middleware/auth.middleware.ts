import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.cookies.access_token;

    if (!token) {
        res.status(401).json({ message: 'Не авторизовано' });
        return;
    }

    try {
        const secret = process.env.JWT_SECRET || 'default_secret';
        const decoded = jwt.verify(token, secret) as { userId: string };

        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Не авторизовано' });
    }
};