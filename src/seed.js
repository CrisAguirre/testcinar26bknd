import { config } from 'dotenv';
config();
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from './models/User.js';

const MONGODB_URI = process.env.MONGODB_URI;

const students = [
  { code: '1', full_name: 'DIEGO SEBASTIAN AZAIN MORAN', email: 'd.azain@cinar.edu.co', password: '@cc3501' },
  { code: '2', full_name: 'JAIRO DANIEL ZAMBRANO VALLEID', email: 'j.zambrano@cinar.edu.co', password: '@cc3502' },
  { code: '3', full_name: 'DAVID ALEJANDRO GARCIA ENRIQUEZ', email: 'd.garcia@cinar.edu.co', password: '@cc3503' },
  { code: '4', full_name: 'HAROLD ESTEBAN QUIROZ ALVAREZ', email: 'h.quiroz@cinar.edu.co', password: '@cc3504' },
  { code: '5', full_name: 'ANDRES FELIPE MEZA LEON', email: 'a.meza@cinar.edu.co', password: '@cc3505' },
  { code: '6', full_name: 'JEISON STIVEN MARTINEZ ZAMBRA', email: 'jeison.martinez@cinar.edu.co', password: '@cc3506' },
  { code: '7', full_name: 'WILLIAM DAVID SALAS LASSO', email: 'w.salas@cinar.edu.co', password: '@cc3507' },
];

async function seedStudents() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado a MongoDB');

  for (const s of students) {
    const exists = await User.findOne({ email: s.email });
    if (!exists) {
      const hashedPassword = await bcrypt.hash(s.password, 10);
      await User.create({
        username: s.email.split('@')[0],
        email: s.email,
        password: hashedPassword,
        full_name: s.full_name,
        role: 'student'
      });
      console.log(`Creado: ${s.full_name} (${s.email} / ${s.password})`);
    } else {
      console.log(`Ya existe: ${s.email}`);
    }
  }

  console.log('Seed completado');
  process.exit(0);
}

seedStudents().catch(err => {
  console.error('Error en seed:', err);
  process.exit(1);
});
