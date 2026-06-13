const { Resend } = require('resend')
const cron = require('node-cron')
const pool = require('../config/db')

const resend = new Resend(process.env.RESEND_API_KEY)

const sendDailyReport = async () => {
  try {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    const ordersRes = await pool.query(
      `SELECT * FROM orders WHERE created_at >= $1 AND created_at < $2`,
      [startOfDay, endOfDay]
    )
    const orders = ordersRes.rows

    const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total), 0)
    const paidOrders = orders.filter(o => o.payment_status === 'paid')
    const pendingOrders = orders.filter(o => o.payment_status === 'pending')
    const mpesaOrders = orders.filter(o => o.payment_method === 'mpesa')
    const cashOrders = orders.filter(o => o.payment_method === 'cash')
    const mpesaRevenue = mpesaOrders.reduce((sum, o) => sum + parseFloat(o.total), 0)
    const cashRevenue = cashOrders.reduce((sum, o) => sum + parseFloat(o.total), 0)

    const lowStockRes = await pool.query(
      `SELECT name, stock FROM products WHERE stock <= 10 ORDER BY stock ASC`
    )
    const lowStockProducts = lowStockRes.rows

    const dateStr = today.toLocaleDateString('en-KE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const lowStockHTML = lowStockProducts.length > 0 ? `
      <div style="background: #FEF3C7; border-radius: 8px; padding: 16px; margin-top: 20px; border-left: 4px solid #F59E0B;">
        <h3 style="color: #92400E; font-size: 14px; font-weight: 700; margin: 0 0 12px;">⚠️ Low Stock Alert</h3>
        ${lowStockProducts.map(p => `
          <div style="padding: 6px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size: 13px; color: #92400E;">${p.name}</td>
                <td style="text-align: right; font-size: 13px; font-weight: 700; color: ${p.stock === 0 ? '#DC2626' : '#92400E'};">
                  ${p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                </td>
              </tr>
            </table>
          </div>
        `).join('')}
      </div>
    ` : ''

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Siradify Daily Report</title>
      </head>
      <body style="margin: 0; padding: 0; background: #F4F6F9; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">

          <div style="background: #0A1F44; border-radius: 12px 12px 0 0; padding: 24px; text-align: center;">
            <div style="width: 50px; height: 50px; background: #F5A623; border-radius: 12px; margin: 0 auto 12px; line-height: 50px; text-align: center;">
              <span style="color: #0A1F44; font-weight: 800; font-size: 24px;">S</span>
            </div>
            <h1 style="color: #fff; font-size: 20px; font-weight: 700; margin: 0 0 4px;">Siradify POS</h1>
            <p style="color: #F5A623; font-size: 11px; margin: 0; letter-spacing: 2px;">FROM VISION TO REALITY</p>
          </div>

          <div style="background: #fff; padding: 24px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <h2 style="color: #0A1F44; font-size: 18px; font-weight: 700; margin: 0 0 4px;">Daily Sales Report</h2>
            <p style="color: #6B7280; font-size: 13px; margin: 0 0 24px;">${dateStr}</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
              <tr>
                <td width="50%" style="padding-right: 6px;">
                  <div style="background: #F4F6F9; border-radius: 10px; padding: 16px; border-left: 4px solid #F5A623;">
                    <p style="color: #6B7280; font-size: 11px; margin: 0 0 4px; font-weight: 500;">TOTAL REVENUE</p>
                    <p style="color: #0A1F44; font-size: 22px; font-weight: 800; margin: 0;">KES ${totalRevenue.toLocaleString()}</p>
                  </div>
                </td>
                <td width="50%" style="padding-left: 6px;">
                  <div style="background: #F4F6F9; border-radius: 10px; padding: 16px; border-left: 4px solid #0A1F44;">
                    <p style="color: #6B7280; font-size: 11px; margin: 0 0 4px; font-weight: 500;">TOTAL ORDERS</p>
                    <p style="color: #0A1F44; font-size: 22px; font-weight: 800; margin: 0;">${orders.length}</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td width="50%" style="padding-right: 6px; padding-top: 12px;">
                  <div style="background: #F4F6F9; border-radius: 10px; padding: 16px; border-left: 4px solid #10B981;">
                    <p style="color: #6B7280; font-size: 11px; margin: 0 0 4px; font-weight: 500;">PAID</p>
                    <p style="color: #10B981; font-size: 22px; font-weight: 800; margin: 0;">${paidOrders.length}</p>
                  </div>
                </td>
                <td width="50%" style="padding-left: 6px; padding-top: 12px;">
                  <div style="background: #F4F6F9; border-radius: 10px; padding: 16px; border-left: 4px solid #EF4444;">
                    <p style="color: #6B7280; font-size: 11px; margin: 0 0 4px; font-weight: 500;">PENDING</p>
                    <p style="color: #EF4444; font-size: 22px; font-weight: 800; margin: 0;">${pendingOrders.length}</p>
                  </div>
                </td>
              </tr>
            </table>

            <h3 style="color: #0A1F44; font-size: 14px; font-weight: 700; margin: 0 0 12px;">Payment Breakdown</h3>
            <div style="background: #F4F6F9; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
              <div style="padding-bottom: 10px; margin-bottom: 10px; border-bottom: 1px solid #E5E7EB;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size: 13px; color: #374151;">📱 M-Pesa</td>
                    <td style="text-align: right;">
                      <span style="font-size: 13px; font-weight: 700; color: #0A1F44;">KES ${mpesaRevenue.toLocaleString()}</span>
                      <span style="font-size: 11px; color: #6B7280; margin-left: 8px;">${mpesaOrders.length} orders</span>
                    </td>
                  </tr>
                </table>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 13px; color: #374151;">💵 Cash</td>
                  <td style="text-align: right;">
                    <span style="font-size: 13px; font-weight: 700; color: #0A1F44;">KES ${cashRevenue.toLocaleString()}</span>
                    <span style="font-size: 11px; color: #6B7280; margin-left: 8px;">${cashOrders.length} orders</span>
                  </td>
                </tr>
              </table>
            </div>

            ${lowStockHTML}

            <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center;">
              <a href="https://siradify-pos.vercel.app" style="background: #0A1F44; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; display: inline-block;">
                View Full Dashboard
              </a>
            </div>

            <p style="color: #9CA3AF; font-size: 11px; text-align: center; margin: 20px 0 0;">
              This report is sent automatically every evening by Siradify POS
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    const result = await resend.emails.send({
      from: 'Siradify POS <onboarding@resend.dev>',
      to: process.env.REPORT_EMAIL,
      subject: `Siradify Daily Report - ${dateStr} - KES ${totalRevenue.toLocaleString()}`,
      html,
    })

    console.log('Daily report sent:', JSON.stringify(result))

  } catch (error) {
    console.error('Failed to send daily report:', error.message)
    throw error
  }
}

const scheduleDailyReport = () => {
  cron.schedule('0 21 * * *', sendDailyReport, {
    timezone: 'Africa/Nairobi'
  })
  console.log('Daily report scheduled for 9pm Nairobi time')
}

module.exports = { scheduleDailyReport, sendDailyReport }