import express, { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import Place from '../models/place'
import auth from '../middleware/auth'
import { AppError } from '../middleware/error'
const router = express.Router()
const upload = multer({
    limits: { fileSize: 625000 },
    fileFilter(req: Request, file: Express.Multer.File, cb) {
      if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
        return cb(new AppError("Please upload png, jpeg or jpg", 400));
      }
      cb(null, true);
    }
})

router.post('/', auth, upload.array('image', 5), async (req: Request, res: Response, next: NextFunction) => {
    try {
        if(!req.files || req.files.length <= 0)
            return next(new AppError(req.polyglot.t('places.notfound.images'), 400))

        const files: any = req.files

        const images = files.map( (file: any) => {
            return sharp(file.buffer).resize({ width: 640, height: 480 }).png().toBuffer()
        })

        Promise.all(images).then(async (imgs) => {
            try {
                const place = new Place({
                    name: req.body.name,
                    lat: req.body.lat,
                    lon: req.body.lon,
                    addedBy: req.user.id,
                    images: imgs
                })
    
                await place.save()
    
                res.status(201).send(place)
    
            } catch (e) {
                next(e)
            }
        })
    } catch (e) {
        next(e)
    }
})

router.get('/:placeId', async (req: Request, res: Response, next: NextFunction) => {
    const placeId = req.params.placeId

    try {
        const place = await Place.findOne({ _id: placeId })

        if (!place)
            return next(new AppError(req.polyglot.t('places.notfound.one'), 404))

        res.status(200).send(place)
    } catch (e) {
        next(e)
    }
})

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    const nextId = req.body.next
    const limit = req.body.limit || req.params.limit

    try {
        const places = await Place.find({
            $or: [{
                rank: { $gt: 0 }
            },
            {
                _id: { $lt: nextId }
            }]
        })
        .sort({
            _id: -1
        })
        .limit(limit || 10)
        .exec()

        if (!places || places.length <= 0)
            return next(new AppError(req.polyglot.t('places.notfound.many'), 404))

        res.status(200).send({
            data: places,
            next: places[places.length - 1]._id
        })
    } catch (e) {
        next(e)
    }
})

export { router as default }