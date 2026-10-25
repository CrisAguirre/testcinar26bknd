import mongoose from 'mongoose';
import Grade from './src/models/Grade.js';
import DfdSubmission from './src/models/DfdSubmission.js';
import User from './src/models/User.js';

if (typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(); } catch { /* ignore */ }
}
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI no está definido en las variables de entorno ni en .env');
  process.exit(1);
}

const updates = [
  {
    gradeId: '6adb84f3a6854baaf8841ba5',
    student: 'David Felipe Narváez',
    attempt: 2,
    dfdScore: 0,
    mcScore: 15,
    finalScore: 15,
    dfdReview: {
      '118': { points: 0, notes: 'No calcula suma ni ciclo centinela con 0' },
      '113': { points: 0, notes: 'No evalúa condición par/impar' },
      '105': { points: 0, notes: 'Resultado hardcodeado sin lectura ni cálculo de promedio' },
      '114': { points: 0, notes: 'No evalúa condición de números positivos' },
      '102': { points: 0, notes: 'No calcula área ni perímetro del círculo' }
    }
  },
  {
    gradeId: '6adb8ab3a6854baaf8841bab',
    student: 'Andrés Felipe Mena Oviedo',
    attempt: 1,
    dfdScore: 0,
    mcScore: 15,
    finalScore: 15,
    dfdReview: {
      '119': { points: 0, notes: 'Subió archivo de operaciones básicas en lugar de serie Fibonacci' },
      '111': { points: 0, notes: 'Multiplicación sin salida ni lógica de aprobación' },
      '115': { points: 0, notes: 'Cálculo de precio sin salida en lugar de serie del 1 al 10' },
      '107': { points: 0, notes: 'Cálculo de salario sin salida' },
      '110': { points: 0, notes: 'Subió par/impar en lugar de mayor de edad' }
    }
  },
  {
    gradeId: '6adb8d9da6854baaf8841bb1',
    student: 'Andrés Felipe Mena Oviedo',
    attempt: 2,
    dfdScore: 0,
    mcScore: 15,
    finalScore: 15,
    dfdReview: {
      '112': { points: 0, notes: 'Operaciones básicas en lugar de descuento condicional' },
      '105': { points: 0, notes: 'Multiplicación sin salida en lugar de promedio' },
      '113': { points: 0, notes: 'Precio unitario en lugar de par/impar' },
      '108': { points: 0, notes: 'Cálculo de salario en lugar de positivo/negativo/cero' },
      '119': { points: 0, notes: 'Par/impar en lugar de serie Fibonacci' }
    }
  },
  {
    gradeId: '6add0cdb0c74bc66727b993e',
    student: 'Johan Sebastian Rodríguez Rosero',
    attempt: 1,
    dfdScore: 4,
    mcScore: 15,
    finalScore: 19,
    dfdReview: {
      '120': { points: 1, notes: 'Factorial correcto (nodos y casos pasados)' },
      '108': { points: 1, notes: 'Positivo/Negativo/Cero correcto' },
      '106': { points: 1, notes: 'Descuento 15% correcto' },
      '114': { points: 0, notes: 'No cumple mensaje exacto de ambos positivos / al menos uno no' },
      '102': { points: 1, notes: 'Área y perímetro de círculo correcto' }
    }
  },
  {
    gradeId: '6add28160c74bc66727b9944',
    student: 'Johan Sebastian Rodríguez Rosero',
    attempt: 2,
    dfdScore: 4,
    mcScore: 15,
    finalScore: 19,
    dfdReview: {
      '102': { points: 1, notes: 'Área y perímetro de círculo correcto' },
      '107': { points: 1, notes: 'Precio unitario y total pagar correcto' },
      '105': { points: 1, notes: 'Promedio de 3 notas correcto' },
      '109': { points: 0, notes: 'Usa mod 2 en lugar de comparar n1 > n2 para mayor' },
      '120': { points: 1, notes: 'Factorial correcto (nodos y casos pasados)' }
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

    console.log(`✅ Calificado: ${grade.student?.full_name} (${item.student}) - Intento ${item.attempt}`);
    console.log(`   Grade ID: ${grade._id}`);
    console.log(`   Nota: ${grade.score}/20 (Teóricas: ${item.mcScore} + DFD: ${item.dfdScore})`);
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
    console.log(`[${idx + 1}] ${g.student?.full_name} | Nota: ${g.score}/${g.max_score} | Fecha: ${new Date(ts).toLocaleString('es-CO')} | ${g.comments}`);
  });

  await mongoose.disconnect();
}

applyGrades().catch(console.error);
