const express = require('express')
const cors = require('cors')
require('dotenv').config()
require('./config/db')

const authRoutes = require('./routes/auth.routes')
const productRoutes = require('./routes/products.routes')
const orderRoutes = require('./routes/orders.routes')
const mpesaRoutes = require('./routes/mpesa.routes')

const app = express()

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    message: 'Siradify API is running',
    version: '1.0.0'
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/mpesa', mpesaRoutes)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Siradify API running on port ${PORT}`)
})

module.exports = app


