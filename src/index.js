import './config/timezone.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
config();

import { connectDB } from './config/database.js';
import User from './models/User.js';
import authRoutes from './routes/auth.js';
import gradeRoutes from './routes/grades.js';
import scheduleRoutes from './routes/schedule.js';
import enrollmentRoutes from './routes/enrollments.js';

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

async function seedAdmin() {
  // P0: la contraseña inicial sale de ADMIN_PASSWORD (nunca del código).
  // Solo crea el admin si no existe; jamás resetea una contraseña existente.
  const existing = await User.findOne({ $or: [{ username: 'admin' }, { email: 'admin@cinar.com' }] });
  if (existing) {
    console.log('Usuario admin ya existe, no se modifica');
    return;
  }
  const initialPassword = process.env.ADMIN_PASSWORD;
  if (!initialPassword || initialPassword.length < 12) {
    if (isProd) {
      console.error('FATAL: ADMIN_PASSWORD no configurado (mínimo 12 caracteres). El servidor no arrancará.');
      process.exit(1);
    }
    console.warn('ADMIN_PASSWORD no configurado: se omite la creación del admin en desarrollo');
    return;
  }
  const hashedPassword = await bcrypt.hash(initialPassword, 12);
  await User.create({
    username: 'admin',
    email: 'admin@cinar.com',
    password: hashedPassword,
    full_name: 'Administrador Cinar',
    role: 'admin'
  });
  console.log('Usuario admin creado (cambia su contraseña tras el primer ingreso)');
}

// P1: CORS restringido a los frontends conocidos.
const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // llamadas server-to-server / curl
      if (allowedOrigins.length === 0) {
        if (!isProd) return cb(null, true);
        return cb(new Error('Origen no permitido por CORS'));
      }
      return allowedOrigins.includes(origin)
        ? cb(null, true)
        : cb(new Error('Origen no permitido por CORS'));
    }
  })
);
app.use(helmet());
app.use(express.json({ limit: '100kb' }));

// P1: rate limiting anti fuerza-bruta y abuso.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos, intenta de nuevo en 15 minutos' }
});
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones, intenta más tarde' }
});
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', loginLimiter);
app.use('/api/', apiLimiter);

app.use((req, res, next) => {
  const start = Date.now();
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    const duration = Date.now() - start;
    const userId = req.user?.id || req.user?._id || 'anonymous';
    console.log(
      JSON.stringify({
        event: 'api_request',
        method: req.method,
        path: req.originalUrl,
        userId,
        status: res.statusCode,
        durationMs: duration,
        timestamp: new Date().toISOString()
      })
    );
    return originalJson(body);
  };
  next();
});

app.get('/', (req, res) => {
  res.json({
    message: 'API de Calificaciones - Cinar Sistemas 2026',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile',
        createUser: 'POST /api/auth/users (admin)',
        deleteUser: 'DELETE /api/auth/users/:id (admin)'
      },
      grades: {
        list: 'GET /api/grades',
        mine: 'GET /api/grades/mine',
        detail: 'GET /api/grades/:id',
        create: 'POST /api/grades',
        update: 'PUT /api/grades/:id',
        delete: 'DELETE /api/grades/:id'
      },
      schedule: {
        status: 'GET /api/schedule'
      },
      enrollments: {
        mine: 'GET /api/enrollments/mine',
        enroll: 'POST /api/enrollments',
        courseEnrollments: 'GET /api/enrollments/course/:course',
        unenroll: 'DELETE /api/enrollments/:userId/:course'
      }
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/enrollments', enrollmentRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

await connectDB();
await seedAdmin();

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
