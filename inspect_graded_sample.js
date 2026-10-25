import mongoose from 'mongoose';
import Grade from './src/models/Grade.js';

if (typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(); } catch { /* ignore */ }
}
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI no está definido en las variables de entorno ni en .env');
  process.exit(1);
}

async function checkGraded() {
  await mongoose.connect(MONGODB_URI);
  const g = await Grade.findById('6ad80d687cb980f61a222ee1');
  console.log('Oscar Rodriguez grade:', {
    score: g.score,
    max_score: g.max_score,
    comments: g.comments,
    examData: g.examData ? JSON.parse(g.examData) : null
  });

  const g2 = await Grade.findById('6ad810de7cb980f61a222eed');
  console.log('\nJuan Carlos Bastidas grade:', {
    score: g2.score,
    max_score: g2.max_score,
    comments: g2.comments,
    examData: g2.examData ? JSON.parse(g2.examData) : null
  });

  await mongoose.disconnect();
}
checkGraded();
