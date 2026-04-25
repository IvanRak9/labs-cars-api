import express from 'express';
import cors from 'cors';
import carRoutes from './routes/car';
import { errorHandler } from './middleware/errorHandler';
import mongoose from 'mongoose';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
        res.status(200).json({ status: 'OK', database: 'Connected' });
    } else {
        res.status(503).json({ status: 'Service Unavailable', database: 'Disconnected' });
    }
});

app.use('/api/cars', carRoutes);

app.use(errorHandler);

export default app;