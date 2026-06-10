const pool = require('../config/db')

const createOrder = async (req, res) => {
  try {
    const { items, payment_method, customer_phone } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must have at least one item' })
    }

    let total = 0
    for (const item of items) {
      total += item.price * item.quantity
    }

    const newOrder = await pool.query(
      'INSERT INTO orders (total, payment_method, customer_phone, user_id, business_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [total, payment_method || 'cash', customer_phone || null, req.user.id, 1]
    )

    const orderId = newOrder.rows[0].id

    for (const item of items) {
      await pool.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [orderId, item.product_id, item.quantity, item.price]
      )
      await pool.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      )
    }

    const orderItems = await pool.query(
      'SELECT oi.*, p.name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1',
      [orderId]
    )

    res.status(201).json({
      message: 'Order created successfully',
      order: newOrder.rows[0],
      items: orderItems.rows
    })

  } catch (error) {
    console.error(error.message)
    res.status(500).json({ message: 'Server error' })
  }
}

const getOrders = async (req, res) => {
  try {
    const orders = await pool.query(
      'SELECT * FROM orders ORDER BY created_at DESC'
    )
    res.status(200).json(orders.rows)
  } catch (error) {
    console.error(error.message)
    res.status(500).json({ message: 'Server error' })
  }
}

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params

    const order = await pool.query(
      'SELECT * FROM orders WHERE id = $1', [id]
    )

    if (order.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' })
    }

    const items = await pool.query(
      'SELECT oi.*, p.name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1',
      [id]
    )

    res.status(200).json({
      order: order.rows[0],
      items: items.rows
    })

  } catch (error) {
    console.error(error.message)
    res.status(500).json({ message: 'Server error' })
  }
}

const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { payment_status } = req.body

    const updated = await pool.query(
      'UPDATE orders SET payment_status = $1 WHERE id = $2 RETURNING *',
      [payment_status, id]
    )

    if (updated.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' })
    }

    res.status(200).json({
      message: 'Payment status updated',
      order: updated.rows[0]
    })

  } catch (error) {
    console.error(error.message)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { createOrder, getOrders, getOrderById, updatePaymentStatus }