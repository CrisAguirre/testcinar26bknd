import mongoose from 'mongoose';
import User from './src/models/User.js';
import Grade from './src/models/Grade.js';
import DfdSubmission from './src/models/DfdSubmission.js';
import { parseDfd } from '../testcinar26/src/lib/dfd/parser.js';
import { generatePseudocode } from '../testcinar26/src/lib/dfd/pseudocode.js';
import { DfdExecutor } from '../testcinar26/src/lib/dfd/executor.js';

if (typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(); } catch { /* ignore */ }
}
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI no está definido en las variables de entorno ni en .env');
  process.exit(1);
}

async function inspectFirstTwo() {
  await mongoose.connect(MONGODB_URI);
  const grades = await Grade.find({
    _id: { $in: ['6adb84f3a6854baaf8841ba5', '6adb8ab3a6854baaf8841bab', '6adb8d9da6854baaf8841bb1'] }
  }).populate('student');

  for (const grade of grades) {
    console.log(`\n======================================================`);
    console.log(`Estudiante: ${grade.student?.full_name} (${grade.student?.email})`);
    console.log(`Grade ID: ${grade._id} | Comments: ${grade.comments}`);
    const examData = JSON.parse(grade.examData);
    console.log(`MC: ${examData.mcScore}/${examData.mcTotal}`);
    console.log('uploadedFileNames:', examData.uploadedFileNames);

    const subs = await DfdSubmission.find({ student: grade.student._id, examType: 'parcial-1' });
    const fileQuestions = examData.questions.filter(q => q.type === 'file');
    
    for (const q of fileQuestions) {
      console.log(`\n--- Pregunta ${q.id}: ${q.question.slice(0, 70)}... ---`);
      let sub = subs.filter(s => s.questionId === q.id && (s.attemptNumber === examData.attemptNumber || !s.attemptNumber)).pop();
      if (!sub && examData.uploadedFileNames?.[q.id]) {
        sub = subs.filter(s => s.originalFileName === examData.uploadedFileNames[q.id] && (s.attemptNumber === examData.attemptNumber || !s.attemptNumber)).pop();
      }
      if (!sub) sub = subs.filter(s => s.questionId === q.id).pop();

      if (!sub) {
        console.log('  ❌ No submission found');
        continue;
      }
      console.log(`  Archivo: ${sub.originalFileName} (size: ${sub.fileSize})`);
      const dfdText = sub.fileData.toString('utf8');
      console.log('  Contenido DFD (primeros 300 car):\n', dfdText.slice(0, 300));
      const ast = parseDfd(dfdText);
      console.log('  AST nodos:', ast?.nodes?.length);
      try {
        console.log('  Pseudocódigo:\n' + generatePseudocode(ast, 'test'));
      } catch (e) {
        console.log('  Error pseudocódigo:', e.message);
      }
    }
  }

  await mongoose.disconnect();
}

inspectFirstTwo();
