import nodemailer from 'nodemailer';

export const sendOtpEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    host:'smtp.gmail.com', 
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // ตั้งค่าในไฟล์ .env
      pass: process.env.EMAIL_PASS, // ตั้งค่าในไฟล์ .env
    },
    debug: true, // เปิดการ Debug
    logger: true, // แสดง Log เพิ่มเติม
  });
  const verificationCode = `<p>Your OTP code is: <strong>${otp}</strong></p>`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}`,
    html: verificationCode,
  };

  await transporter.sendMail(mailOptions);
};
