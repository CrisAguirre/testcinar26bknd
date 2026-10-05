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
import { getAllowedOrigins } from './middlewares/authMiddleware.js';
import authRoutes from './routes/auth.js';
import gradeRoutes from './routes/grades.js';
import scheduleRoutes from './routes/schedule.js';
import enrollmentRoutes from './routes/enrollments.js';
import adminRoutes from './routes/admin.js';
import dfdRoutes from './routes/dfd.js';

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

async function seedAdmin() {
  // La contraseña del admin sale de ADMIN_PASSWORD (nunca del código).
  // Si la variable está definida, crea el admin o actualiza su contraseña
  // con ese valor: cambiar la variable + redesplegar = nueva contraseña.
  const initialPassword = process.env.ADMIN_PASSWORD;
  if (!initialPassword || initialPassword.length < 12) {
    if (isProd) {
      console.error('FATAL: ADMIN_PASSWORD no configurado (mínimo 12 caracteres). El servidor no arrancará.');
      process.exit(1);
    }
    console.warn('ADMIN_PASSWORD no configurado: se omite la sincronización del admin en desarrollo');
    return;
  }
  const hashedPassword = await bcrypt.hash(initialPassword, 12);
  const existing = await User.findOne({ $or: [{ username: 'admin' }, { email: 'admin@cinar.com' }] });
  if (existing) {
    existing.password = hashedPassword;
    if (existing.role !== 'admin') existing.role = 'admin';
    await existing.save();
    console.log('Contraseña admin sincronizada desde entorno');
    return;
  }
  await User.create({
    username: 'admin',
    email: 'admin@cinar.com',
    password: hashedPassword,
    full_name: 'Administrador Cinar',
    role: 'admin'
  });
  console.log('Usuario admin creado desde entorno');
}

// P1: CORS restringido a los frontends conocidos.
// P2: credentials:true para la cookie httpOnly de refresh (los
// navegadores exigen orígenes explícitos, nunca '*', con credenciales).
// Un origen no permitido se deniega sin cabeceras CORS (el navegador lo
// bloquea en limpio) en vez de responder 500.
const allowedOrigins = getAllowedOrigins().map((o) => o.replace(/\/+$/, ''));
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // llamadas server-to-server / curl
      if (allowedOrigins.length === 0) {
        if (!isProd) return cb(null, true);
        return cb(null, false);
      }
      return allowedOrigins.includes(origin.replace(/\/+$/, ''))
        ? cb(null, true)
        : cb(null, false);
    },
    credentials: true
  })
);
if (isProd && allowedOrigins.length === 0) {
  console.warn('AVISO: FRONTEND_URL(S) vacío en producción, ningún navegador podrá llamar la API');
}
app.use(helmet());
app.use(express.json({ limit: '100kb' }));

// P1: rate limiting anti fuerza-bruta y abuso.
// Límites pensados para redes escolares (varios estudiantes tras una misma IP).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos, intenta de nuevo en 15 minutos' }
});
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones, intenta más tarde' }
});
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', loginLimiter);
// Rate limit específico para admin: 300 req / 15 min (más relajado que auth, más estricto que API general)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones a la sección administrativa, intenta más tarde' }
});
app.use('/api/admin', adminLimiter);
app.use('/api/', apiLimiter);

// P2: las respuestas con datos personales no deben quedar en cachés.
app.use(['/api/grades', '/api/enrollments', '/api/auth/profile', '/api/admin'], (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

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
        refresh: 'POST /api/auth/refresh',
        logout: 'POST /api/auth/logout',
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
app.use('/api/admin', adminRoutes);
app.use('/api/dfd', dfdRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

await connectDB();
await seedAdmin();

if (process.env.EXAMS_LOCKED !== 'false') {
  console.log('Bloqueo de exámenes: ACTIVO (solo privilegiados pueden enviar calificaciones de exámenes)');
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
