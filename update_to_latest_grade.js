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

async function updateToTrueLast() {
  await mongoose.connect(MONGODB_URI);
  
  const trueLastAdminGrade = await Grade.findById('6ad958357441158ef0918abb');
  if (!trueLastAdminGrade) {
    console.error('No se encontró la calificación 6ad958357441158ef0918abb');
    process.exit(1);
  }

  console.log('Verdaderamente última calificación del admin:', {
    id: trueLastAdminGrade._id,
    created_at: trueLastAdminGrade.created_at,
    subject: trueLastAdminGrade.subject,
    score: trueLastAdminGrade.score,
    max_score: trueLastAdminGrade.max_score,
    period: trueLastAdminGrade.period,
    comments: trueLastAdminGrade.comments,
    hasExamData: !!trueLastAdminGrade.examData
  });

  // Calificación creada hace un momento para David Garcia: 6adcf9a224fe43ab63d4105a
  const davidGrade = await Grade.findById('6adcf9a224fe43ab63d4105a');
  if (!davidGrade) {
    console.error('No se encontró la calificación de David Garcia');
    process.exit(1);
  }

  davidGrade.score = trueLastAdminGrade.score;
  davidGrade.max_score = trueLastAdminGrade.max_score;
  davidGrade.period = trueLastAdminGrade.period;
  davidGrade.comments = trueLastAdminGrade.comments;
  davidGrade.examData = trueLastAdminGrade.examData;
  davidGrade.created_at = trueLastAdminGrade.created_at;
  davidGrade.updated_at = new Date();

  await davidGrade.save();
  console.log('\nCalificación de David Garcia actualizada exitosamente a la última del admin (51/60):');
  console.log({
    id: davidGrade._id,
    student: davidGrade.student,
    subject: davidGrade.subject,
    score: davidGrade.score,
    max_score: davidGrade.max_score,
    percentage: ((davidGrade.score / davidGrade.max_score) * 100).toFixed(2) + '%',
    period: davidGrade.period,
    comments: davidGrade.comments,
    created_at: davidGrade.created_at
  });

  await mongoose.disconnect();
}

updateToTrueLast();
