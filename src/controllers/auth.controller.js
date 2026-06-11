const pool = require('../config/db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    )

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const newUser = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, role || 'cashier']
    )

    const token = jwt.sign(
      { id: newUser.rows[0].id, role: newUser.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.status(201).json({
      message: 'Account created successfully',
      user: newUser.rows[0],
      token
    })

  } catch (error) {
    console.error(error.message)
    res.status(500).json({ message: 'Server error' })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const user = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    )

    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' })
    }

    const isMatch = await bcrypt.compare(password, user.rows[0].password)

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' })
    }

    const token = jwt.sign(
      { id: user.rows[0].id, role: user.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
        role: user.rows[0].role
      },
      token
    })

  } catch (error) {
    console.error(error.message)
    res.status(500).json({ message: 'Server error' })
  }
}

const registerCashier = async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    )

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const newUser = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, role || 'cashier']
    )

    res.status(201).json({
      message: 'Staff account created successfully',
      user: newUser.rows[0]
    })

  } catch (error) {
    console.error(error.message)
    res.status(500).json({ message: 'Server error' })
  }
}

const getStaff = async (req, res) => {
  try {
    const staff = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    )
    res.status(200).json(staff.rows)
  } catch (error) {
    console.error(error.message)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { register, login, registerCashier, getStaff }