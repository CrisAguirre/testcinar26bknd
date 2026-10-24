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

async function check() {
  await mongoose.connect(MONGODB_URI);
  const adminId = new mongoose.Types.ObjectId('6a53fb27ce7ca89c44a0b3d7');
  const grades = await Grade.find({ student: adminId, subject: /Desarrollo Web 2/i });
  console.log('Total grades:', grades.length);
  for (const g of grades) {
    console.log({
      id: g._id.toString(),
      timestampFromId: g._id.getTimestamp(),
      created_at: g.created_at,
      createdAt: g.createdAt,
      subject: g.subject,
      score: g.score,
      max_score: g.max_score,
      comments: g.comments
    });
  }
  await mongoose.disconnect();
}
check();
