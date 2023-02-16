const nodemailer = require('nodemailer')
const dotenv = require('dotenv')
dotenv.config()
module.exports = {

    generateOtp: (userEmail) => {
        return new Promise((resolve, reject) => {
            let otp = parseInt(Math.random() * 1000000)
            let mailOptions = {
                from: "meralecomm@gmail.com",
                to: userEmail,
                subject: "Otp for registration",
                html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>" // html body
            }
            let transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 465,
                service: 'gmail',
                auth: {
                    user: process.env.ADMIN_EMAIL,
                    pass: process.env.ADMIN_PASSWORD,
                }
            })
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    resolve({ status: false })
                } else {
                    resolve({ status: true, otp })
                }
            })
        })
    }
}