const express = require('express')
import 'dotenv/config.js'
const router = require('./routes/index.ts')
import morgan from 'morgan'

const app = express()

const port = process.env.PORT || 8000

app.use('/public', express.static('public'))

app.use(express.urlencoded({ extended: false }))

app.use(express.json())

app.use(morgan('dev'))

app.use('/', router)

app.listen(port, () => {
    console.log(`⚡️ [server]: Server is running at https://localhost:${port}`)
})
