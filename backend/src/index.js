import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { sanitizeBody } from './middleware/sanitizeBody.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import facultyRoutes from './routes/facultyRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import classRoutes from './routes/classRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import gradebookRoutes from './routes/gradebookRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import expulsionRoutes from './routes/expulsionRoutes.js';
import warningRoutes from './routes/warningRoutes.js';
import violationRoutes from './routes/violationRoutes.js';
import statisticsRoutes from './routes/statisticsRoutes.js';
import { initSocket } from './socket.js';

connectDB();

const app = express();
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeBody);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
});
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
app.use('/api', limiter);
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/faculties', facultyRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/classes', classRoutes);
app.use('/api', assignmentRoutes);
app.use('/api', gradebookRoutes);
app.use('/api/students', studentRoutes);
app.use('/api', attendanceRoutes);
app.use('/api', scheduleRoutes);
app.use('/api', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', leaveRoutes);
app.use('/api', expulsionRoutes);
app.use('/api', warningRoutes);
app.use('/api', violationRoutes);
app.use('/api', statisticsRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

initSocket(server);
