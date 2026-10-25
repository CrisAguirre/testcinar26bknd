import mongoose from 'mongoose';
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

async function checkMena() {
  await mongoose.connect(MONGODB_URI);
  const grades = await Grade.find({
    _id: { $in: ['6adb8ab3a6854baaf8841bab', '6adb8d9da6854baaf8841bb1'] }
  });

  for (const grade of grades) {
    const examData = JSON.parse(grade.examData);
    console.log(`\n=============================================================`);
    console.log(`Andres Mena - Attempt ${examData.attemptNumber} (Grade: ${grade._id})`);
    console.log(`Comments: ${grade.comments}`);
    console.log('uploadedFileNames:', examData.uploadedFileNames);

    const subs = await DfdSubmission.find({ student: grade.student, examType: 'parcial-1', attemptNumber: examData.attemptNumber });
    for (const sub of subs) {
      console.log(`\nSubmission: ${sub.originalFileName} (questionId: ${sub.questionId})`);
      const ast = parseDfd(sub.fileData.toString('utf8'));
      try {
        console.log(generatePseudocode(ast, sub.originalFileName));
      } catch (e) {
        console.log('Error pseudocode:', e.message);
      }
    }
  }

  await mongoose.disconnect();
}
checkMena();
