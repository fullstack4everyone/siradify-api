const express = require('express')
const router = express.Router()
const { login, registerCashier, getStaff } = require('../controllers/auth.controller')
const { protect, adminOnly } = require('../middleware/auth.middleware')

// No public sign-up. New staff are added by an admin through /register-cashier.
router.post('/login', login)
router.post('/register-cashier', protect, adminOnly, registerCashier)
router.get('/staff', protect, adminOnly, getStaff)

module.exports = router