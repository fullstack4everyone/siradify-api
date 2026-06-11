const pool = require('../config/db')

const getProducts = async (req, res) => {
  try {
    const products = await pool.query(
      'SELECT id, name, CAST(price AS FLOAT) as price, stock, category, business_id, created_at FROM products ORDER BY created_at DESC'
    )
    res.status(200).json(products.rows)
  } catch (error) {
    console.error(error.message)
    res.status(500).json({ message: 'Server error' })
  }
}

const createProduct = async (req, res) => {
  try {
    const { name, price, stock, category } = req.body

    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required' })
    }

    const newProduct = await pool.query(
      'INSERT INTO products (name, price, stock, category, business_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, parseFloat(price), stock || 0, category || 'other', 1]
    )

    res.status(201).json({
      message: 'Product created successfully',
      product: newProduct.rows[0]
    })

  } catch (error) {
    console.error(error.message)
    res.status(500).json({ message: 'Server error' })
  }
}

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params
    const { name, price, stock, category } = req.body

    const updated = await pool.query(
      'UPDATE products SET name=$1, price=$2, stock=$3, category=$4 WHERE id=$5 RETURNING *',
      [name, parseFloat(price), stock, category, id]
    )

    if (updated.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' })
    }

    res.status(200).json({
      message: 'Product updated successfully',
      product: updated.rows[0]
    })

  } catch (error) {
    console.error(error.message)
    res.status(500).json({ message: 'Server error' })
  }
}

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params

    const deleted = await pool.query(
      'DELETE FROM products WHERE id=$1 RETURNING *', [id]
    )

    if (deleted.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' })
    }

    res.status(200).json({ message: 'Product deleted successfully' })

  } catch (error) {
    console.error(error.message)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getProducts, createProduct, updateProduct, deleteProduct }