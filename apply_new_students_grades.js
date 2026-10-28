import mongoose from 'mongoose';
import Grade from './src/models/Grade.js';
import User from './src/models/User.js';

if (typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(); } catch { /* ignore */ }
}
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Cris87:MorgothTheLord88@cluster0.r79rn7k.mongodb.net/cinar?appName=Cluster0';

const updates = [
  {
    gradeId: '6adfceb6155f0fa14ea52f93',
    studentName: 'Julián David Reina Cabrera',
    email: 'jd.reina@cinar.edu.co',
    attempt: 1,
    mcScore: 12,
    dfdScore: 0,
    finalScore: 12,
    dfdReview: {
      '104': { points: 0, notes: 'Sintaxis rota (string sin cerrar, variable no definida leer:horas, sin cálculo de salario)' },
      '112': { points: 0, notes: 'Condición sintácticamente inválida "1compra es> 10000" y asignación inválida "10 fin-si"' },
      '101': { points: 0, notes: 'Valores hardcodeados para 3 y 5 en lugar de operar sobre variables dinámicas' },
      '118': { points: 0, notes: 'Algoritmo incompleto, condición de lectura inválida y variable x indefinida' },
      '116': { points: 0, notes: 'No subió archivo para este ejercicio' }
    }
  },
  {
    gradeId: '6adfa26fa9ba31c77b8b5f89',
    studentName: 'David Santiago Erazo Moncayo',
    email: 'algo11@cinar.edu.co',
    attempt: 1,
    mcScore: 15,
    dfdScore: 2,
    finalScore: 17,
    dfdReview: {
      '103': { points: 1, notes: 'Fórmula C*1.8+32 correcta y salida de F correcta (casos 0->32 y 100->212 pasan)' },
      '107': { points: 1, notes: 'Precio unitario * cantidad correcto y salida de total correcta' },
      '112': { points: 0, notes: 'Calcula total pero imprime variable indefinida "x" en vez de total; sin salida en rama falsa' },
      '120': { points: 0, notes: 'Usa condición simple Si en vez de ciclo Para/Mientras; imprime variable indefinida "x"' },
      '118': { points: 0, notes: 'Subió ejercicio de promedio de 3 notas y aprobación en lugar de suma hasta 0' }
    }
  }
];

async function applyGrades() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado a MongoDB Atlas\n');

  for (const item of updates) {
    const grade = await Grade.findById(item.gradeId).populate('student', 'full_name email');
    if (!grade) {
      console.warn(`No se encontró el registro ${item.gradeId}`);
      continue;
    }

    let examData = {};
    try { examData = JSON.parse(grade.examData); } catch {}

    const reviewTag = `DFD: ${item.dfdScore}/5 | Definitiva: ${item.finalScore}/20`;
    const baseComments = String(grade.comments || '').replace(/\s*\|\s*DFD:.*$/s, '').trim();
    const updatedComments = `${baseComments}${baseComments ? ' | ' : ''}${reviewTag}`;

    const updatedExamData = {
      ...examData,
      dfdReview: item.dfdReview,
      dfdScore: item.dfdScore,
      definitiveScore: item.finalScore,
      definitiveMax: 20,
      reviewedAt: new Date().toISOString(),
      reviewedBy: 'Docente Evaluador Cinar'
    };

    grade.score = item.finalScore;
    grade.max_score = 20;
    grade.comments = updatedComments;
    grade.examData = JSON.stringify(updatedExamData);
    grade.updated_at = new Date();

    await grade.save();

    console.log(`✅ Calificado: ${grade.student?.full_name} (${item.studentName}) - Intento ${item.attempt}`);
    console.log(`   Grade ID: ${grade._id}`);
    console.log(`   Nota: ${grade.score}/20 (Teóricas: ${item.mcScore} + DFD: ${item.dfdScore}) -> ${(grade.score / 20 * 5).toFixed(1)}/5.0`);
    console.log(`   Comentarios: ${grade.comments}`);
    console.log('-------------------------------------------------------------');
  }

  // Verificación final de todas las notas de Algoritmos - Parcial 1
  console.log('\n=== LISTADO COMPLETO Y VIGENTE DE NOTAS — ALGORITMOS PARCIAL 1 ===');
  const allAlgoP1 = await Grade.find({ subject: /Algoritmos.*Parcial.*1/i })
    .populate('student', 'full_name email')
    .sort({ createdAt: 1, created_at: 1 });

  allAlgoP1.forEach((g, idx) => {
    const ts = g.created_at || g.createdAt || g._id.getTimestamp();
    console.log(`[${idx + 1}] ${g.student?.full_name} (${g.student?.email}) | Nota: ${g.score}/${g.max_score} | Fecha: ${new Date(ts).toLocaleString('es-CO')} | ${g.comments}`);
  });

  await mongoose.disconnect();
}

applyGrades().catch(console.error);
