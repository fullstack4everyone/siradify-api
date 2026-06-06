const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth.middleware')
const {
  createOrder,
  getOrders,
  getOrderById,
  updatePaymentStatus
} = require('../controllers/orders.controller')

router.post('/', protect, createOrder)
router.get('/', protect, getOrders)
router.get('/:id', protect, getOrderById)
router.put('/:id/payment', protect, updatePaymentStatus)

module.exports = router