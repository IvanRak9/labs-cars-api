import { CarModel, ICar } from '../models/car.model';
import { CreateCarInput, UpdateCarInput } from '../schemas/car.schema';

export class CarStorage {
    async getAll(filter: any, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            CarModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            CarModel.countDocuments(filter)
        ]);

        return {
            data,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async getById(id: string) {
        return await CarModel.findById(id);
    }

    async create(data: CreateCarInput) {
        return await CarModel.create(data);
    }

    async update(id: string, data: UpdateCarInput) {
        return await CarModel.findByIdAndUpdate(id, data, {
            returnDocument: 'after',
            runValidators: true
        });
    }

    async delete(id: string) {
        return await CarModel.findByIdAndDelete(id);
    }
}

export const carStorage = new CarStorage();