import mongoose from 'mongoose';
import Grade from './src/models/Grade.js';
import User from './src/models/User.js';

const MONGODB_URI = 'mongodb+srv://Cris87:MorgothTheLord88@cluster0.r79rn7k.mongodb.net/cinar?appName=Cluster0';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado a MongoDB Atlas\n');

  const gradeId = '6ae14d983cb36e299c5cf5ad';
  const grade = await Grade.findById(gradeId).populate('student', 'full_name email');

  if (!grade) {
    console.error('No se encontró el registro de calificación');
    process.exit(1);
  }

  let examData = {};
  try { examData = JSON.parse(grade.examData); } catch {}

  const mcScore = 15;
  const dfdScore = 4;
  const finalScore = 19; // 19/20 = 4.8/5.0

  const reviewTag = `DFD: ${dfdScore}/5 | Definitiva: ${finalScore}/20`;
  const baseComments = String(grade.comments || '').replace(/\s*\|\s*DFD:.*$/s, '').trim();
  const updatedComments = `${baseComments}${baseComments ? ' | ' : ''}${reviewTag}`;

  const dfdReview = {
    '120': { points: 1, notes: 'Factorial correcto usando ciclo Mientras y acumulador multiplicativo f = f * i' },
    '109': { points: 1, notes: 'Mayor de dos números correcto con condicionales anidados (evalúa A > B, B > A y caso de igualdad)' },
    '107': { points: 1, notes: 'Precio unitario y total pagar correcto (total = precio * cantidad)' },
    '114': { points: 1, notes: 'Condición compuesta A > 0 Y B > 0 correcta con mensajes exactos requeridos' },
    '112': { points: 0, notes: 'Lógica condicional y cálculo de total correctos en ambas ramas, pero en el nodo de salida escribió "total a pagar" como literal sin concatenar la variable total' }
  };

  const updatedExamData = {
    ...examData,
    dfdReview,
    dfdScore,
    definitiveScore: finalScore,
    definitiveMax: 20,
    reviewedAt: new Date().toISOString(),
    reviewedBy: 'Docente Evaluador Cinar'
  };

  grade.score = finalScore;
  grade.max_score = 20;
  grade.comments = updatedComments;
  grade.examData = JSON.stringify(updatedExamData);
  grade.updated_at = new Date();

  await grade.save();

  console.log(`✅ Calificación guardada exitosamente:`);
  console.log(`   Estudiante: ${grade.student?.full_name} (${grade.student?.email})`);
  console.log(`   Grade ID: ${grade._id}`);
  console.log(`   Nota: ${grade.score}/20 (Teoría: ${mcScore}/15 + DFD: ${dfdScore}/5) -> ${(grade.score / 20 * 5).toFixed(1)}/5.0`);
  console.log(`   Comentarios: ${grade.comments}`);

  // Mostrar listado actualizado de todos los estudiantes
  console.log('\n=== LISTADO COMPLETO ACTUALIZADO — ALGORITMOS PARCIAL 1 ===');
  const allGrades = await Grade.find({ subject: /Algoritmos.*Parcial.*1/i })
    .populate('student', 'full_name email')
    .sort({ createdAt: 1, created_at: 1 });

  allGrades.forEach((g, idx) => {
    const ts = g.created_at || g.createdAt || g._id.getTimestamp();
    console.log(`[${idx + 1}] ${g.student?.full_name} | Nota: ${g.score}/${g.max_score} (${((g.score/g.max_score)*5).toFixed(1)}) | Fecha: ${new Date(ts).toLocaleString('es-CO')} | ${g.comments}`);
  });

  await mongoose.disconnect();
}

main().catch(console.error);
