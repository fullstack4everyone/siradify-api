const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth.middleware')
const { stkPush, callback, checkStatus } = require('../controllers/mpesa.controller')

router.post('/stkpush', protect, stkPush)
router.post('/callback', callback)
router.get('/status/:checkoutRequestId', protect, checkStatus)

module.exports = router