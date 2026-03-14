import { Router, Request, Response } from 'express';
import { carStorage } from '../storage/car';
import { createCarSchema, updateCarSchema } from '../schemas/car.schema';
import { validate } from '../middleware/validate';

const router = Router();

router.get('/available', (req: Request, res: Response) => {
    const cars = carStorage.getAll().filter(car => car.isAvailable);
    res.status(200).json(cars);
});

// GET. отримання всіх записів
router.get('/', (req: Request, res: Response) => {
    const { minYear, transmission } = req.query;

    const filter: any = {};
    if (minYear) filter.minYear = parseInt(minYear as string, 10);
    if (transmission) filter.transmission = transmission as string;

    const cars = carStorage.getAll(filter);
    res.status(200).json(cars);
});

// GET. отримання за ID
router.get('/:id', (req: Request<{ id: string }>, res: Response) => {
    const car = carStorage.getById(req.params.id);
    if (!car) {
        return res.status(404).json({ message: 'Автомобіль не знайдено' });
    }
    res.status(200).json(car);
});

// POST. створення нового автомобіля
router.post('/', validate(createCarSchema), (req: Request, res: Response) => {
    const newCar = carStorage.create(req.body);
    res.status(201).json(newCar);
});

// PATCH. Оновлення вже існуючого автомобіля
router.patch('/:id', validate(updateCarSchema), (req: Request<{ id: string }>, res: Response) => {
    const updatedCar = carStorage.update(req.params.id, req.body);
    if (!updatedCar) {
        return res.status(404).json({ message: 'Автомобіль не знайдено' });
    }
    res.status(200).json(updatedCar);
});

// DELETE. Видалення автомобіля
router.delete('/:id', (req: Request<{ id: string }>, res: Response) => {
    const isDeleted = carStorage.delete(req.params.id);
    if (!isDeleted) {
        return res.status(404).json({ message: 'Автомобіль не знайдено' });
    }
    res.status(204).send();
});

export default router;