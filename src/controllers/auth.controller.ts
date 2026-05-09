import { Request, Response } from 'express';
import { z } from 'zod';
import User from '../models/user.model';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const registerSchema = z.object({
    email: z.string().email("Некоректний формат електронної пошти"),
    password: z.string().min(6, "Пароль має містити мінімум 6 символів")
});

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = registerSchema.parse(req.body);

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(409).json({ message: 'Користувач з такою поштою вже існує' });
            return;
        }

        const newUser = new User({
            email,
            passwordHash: password
        });

        await newUser.save();

        res.status(201).json({
            message: 'Користувача успішно зареєстровано',
            user: {
                id: newUser._id,
                email: newUser.email,
                createdAt: newUser.createdAt
            }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: error.flatten().fieldErrors });
        } else {
            res.status(500).json({ message: 'Помилка сервера' });
        }
    }
};
const loginSchema = z.object({
    email: z.string().email("Некоректний формат електронної пошти"),
    password: z.string().min(1, "Пароль є обов'язковим")
});

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const user = await User.findOne({ email });
        if (!user) {
            res.status(401).json({ message: 'Неправильна пошта або пароль' });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            res.status(401).json({ message: 'Неправильна пошта або пароль' });
            return;
        }

        const secret = process.env.JWT_SECRET || 'default_secret';

        const accessToken = jwt.sign({ userId: user._id }, secret, { expiresIn: '15m' });
        const refreshToken = jwt.sign({ userId: user._id }, secret, { expiresIn: '30d' });

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict' as const,
        };

        res.cookie('access_token', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
        res.cookie('refresh_token', refreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

        res.status(200).json({ message: 'Успішний вхід' });

    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: error.flatten().fieldErrors });
        } else {
            res.status(500).json({ message: 'Помилка сервера' });
        }
    }
};
export const refresh = async (req: Request, res: Response): Promise<void> => {
    try {
        const refreshToken = req.cookies.refresh_token;
        if (!refreshToken) {
            res.status(401).json({ message: 'Refresh token відсутній' });
            return;
        }

        const secret = process.env.JWT_SECRET || 'default_secret';
        const decoded = jwt.verify(refreshToken, secret) as { userId: string };

        const newAccessToken = jwt.sign({ userId: decoded.userId }, secret, { expiresIn: '15m' });
        const newRefreshToken = jwt.sign({ userId: decoded.userId }, secret, { expiresIn: '30d' });

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict' as const,
        };

        res.cookie('access_token', newAccessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
        res.cookie('refresh_token', newRefreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

        res.status(200).json({ message: 'Токени успішно оновлено' });
    } catch (error) {
        res.status(401).json({ message: 'Недійсний refresh token' });
    }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.status(200).json({ message: 'Виконано вихід' });
};