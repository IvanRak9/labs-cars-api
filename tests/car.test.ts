import request from 'supertest';
import app from '../src/app';
import { carStorage } from '../src/storage/car';
import { CreateCarInput } from '../src/schemas/car.schema';

beforeEach(() => {
    carStorage.reset();
});

describe('Cars REST API', () => {

    const validCar: CreateCarInput = {
        model: 'Toyota Camry',
        description: 'Надійний седан',
        year: 2022,
        transmission: 'automatic',
        isAvailable: true
    };

    describe('POST /api/cars', () => {
        it('повинен створити новий автомобіль та повернути 201', async () => {
            const res = await request(app)
                .post('/api/cars')
                .send(validCar)
                .expect(201);

            expect(res.body).toHaveProperty('id');
            expect(res.body.model).toBe(validCar.model);
            expect(res.body.isAvailable).toBe(true);
            expect(res.body).toHaveProperty('createdAt');
        });

        it('повинен повернути 400, якщо відсутні обов\'язкові поля', async () => {
            const invalidCar = { year: 2020 };

            const res = await request(app)
                .post('/api/cars')
                .send(invalidCar)
                .expect(400);

            expect(res.body.message).toBe('Помилка валідації даних');
            expect(res.body.errors.length).toBeGreaterThan(0);
        });

        it('повинен повернути 400, якщо передано невалідне значення enum', async () => {
            const invalidCar = { ...validCar, transmission: 'magic' };

            await request(app)
                .post('/api/cars')
                .send(invalidCar)
                .expect(400);
        });
    });

    describe('GET /api/cars', () => {
        it('повинен повернути порожній масив, якщо немає записів', async () => {
            const res = await request(app).get('/api/cars').expect(200);
            expect(res.body).toEqual([]);
        });

        it('повинен повернути масив усіх збережених автомобілів', async () => {
            carStorage.create(validCar);
            carStorage.create({ ...validCar, model: 'Honda Civic' });

            const res = await request(app).get('/api/cars').expect(200);
            expect(res.body).toHaveLength(2);
        });
    });

    describe('GET /api/cars/:id', () => {
        it('повинен повернути автомобіль за існуючим ID', async () => {
            const car = carStorage.create(validCar);

            const res = await request(app)
                .get(`/api/cars/${car.id}`)
                .expect(200);

            expect(res.body.id).toBe(car.id);
            expect(res.body.model).toBe(car.model);
        });

        it('повинен повернути 404, якщо автомобіль не знайдено', async () => {
            await request(app)
                .get('/api/cars/non-existent-id')
                .expect(404);
        });
    });

    describe('PATCH /api/cars/:id', () => {
        it('повинен частково оновити автомобіль та повернути 200', async () => {
            const car = carStorage.create(validCar);

            const res = await request(app)
                .patch(`/api/cars/${car.id}`)
                .send({ year: 2025, isAvailable: false })
                .expect(200);

            expect(res.body.year).toBe(2025);
            expect(res.body.isAvailable).toBe(false);
            expect(res.body.model).toBe(validCar.model);
        });

        it('повинен повернути 400 при спробі встановити невалідні дані', async () => {
            const car = carStorage.create(validCar);

            await request(app)
                .patch(`/api/cars/${car.id}`)
                .send({ year: 1500 })
                .expect(400);
        });

        it('повинен повернути 404 при оновленні неіснуючого ID', async () => {
            await request(app)
                .patch('/api/cars/fake-id')
                .send({ year: 2023 })
                .expect(404);
        });
    });

    describe('DELETE /api/cars/:id', () => {
        it('повинен видалити автомобіль та повернути 204', async () => {
            const car = carStorage.create(validCar);

            await request(app)
                .delete(`/api/cars/${car.id}`)
                .expect(204);

            expect(carStorage.getById(car.id)).toBeUndefined();
        });

        it('повинен повернути 404 при спробі видалити неіснуючий автомобіль', async () => {
            await request(app)
                .delete('/api/cars/fake-id')
                .expect(404);
        });
    });

    describe('GET /api/cars (Query Filters)', () => {
        beforeEach(() => {
            carStorage.create({ ...validCar, model: 'Old Manual', year: 2005, transmission: 'manual', isAvailable: true });
            carStorage.create({ ...validCar, model: 'New Auto', year: 2024, transmission: 'automatic', isAvailable: false });
            carStorage.create({ ...validCar, model: 'Mid Robotic', year: 2015, transmission: 'robotic', isAvailable: true });
        });

        it('повинен фільтрувати за роком (minYear)', async () => {
            const res = await request(app).get('/api/cars?minYear=2020').expect(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].model).toBe('New Auto');
        });

        it('повинен фільтрувати за трансмісією', async () => {
            const res = await request(app).get('/api/cars?transmission=manual').expect(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].model).toBe('Old Manual');
        });

        it('повинен комбінувати фільтри', async () => {
            const res = await request(app).get('/api/cars?minYear=2020&transmission=automatic').expect(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].model).toBe('New Auto');

            const emptyRes = await request(app).get('/api/cars?minYear=2020&transmission=manual').expect(200);
            expect(emptyRes.body).toHaveLength(0);
        });
    });

    describe('GET /api/cars/available (Специфічний маршрут)', () => {
        it('повинен повертати лише доступні автомобілі', async () => {
            carStorage.create({ ...validCar, model: 'Car 1', isAvailable: true });
            carStorage.create({ ...validCar, model: 'Car 2', isAvailable: false });
            carStorage.create({ ...validCar, model: 'Car 3', isAvailable: true });

            const res = await request(app).get('/api/cars/available').expect(200);

            expect(res.body).toHaveLength(2);
            res.body.forEach((car: any) => {
                expect(car.isAvailable).toBe(true);
            });
        });
    });
    describe('Обробник помилок (500)', () => {
        it('повинен повернути статус 500, якщо сталася внутрішня помилка сервера', async () => {
            jest.spyOn(carStorage, 'getAll').mockImplementationOnce(() => {
                throw new Error('Системний збій');
            });

            const res = await request(app)
                .get('/api/cars')
                .expect(500);

            expect(res.body.message).toBe('Внутрішня помилка сервера');
        });
    });
});