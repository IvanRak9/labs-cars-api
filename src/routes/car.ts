import { Router, Request, Response, NextFunction } from 'express';
import { carStorage } from '../storage/car';
import { createCarSchema, updateCarSchema } from '../schemas/car.schema';
import { validate } from '../middleware/validate';

const router = Router();

// GET: Специфічний маршрут
router.get('/available', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await carStorage.getAll({ isAvailable: true }, 1, 100);
        res.status(200).json(result.data);
    } catch (error) {
        next(error);
    }
});

// GET: Отримання всіх записів
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { minYear, transmission, page, limit } = req.query;

        const filter: any = {};
        if (minYear) {
            filter.year = { $gte: parseInt(minYear as string, 10) };
        }
        if (transmission) {
            filter.transmission = transmission;
        }

        const pageNum = parseInt(page as string, 10) || 1;
        const limitNum = parseInt(limit as string, 10) || 10;

        const result = await carStorage.getAll(filter, pageNum, limitNum);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

// GET: Отримання за ID
router.get('/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const car = await carStorage.getById(req.params.id);
        if (!car) {
            return res.status(404).json({ message: 'Автомобіль не знайдено' });
        }
        res.status(200).json(car);
    } catch (error) {
        next(error);
    }
});

// POST: Створення нового автомобіля
router.post('/', validate(createCarSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const newCar = await carStorage.create(req.body);
        res.status(201).json(newCar);
    } catch (error) {
        next(error);
    }
});

// PATCH: Оновлення автомобіля
router.patch('/:id', validate(updateCarSchema), async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const updatedCar = await carStorage.update(req.params.id, req.body);
        if (!updatedCar) {
            return res.status(404).json({ message: 'Автомобіль не знайдено' });
        }
        res.status(200).json(updatedCar);
    } catch (error) {
        next(error);
    }
});

// DELETE: Видалення автомобіля
router.delete('/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const deletedCar = await carStorage.delete(req.params.id);
        if (!deletedCar) {
            return res.status(404).json({ message: 'Автомобіль не знайдено' });
        }
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

export default router;