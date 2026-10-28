import mongoose from 'mongoose';
import User from './src/models/User.js';
import Grade from './src/models/Grade.js';
import DfdSubmission from './src/models/DfdSubmission.js';

const MONGODB_URI = 'mongodb+srv://Cris87:MorgothTheLord88@cluster0.r79rn7k.mongodb.net/cinar?appName=Cluster0';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected');

  const allUsers = await User.find({}).select('_id full_name email username role');
  console.log(`Total users in DB: ${allUsers.length}`);

  const matches = allUsers.filter(u => {
    const s = `${u.full_name} ${u.email} ${u.username}`.toLowerCase();
    return s.includes('eraso') || s.includes('montilla') || s.includes('david');
  });

  console.log('Matches:', matches);

  // Check recent grades in Algoritmos - Parcial 1 across ALL users
  console.log('\n--- Recent Grades in Algoritmos - Parcial 1 (last 10) ---');
  const grades = await Grade.find({ subject: /Algoritmos.*Parcial.*1/i })
    .populate('student', 'full_name email username')
    .sort({ createdAt: -1 })
    .limit(10);

  grades.forEach(g => {
    console.log({
      id: g._id,
      student: g.student?.full_name,
      email: g.student?.email,
      score: `${g.score}/${g.max_score}`,
      date: g.createdAt || g.created_at,
      comments: g.comments
    });
  });

  // Check all recent DfdSubmissions
  console.log('\n--- Recent DfdSubmissions (last 10) ---');
  const subs = await DfdSubmission.find({})
    .populate('student', 'full_name email')
    .sort({ createdAt: -1 })
    .limit(10);

  subs.forEach(s => {
    console.log({
      id: s._id,
      student: s.student?.full_name,
      file: s.originalFileName,
      qId: s.questionId,
      date: s.createdAt
    });
  });

  await mongoose.disconnect();
}

main().catch(console.error);
