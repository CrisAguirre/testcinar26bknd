import mongoose from 'mongoose';
import User from './src/models/User.js';
import Grade from './src/models/Grade.js';
import DfdSubmission from './src/models/DfdSubmission.js';
import { parseDfd } from '../testcinar26/src/lib/dfd/parser.js';
import { generatePseudocode } from '../testcinar26/src/lib/dfd/pseudocode.js';

if (typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(); } catch { /* ignore */ }
}
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI no está definido en las variables de entorno ni en .env');
  process.exit(1);
}

async function checkNarvaez() {
  await mongoose.connect(MONGODB_URI);
  const grade = await Grade.findById('6adb84f3a6854baaf8841ba5').populate('student');
  const examData = JSON.parse(grade.examData);
  console.log('David Narvaez Intento 2:');
  console.log('MC:', examData.mcScore);
  const fileQuestions = examData.questions.filter(q => q.type === 'file');
  const subs = await DfdSubmission.find({ student: grade.student._id, examType: 'parcial-1' });
  
  for (const q of fileQuestions) {
    console.log(`\nQuestion ${q.id}: ${q.question}`);
    const sub = subs.filter(s => s.questionId === q.id && s.attemptNumber === 2).pop() ||
                subs.filter(s => s.originalFileName === examData.uploadedFileNames?.[q.id] && s.attemptNumber === 2).pop();
    if (sub) {
      console.log('File:', sub.originalFileName, 'size:', sub.fileSize);
      const text = sub.fileData.toString('utf8');
      const ast = parseDfd(text);
      console.log('Nodes:', ast?.nodes?.length);
      try {
        console.log(generatePseudocode(ast, 'q' + q.id));
      } catch (e) {
        console.log('Error pseudocode:', e.message);
      }
    } else {
      console.log('No sub found for q', q.id);
    }
  }
  await mongoose.disconnect();
}
checkNarvaez();
