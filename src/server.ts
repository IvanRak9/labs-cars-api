import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/database';
import mongoose from 'mongoose';

const PORT = process.env.PORT || 3000;

async function startServer() {
    await connectDB();

    const server = app.listen(PORT, () => {
        console.log(`Сервер запущено на http://localhost:${PORT}`);
    });

    process.on('SIGTERM', async () => {
        console.log('Отримано сигнал SIGTERM. Закриваємо HTTP сервер...');
        server.close(async () => {
            console.log('HTTP сервер закрито.');
            await mongoose.connection.close();
            console.log('З\'єднання з MongoDB закрито.');
            process.exit(0);
        });
    });
}

startServer();