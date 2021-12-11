import mongoose, { Document } from 'mongoose'

interface IPlace extends Document {
    name: string,
    description: string,
    city: string,
    lat: string,
    lon: string,
    addedBy: string,
    favorites: number,
    rank: number
    rankList: Array<object>,
    opinions: Array<object>,
    images: Array<string>
}

const placeSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    description: {
        type: String,
        trim: true,
        required: true
    },
    tags: {
        type: [String],
        required: false
    },
    instructions: {
        type: String,
        trim: true,
        required: false
    },
    city: {
        type: String,
        trim: true,
        required: true
    },
    lat: {
        type: String,
        required: true
    },
    lon: {
        type: String,
        required: true
    },
    addedBy: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    rank: {
        type: Number,
        default: 0,
        required: false,
    },
    rankList: [{
        userId: {
            type: mongoose.Types.ObjectId,
            index: true,
            required: true
        },
        rank: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        }
    }],
    opinions: [{
        userId: {
            type: mongoose.Types.ObjectId,
            index: true,
            required: true
        },
        opinion: {
            type: String,
            trim: true,
            required: true
        }
    }],
    images: {
        type: [String],
        required: true
    }
}, { timestamps: true })

const Place = mongoose.model<IPlace>('Place', placeSchema)

export { Place as default, IPlace }