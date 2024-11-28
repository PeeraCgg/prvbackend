import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import AuthRoutes from './routes/auth.routes.js';
import path from 'path';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// cors
app.use(cors());

// Serve static files
const __dirname = path.resolve(); // ใช้ path.resolve() เพื่อกำหนด __dirname
app.use(express.static(path.join(__dirname, 'dist'))); // ให้ Express เสิร์ฟไฟล์จากโฟลเดอร์ dist


// Fallback route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html')); // ส่งกลับ index.html สำหรับทุก request ที่ไม่ตรงกับ API
});
//api way
app.use('/user', AuthRoutes)
// listen on port
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
  
 export default app;