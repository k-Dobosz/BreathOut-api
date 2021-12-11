import express, { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import axios from 'axios'
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

        const images: Array<Buffer> = files.map( (file: any): Promise<Buffer> => {
            return sharp(file.buffer).resize({ width: 640, height: 480 }).png().toBuffer()
        })

        Promise.all(images).then(async (imgs: Array<Buffer>) => {
            try {
                let imgsBase: Array<string> = []
                imgs.forEach(img => {
                    imgsBase.push(img.toString('base64'))
                })

                const place = new Place({
                    name: req.body.name,
                    description: req.body.description,
                    tags: req.body.tags,
                    instructions: req.body.instructions,
                    city: req.body.city,
                    lat: req.body.lat,
                    lon: req.body.lon,
                    addedBy: req.user.id,
                    images: imgsBase
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
        const place = await Place.findOne({ _id: placeId }).select('-__v')

        if (!place)
            return next(new AppError(req.polyglot.t('places.notfound.one'), 404))

        res.status(200).send(place)
    } catch (e) {
        next(e)
    }
})

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    const nextId = req.params.next
    const limit: any = req.query.limit
    const city = req.query.city || ''
    const range: any = req.query.range || 30
    let lat: any = req.query.lat
    let lon: any = req.query.lon

    try {
        let q = {...req.query}
        const notToUse = ['next', 'lat', 'lon', 'city', 'range']
        const newQuery = Object.keys(q)
            .filter((key) => !notToUse.includes(key))
            .reduce( (obj: any, key: string) => { 
                obj[key] = q[key] 
                return obj
            }, {} )

        let qs = JSON.stringify(newQuery)
        qs = qs.replace(/\b(gt|gte|lt|lte|eq|ne)\b/g, str => `$${str}`)

        const places = await Place.find(JSON.parse(qs))
        .sort({
            _id: -1
        })
        .select('-__v')
        .limit(limit || 10)

        if (!places || places.length <= 0)
            return next(new AppError(req.polyglot.t('places.notfound.many'), 404))


        let inRange = []

        if (city !== undefined && (lat == undefined || lon == undefined) && !(lat != undefined && lon != undefined)) {
            let res = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURI(String(city))}&format=json`)

            for(let i = 0; i < res.data.length; i++) {
                if (res.data[i].class == 'boundary') {
                    lat = res.data[i].lat
                    lon = res.data[i].lon
                    break
                }
            }
        }

        if (lat != undefined && lon != undefined) {
            for (let place of places) {
                //https://www.movable-type.co.uk/scripts/latlong.html
                const R = 6371e3 // metres
                const φ1 = lat * Math.PI/180 // φ, λ in radians
                const φ2 = parseFloat(place.lat) * Math.PI/180
                const Δφ = (parseFloat(place.lat)-lat) * Math.PI/180
                const Δλ = (parseFloat(place.lon)-lon) * Math.PI/180
        
                const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                        Math.cos(φ1) * Math.cos(φ2) *
                        Math.sin(Δλ/2) * Math.sin(Δλ/2)
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        
                const d = R * c // in metres
        
                if ((range * 1000) >= d) {
                    let p: any = place
                    p._doc.distance = d
                    inRange.push(p)
                }
            }
        } else {
            return res.status(200).send({
                data: places,
                next: places[places.length - 1]
            })
        }

        return res.status(200).send({
            data: inRange
        })
    } catch (e) {
        next(e)
    }
})

export { router as default }