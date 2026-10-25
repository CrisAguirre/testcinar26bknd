import mongoose from 'mongoose';
import User from './src/models/User.js';
import Grade from './src/models/Grade.js';

if (typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(); } catch { /* ignore */ }
}
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI no está definido en las variables de entorno ni en .env');
  process.exit(1);
}

async function listGrades() {
  await mongoose.connect(MONGODB_URI);
  const grades = await Grade.find({ subject: /Algoritmos.*Parcial.*1/i })
    .populate('student', 'username full_name email role')
    .sort({ createdAt: 1, created_at: 1 });

  console.log(`=== GRADES DE ALGORITMOS - PARCIAL 1 (${grades.length}) ===`);
  for (const g of grades) {
    const ts = g.created_at || g.createdAt || g._id.getTimestamp();
    console.log({
      id: g._id.toString(),
      student: g.student?.full_name,
      email: g.student?.email,
      score: `${g.score}/${g.max_score}`,
      period: g.period,
      comments: g.comments,
      date: new Date(ts).toISOString(),
      dateColombia: new Date(ts).toLocaleString('es-CO', { timeZone: 'America/Bogota' })
    });
  }

  await mongoose.disconnect();
}
listGrades();
