const axios = require('axios')
const pool = require('../config/db')
require('dotenv').config()

const getAccessToken = async () => {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64')

  const response = await axios.get(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  )
  return response.data.access_token
}

const stkPush = async (req, res) => {
  try {
    const { phone, amount, order_id } = req.body

    if (!phone || !amount) {
      return res.status(400).json({ message: 'Phone and amount are required' })
    }

    let formattedPhone = phone.toString().trim()
    if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.slice(1)
    } else if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1)
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone
    }

    console.log('Formatted phone:', formattedPhone)
    console.log('Amount:', Math.ceil(amount))
    console.log('Shortcode:', process.env.MPESA_SHORTCODE)
    console.log('Callback URL:', process.env.MPESA_CALLBACK_URL)

    const accessToken = await getAccessToken()
    console.log('Access token obtained successfully')

    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, 14)

    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64')

    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(amount),
      PartyA: formattedPhone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: `Siradify-${order_id || 'POS'}`,
      TransactionDesc: 'Payment for goods',
    }

    console.log('STK Push payload:', JSON.stringify(payload))

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    console.log('STK Push response:', JSON.stringify(response.data))

    res.status(200).json({
      message: 'STK Push sent successfully',
      data: response.data,
    })

  } catch (error) {
    console.error('M-Pesa error details:', JSON.stringify(error.response?.data))
    console.error('M-Pesa error message:', error.message)
    res.status(500).json({
      message: 'M-Pesa request failed',
      error: error.response?.data || error.message,
    })
  }
}

const callback = async (req, res) => {
  try {
    const { Body } = req.body

    if (Body.stkCallback.ResultCode === 0) {
      const metadata = Body.stkCallback.CallbackMetadata.Item
      const amount = metadata.find(item => item.Name === 'Amount')?.Value
      const mpesaCode = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value
      const phone = metadata.find(item => item.Name === 'PhoneNumber')?.Value

      console.log('M-Pesa Payment Successful:', {
        amount,
        mpesaCode,
        phone,
      })
    } else {
      console.log('M-Pesa Payment Failed:', Body.stkCallback.ResultDesc)
    }

    res.status(200).json({ message: 'Callback received' })
  } catch (error) {
    console.error('Callback error:', error.message)
    res.status(500).json({ message: 'Callback error' })
  }
}

const checkStatus = async (req, res) => {
  try {
    const { checkoutRequestId } = req.params

    const accessToken = await getAccessToken()

    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, 14)

    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64')

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    res.status(200).json(response.data)
  } catch (error) {
    console.error('Status check error:', error.response?.data || error.message)
    res.status(500).json({ message: 'Status check failed' })
  }
}

module.exports = { stkPush, callback, checkStatus }