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

app.get('/', (req, res) => {
  res.json({
    message: 'API de Calificaciones - Cinar Sistemas 2026',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile'
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
