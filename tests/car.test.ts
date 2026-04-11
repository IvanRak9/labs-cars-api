import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { setupTestDB, clearTestDB, teardownTestDB } from './setup';
import { CarModel } from '../src/models/car.model';
import { carStorage } from '../src/storage/car';

beforeAll(async () => {
    await setupTestDB();
});

afterEach(async () => {
    await clearTestDB();
});

afterAll(async () => {
    await teardownTestDB();
});

describe('Автомобільний REST API (MongoDB)', () => {

    const validCar = {
        model: 'Toyota Camry',
        description: 'Надійний седан',
        year: 2022,
        transmission: 'automatic',
        isAvailable: true
    };

    describe('Unit-тести Моделі (CarModel)', () => {
        it('повинна коректно зберігати валідний автомобіль', async () => {
            const car = new CarModel(validCar);
            const savedCar = await car.save();
            expect(savedCar._id).toBeDefined();
            expect(savedCar.model).toBe(validCar.model);
            expect(savedCar.createdAt).toBeDefined();
        });

        it('повинна встановлювати дефолтне значення isAvailable = true', async () => {
            const carData = { ...validCar };
            delete (carData as any).isAvailable;

            const car = new CarModel(carData);
            const savedCar = await car.save();
            expect(savedCar.isAvailable).toBe(true);
        });

        it('повинна кидати помилку при невалідному році випуску (кастомний валідатор)', async () => {
            const car = new CarModel({ ...validCar, year: 1800 });
            let err;
            try { await car.save(); } catch (e) { err = e; }
            expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
        });

        it('повинен повернути 400 при mongoose ValidationError', async () => {
            const validationError = new mongoose.Error.ValidationError();
            jest.spyOn(carStorage, 'create').mockRejectedValueOnce(validationError);

            const res = await request(app)
                .post('/api/cars')
                .send(validCar)
                .expect(400);

            expect(res.body.message).toBe('Помилка валідації БД');
        });

        it('повинна обчислювати віртуальну властивість carAge', async () => {
            const currentYear = new Date().getFullYear();
            const car = new CarModel({ ...validCar, year: currentYear - 5 });
            expect(car.carAge).toBe(5);
        });
    });

    describe('Інтеграційні тести API', () => {

        describe('POST /api/cars', () => {
            it('повинен створити новий автомобіль та повернути 201', async () => {
                const res = await request(app)
                    .post('/api/cars')
                    .send(validCar)
                    .expect(201);

                expect(res.body).toHaveProperty('id');
                expect(res.body.model).toBe(validCar.model);
            });

            it('повинен повернути 400 (Zod), якщо відсутні обов\'язкові поля', async () => {
                const invalidCar = { year: 2020 };
                const res = await request(app)
                    .post('/api/cars')
                    .send(invalidCar)
                    .expect(400);

                expect(res.body.message).toBe('Помилка валідації даних (Zod)');
            });
        });

        describe('GET /api/cars', () => {
            it('повинен повернути об\'єкт з data та pagination, якщо немає записів', async () => {
                const res = await request(app).get('/api/cars').expect(200);
                expect(res.body.data).toEqual([]);
                expect(res.body.pagination.total).toBe(0);
            });

            it('повинен повернути сторінку з автомобілями', async () => {
                await CarModel.create(validCar);
                await CarModel.create({ ...validCar, model: 'Honda Civic' });

                const res = await request(app).get('/api/cars?limit=1').expect(200);
                expect(res.body.data).toHaveLength(1);
                expect(res.body.pagination.total).toBe(2);
            });

            it('повинен фільтрувати по minYear і transmission', async () => {
                await CarModel.create({ ...validCar, year: 2010, transmission: 'manual' });
                await CarModel.create({ ...validCar, year: 2022, transmission: 'automatic' });

                const res = await request(app)
                    .get('/api/cars?minYear=2020&transmission=automatic')
                    .expect(200);

                expect(res.body.data).toHaveLength(1);
                expect(res.body.data[0].year).toBeGreaterThanOrEqual(2020);
                expect(res.body.data[0].transmission).toBe('automatic');
            });
        });

        describe('GET /api/cars/:id', () => {
            it('повинен повернути автомобіль за існуючим ID', async () => {
                const car = await CarModel.create(validCar);
                const res = await request(app)
                    .get(`/api/cars/${car._id}`)
                    .expect(200);
                expect(res.body.model).toBe(car.model);
            });

            it('повинен повернути 404, якщо автомобіль не знайдено (але ID валідний)', async () => {
                const fakeId = new mongoose.Types.ObjectId();
                await request(app)
                    .get(`/api/cars/${fakeId}`)
                    .expect(404);
            });

            it('повинен повернути 400, якщо передано невалідний формат ID (CastError)', async () => {
                const res = await request(app)
                    .get('/api/cars/not-a-mongo-id')
                    .expect(400);
                expect(res.body.message).toBe('Невалідний формат ID');
            });
        });

        describe('PATCH /api/cars/:id', () => {
            it('повинен частково оновити автомобіль та повернути 200', async () => {
                const car = await CarModel.create(validCar);
                const res = await request(app)
                    .patch(`/api/cars/${car._id}`)
                    .send({ year: 2025 })
                    .expect(200);

                expect(res.body.year).toBe(2025);
                expect(res.body.model).toBe(validCar.model);
            });

            it('повинен повернути 400 (Zod) при передачі невалідного enum', async () => {
                const car = await CarModel.create(validCar);
                const res = await request(app)
                    .patch(`/api/cars/${car._id}`)
                    .send({ transmission: 'invalid_enum' })
                    .expect(400);

                expect(res.body.message).toBe('Помилка валідації даних (Zod)');
            });

            it('повинен повернути 404 при оновленні неіснуючого авто', async () => {
                const fakeId = new mongoose.Types.ObjectId();
                await request(app)
                    .patch(`/api/cars/${fakeId}`)
                    .send({ year: 2025 })
                    .expect(404);
            });
        });

        describe('DELETE /api/cars/:id', () => {
            it('повинен видалити автомобіль та повернути 204', async () => {
                const car = await CarModel.create(validCar);
                await request(app)
                    .delete(`/api/cars/${car._id}`)
                    .expect(204);

                const foundCar = await CarModel.findById(car._id);
                expect(foundCar).toBeNull();
            });

            it('повинен повернути 404 при видаленні неіснуючого авто', async () => {
                const fakeId = new mongoose.Types.ObjectId();
                await request(app)
                    .delete(`/api/cars/${fakeId}`)
                    .expect(404);
            });
        });

        describe('GET /api/cars/available (Специфічний маршрут)', () => {
            it('повинен повертати лише доступні автомобілі', async () => {
                await CarModel.create({ ...validCar, isAvailable: true });
                await CarModel.create({ ...validCar, isAvailable: false });

                const res = await request(app).get('/api/cars/available').expect(200);
                expect(res.body).toHaveLength(1);
                expect(res.body[0].isAvailable).toBe(true);
            });
        });

        describe('Граничні випадки та помилки БД (для 100% покриття)', () => {
            it('повинен повернути 409 при дублікаті унікального ключа (код 11000)', async () => {
                jest.spyOn(carStorage, 'create').mockRejectedValueOnce({ code: 11000 });
                await request(app).post('/api/cars').send(validCar).expect(409);
            });

            it('повинен ловити помилки в catch для GET /available', async () => {
                jest.spyOn(carStorage, 'getAll').mockRejectedValueOnce(new Error('DB'));
                await request(app).get('/api/cars/available').expect(500);
            });

            it('повинен ловити помилки в catch для PATCH', async () => {
                jest.spyOn(carStorage, 'update').mockRejectedValueOnce(new Error('DB'));
                await request(app).patch(`/api/cars/${new mongoose.Types.ObjectId()}`).send({ year: 2025 }).expect(500);
            });

            it('повинен ловити помилки в catch для DELETE', async () => {
                jest.spyOn(carStorage, 'delete').mockRejectedValueOnce(new Error('DB'));
                await request(app).delete(`/api/cars/${new mongoose.Types.ObjectId()}`).expect(500);
            });

            it('повинен гарантовано ловити CastError', async () => {
                const castErr = new Error('Cast failed');
                castErr.name = 'CastError';
                jest.spyOn(carStorage, 'getById').mockRejectedValueOnce(castErr);
                await request(app).get('/api/cars/fake').expect(400);
            });
        });
    });
});