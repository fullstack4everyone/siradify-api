const express = require('express')
const router = express.Router()
const { register, login, registerCashier, getStaff } = require('../controllers/auth.controller')
const { protect, adminOnly } = require('../middleware/auth.middleware')

router.post('/register', register)
router.post('/login', login)
router.post('/register-cashier', protect, adminOnly, registerCashier)
router.get('/staff', protect, adminOnly, getStaff)

module.exports = router