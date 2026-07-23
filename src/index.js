import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
config();

import { connectDB } from './config/database.js';
import User from './models/User.js';
import authRoutes from './routes/auth.js';
import gradeRoutes from './routes/grades.js';

const app = express();
const PORT = process.env.PORT || 3000;

async function seedAdmin() {
  const admin = await User.findOne({ username: 'admin' });
  if (!admin) {
    const hashedPassword = await bcrypt.hash('Janis724@', 10);
    await User.create({
      username: 'admin',
      email: 'admin@cinar.com',
      password: hashedPassword,
      full_name: 'Administrador Cinar',
      role: 'admin'
    });
    console.log('Usuario admin creado (admin / Janis724@)');
  } else {
    console.log('Usuario admin ya existe');
  }
}

app.use(cors());
app.use(express.json());

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
        deleteUser: 'DELETE /api/auth/users/:id'
      },
      grades: {
        list: 'GET /api/grades',
        mine: 'GET /api/grades/mine',
        detail: 'GET /api/grades/:id',
        create: 'POST /api/grades',
        update: 'PUT /api/grades/:id',
        delete: 'DELETE /api/grades/:id'
      }
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/grades', gradeRoutes);

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
