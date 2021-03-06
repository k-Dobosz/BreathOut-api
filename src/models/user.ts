import mongoose, { Document, Model } from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import validator from 'validator'
import { AppError } from '../middleware/error'
import { Request } from 'express'

interface IUser extends Document {
    fullname: string,
    email: string
    password: string,
    tokens: Array<object>,
}

interface IUserDocument extends IUser, Document {
    generateAuthToken(): Promise<String>,
}

interface UserModel extends Model<IUserDocument> {
    findByCredentials(req: Request): IUserDocument
}

const userSchema = new mongoose.Schema<IUserDocument>({
    fullname: {
        type: String,
        required: true,
        trim: true,
        match: [/^[a-zA-Z\p{L}]+ [a-zA-Z\p{L}]+$/u, 'Name is invalid.']
    },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true,
        validate(value: string) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid.')
            }
        }
    },
    password: {
        type: String,
        required: true
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
}, { timestamps: true })

userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    return userObject
}

userSchema.static('findByCredentials', async function findByCredentials(req) {
    const user = await this.findOne({ email: req.body.email })

    if (!user) throw new AppError(req.polyglot.t('users.login.unable'), 400)

    const isMatch = await bcrypt.compare(req.body.password, user.password)

    if (!isMatch) throw new AppError(req.polyglot.t('users.login.unable'), 400)

    return user
})

userSchema.method('generateAuthToken', async function generateAuthToken() {
    const user = this
    const token: String = jwt.sign({ _id: user._id.toString() }, process.env.JWT_TOKEN_SECRET as jwt.Secret)

    user.tokens = [...user.tokens, { token }]
    await user.save()

    return token
})

userSchema.pre<IUserDocument>('save', async function(next) {
    const user = this

    if (user.isModified('password'))
        user.password = await bcrypt.hash(user.password, 10)

    next()
})

const User = mongoose.model<IUserDocument, UserModel>('User', userSchema)

export { User as default, IUserDocument }