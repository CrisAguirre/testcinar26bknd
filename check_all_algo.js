import mongoose from 'mongoose';
import User from './src/models/User.js';
import Grade from './src/models/Grade.js';
import Enrollment from './src/models/Enrollment.js';

if (typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(); } catch { /* ignore */ }
}
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI no está definido en las variables de entorno ni en .env');
  process.exit(1);
}

async function checkAll() {
  await mongoose.connect(MONGODB_URI);
  
  const allAlgoGrades = await Grade.find({ subject: /Algoritmos/i }).populate('student').sort({ createdAt: -1 });
  console.log(`Total grades Algoritmos (cualquier examen): ${allAlgoGrades.length}`);
  for (const g of allAlgoGrades) {
    const ts = g.created_at || g.createdAt || g._id.getTimestamp();
    console.log(`${new Date(ts).toISOString()} | ${g.student?.full_name} (${g.student?.email}) | ${g.subject} | Score: ${g.score}/${g.max_score} | ID: ${g._id}`);
  }

  await mongoose.disconnect();
}
checkAll();
