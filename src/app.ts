import express from 'express';
import cors from 'cors';
import carRoutes from './routes/car';
import { errorHandler } from './middleware/errorHandler';
import mongoose from 'mongoose';
import cookieParser from "cookie-parser";
import authRoutes from './routes/auth.routes';

const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/api/cars', carRoutes);

app.get('/health', (req, res) => {
    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
        res.status(200).json({ status: 'OK', database: 'Connected' });
    } else {
        res.status(503).json({ status: 'Service Unavailable', database: 'Disconnected' });
    }
});


app.use(errorHandler);

export default app;