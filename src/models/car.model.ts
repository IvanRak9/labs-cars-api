import { Schema, model, Document } from 'mongoose';

export interface ICar {
    model: string;
    description?: string;
    year: number;
    transmission: 'manual' | 'automatic' | 'robotic';
    isAvailable: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    carAge?: number;
}

const carSchema = new Schema<ICar>({
    model: {
        type: String,
        required: [true, 'Модель є обов\'язковою'],
        trim: true,
        minlength: 1,
        maxlength: 100
    },
    description: {
        type: String,
        maxlength: 500
    },
    year: {
        type: Number,
        required: true,
        validate: {
            validator: (v: number) => v >= 1886 && v <= new Date().getFullYear(),
            message: (props: any) => `${props.value} не є валідним роком випуску!`
        }
    },
    transmission: {
        type: String,
        enum: ['manual', 'automatic', 'robotic'],
        required: true
    },
    isAvailable: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

carSchema.virtual('carAge').get(function() {
    return new Date().getFullYear() - this.year;
});

export const CarModel = model<ICar>('Car', carSchema);