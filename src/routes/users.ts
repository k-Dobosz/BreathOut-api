import express, { NextFunction, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { AppError } from '../middleware/error'
import User from '../models/user'
import auth from '../middleware/auth'
import user from '../models/user'
const router = express.Router()

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    const pass = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,32}$/
    
    const user = new User({
        fullname: req.body.fullname,
        email: req.body.email,
        password: req.body.password
    })

    if (!pass.test(user.password))
        return next(new AppError(req.polyglot.t('users.register.password:invalid'), 400))

    try {
        await user.save()
        const authtoken = await user.generateAuthToken()

        res.status(201).send({ user: {
            fullname: user.fullname,
            email: user.email
        }, token: authtoken })
    } catch (e) {
        next(e)
    }
})

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findByCredentials(req)

        const token = await user.generateAuthToken()

        res.status(200).send({ user: {
            fullname: user.fullname,
            email: user.email,
        }, token })
    } catch (e) {
        next(e)
    }
})

export { router as default }