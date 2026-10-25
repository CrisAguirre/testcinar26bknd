import mongoose from 'mongoose';
import User from './src/models/User.js';
import Grade from './src/models/Grade.js';
import DfdSubmission from './src/models/DfdSubmission.js';

if (typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(); } catch { /* ignore */ }
}
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI no está definido en las variables de entorno ni en .env');
  process.exit(1);
}

async function inspectAlgoP1() {
  await mongoose.connect(MONGODB_URI);
  console.log('--- Conectado a MongoDB Atlas ---');

  // Buscar todas las notas de Algoritmos - Parcial 1
  const grades = await Grade.find({ subject: /Algoritmos.*Parcial.*1/i })
    .populate('student', 'username full_name email role')
    .sort({ createdAt: 1, created_at: 1 });

  console.log(`Total notas de Algoritmos - Parcial 1: ${grades.length}`);

  for (const g of grades) {
    const ts = g.created_at || g.createdAt || g._id.getTimestamp();
    console.log({
      id: g._id.toString(),
      student: g.student ? `${g.student.full_name} (${g.student.email}, role: ${g.student.role})` : g.student,
      subject: g.subject,
      score: g.score,
      max_score: g.max_score,
      period: g.period,
      comments: g.comments,
      date: ts,
      dateISO: new Date(ts).toISOString()
    });
  }

  // Buscar todas las entregas DFD para parcial-1
  const submissions = await DfdSubmission.find({
    $or: [
      { examType: /parcial-1/i },
      { examType: /parcial/i },
      { course: 'algoritmos' }
    ]
  }).populate('student', 'username full_name email role').sort({ createdAt: 1 });

  console.log(`\nTotal entregas DFD encontradas: ${submissions.length}`);
  for (const s of submissions) {
    console.log({
      id: s._id.toString(),
      student: s.student ? `${s.student.full_name} (${s.student.email})` : s.student,
      course: s.course,
      examType: s.examType,
      period: s.period,
      fileName: s.originalFileName,
      fileSize: s.fileSize,
      attemptNumber: s.attemptNumber,
      questionId: s.questionId,
      gradeId: s.gradeId,
      date: s.createdAt || s._id.getTimestamp()
    });
  }

  await mongoose.disconnect();
}

inspectAlgoP1().catch(console.error);
