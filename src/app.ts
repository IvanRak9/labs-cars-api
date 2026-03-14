import express from 'express';
import cors from 'cors';
import carRoutes from './routes/car';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/cars', carRoutes);

app.use(errorHandler);

export default app;