import { CarEntity, CreateCarInput, UpdateCarInput } from '../schemas/car.schema';
import crypto from 'crypto';

export interface CarFilter {
    minYear?: number;
    transmission?: 'manual' | 'automatic' | 'robotic';
}

class CarStorage {
    private cars: Map<string, CarEntity> = new Map();

    getAll(filter?: CarFilter): CarEntity[] {
        let result = Array.from(this.cars.values());

        if (filter) {
            if (filter.minYear) {
                result = result.filter(car => car.year >= filter.minYear!);
            }
            if (filter.transmission) {
                result = result.filter(car => car.transmission === filter.transmission);
            }
        }
        return result;
    }

    getById(id: string): CarEntity | undefined {
        return this.cars.get(id);
    }

    create(data: CreateCarInput): CarEntity {
        const id = crypto.randomUUID();
        const now = new Date();

        const newCar: CarEntity = {
            ...data,
            id,
            createdAt: now,
            updatedAt: now,
            isAvailable: data.isAvailable
        };

        this.cars.set(id, newCar);
        return newCar;
    }

    update(id: string, data: UpdateCarInput): CarEntity | null {
        const existingCar = this.cars.get(id);
        if (!existingCar) return null;

        const updatedCar: CarEntity = {
            ...existingCar,
            ...data,
            updatedAt: new Date()
        };

        this.cars.set(id, updatedCar);
        return updatedCar;
    }

    delete(id: string): boolean {
        return this.cars.delete(id);
    }

    reset(): void {
        this.cars.clear();
    }
}

export const carStorage = new CarStorage();