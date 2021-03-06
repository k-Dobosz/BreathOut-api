import express, { Request, Response, NextFunction } from 'express'
import logger from 'morgan'
import bodyParser from 'body-parser'
import mongo from './database/db'
import cors from 'cors'
import createLocaleMiddleware from 'express-locale'
import Polyglot from 'node-polyglot'

import usersRouter from './routes/users'
import placesRouter from './routes/places'
import errorMiddleware, { AppError } from './middleware/error'

const app = express()
const db = mongo()

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors({
    origin: '*',
    methods: 'GET, PUT, PATCH, POST, DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204
}))
app.use(createLocaleMiddleware({
    "priority": ["accept-language", "default"],
    "default": "pl-PL"
  }))

app.use(async (req, res, next) => {
    const locale = req.locale.language
    req.polyglot = new Polyglot()

    await import(`./locales/${ locale }`).then(t => {
        req.polyglot.extend(t)
    })

    next()
})

app.use('/api/v1/users', usersRouter)
app.use('/api/v1/places', placesRouter)

app.all('*', (req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`${req.polyglot.t('errors.unable:to:find')} ${req.originalUrl}`, 404))
})

app.use(errorMiddleware)

export { app as default }