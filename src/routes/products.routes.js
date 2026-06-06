const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth.middleware')
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/products.controller')

router.get('/', protect, getProducts)
router.post('/', protect, createProduct)
router.put('/:id', protect, updateProduct)
router.delete('/:id', protect, deleteProduct)

module.exports = router