import mongoose, { Document } from 'mongoose'

interface IPlace extends Document {
    name: string,
    lat: string,
    lon: string
}

const placeSchema = new mongoose.Schema({
    name: {
        type: String,
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
    ranking: [{
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
    }]
}, { timestamps: true })

const Place = mongoose.model<IPlace>('Place', placeSchema)

export { Place as default, IPlace }