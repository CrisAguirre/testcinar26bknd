import mongoose from 'mongoose';
import Grade from './src/models/Grade.js';
import User from './src/models/User.js';
import DfdSubmission from './src/models/DfdSubmission.js';
import fs from 'fs';

const MONGODB_URI = 'mongodb+srv://Cris87:MorgothTheLord88@cluster0.r79rn7k.mongodb.net/cinar?appName=Cluster0';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado a MongoDB Atlas');

  const grades = await Grade.find({ subject: /Algoritmos.*Parcial.*1/i })
    .populate('student', 'full_name email username')
    .sort({ createdAt: 1, created_at: 1 });

  console.log(`Total registros en BD: ${grades.length}`);

  const processedData = [];

  for (const g of grades) {
    let examData = null;
    try {
      examData = typeof g.examData === 'string' ? JSON.parse(g.examData) : g.examData;
    } catch (e) {
      console.log(`Error parsing examData for ${g._id}`);
    }

    const item = {
      gradeId: g._id.toString(),
      studentId: g.student?._id?.toString(),
      studentName: g.student?.full_name || 'Desconocido',
      studentEmail: g.student?.email || '',
      studentUsername: g.student?.username || '',
      score: g.score,
      max_score: g.max_score,
      percentage: ((g.score / g.max_score) * 100).toFixed(1),
      scale5: ((g.score / g.max_score) * 5).toFixed(1),
      period: g.period,
      comments: g.comments,
      createdAt: g.created_at || g.createdAt || g._id.getTimestamp(),
      examData: examData ? {
        attemptNumber: examData.attemptNumber,
        timeUsed: examData.timeUsed,
        tabSwitches: examData.tabSwitches,
        mcScore: examData.mcScore,
        mcTotal: examData.mcTotal,
        dfdScore: examData.dfdScore,
        dfdReview: examData.dfdReview,
        uploadedFileNames: examData.uploadedFileNames,
        questions: (examData.questions || []).map(q => ({
          id: q.id,
          tema: q.tema,
          type: q.type,
          question: q.question,
          options: q.options,
          studentAnswer: q.studentAnswer,
          correctAnswer: q.correctAnswer,
          isCorrect: q.isCorrect,
          explanation: q.explanation
        }))
      } : null
    };

    processedData.push(item);
  }

  fs.writeFileSync('parcial1_full_data.json', JSON.stringify(processedData, null, 2), 'utf8');
  console.log('Datos guardados en parcial1_full_data.json');

  await mongoose.disconnect();
}

main().catch(console.error);
