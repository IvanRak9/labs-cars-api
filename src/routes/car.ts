import { Router, Request, Response, NextFunction } from 'express';
import { carStorage } from '../storage/car';
import { createCarSchema, updateCarSchema } from '../schemas/car.schema';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// GET залишаємо без requireAuth (публічні маршрути)
router.get('/available', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await carStorage.getAll({ isAvailable: true }, 1, 100);
        res.status(200).json(result.data);
    } catch (error) {
        next(error);
    }
});

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

// POST: Створення нового автомобіля (Захищений)
router.post('/', requireAuth, validate(createCarSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const carData = {
            ...req.body,
            ownerId: req.userId
        };
        const newCar = await carStorage.create(carData);
        res.status(201).json(newCar);
    } catch (error) {
        next(error);
    }
});

// PATCH: Оновлення автомобіля (Захищений)
router.patch('/:id', requireAuth, validate(updateCarSchema), async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const car = await carStorage.getById(req.params.id);
        if (!car) {
            return res.status(404).json({ message: 'Автомобіль не знайдено' });
        }

        if (car.ownerId.toString() !== req.userId) {
            return res.status(403).json({ message: 'У вас немає прав на редагування цього авто' });
        }

        const updatedCar = await carStorage.update(req.params.id, req.body);
        res.status(200).json(updatedCar);
    } catch (error) {
        next(error);
    }
});

// DELETE: Видалення автомобіля (Захищений)
router.delete('/:id', requireAuth, async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const car = await carStorage.getById(req.params.id);
        if (!car) {
            return res.status(404).json({ message: 'Автомобіль не знайдено' });
        }

        if (car.ownerId.toString() !== req.userId) {
            return res.status(403).json({ message: 'У вас немає прав на видалення цього авто' });
        }

        await carStorage.delete(req.params.id);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

export default router;