import mongoose from 'mongoose';
import User from './src/models/User.js';
import Grade from './src/models/Grade.js';
import DfdSubmission from './src/models/DfdSubmission.js';
import ExamDraft from './src/models/ExamDraft.js';

const MONGODB_URI = 'mongodb+srv://Cris87:MorgothTheLord88@cluster0.r79rn7k.mongodb.net/cinar?appName=Cluster0';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Find users with lis / liz
  const users = await User.find({
    $or: [
      { full_name: /lis/i },
      { full_name: /liz/i },
      { email: /lis/i },
      { email: /liz/i },
      { username: /lis/i },
      { username: /liz/i }
    ]
  });
  console.log('Users matching lis/liz:', users.map(u => ({ id: u._id, name: u.full_name, email: u.email, username: u.username, role: u.role })));

  // Check recent grades in Algoritmos - Parcial 1 or across all subjects today (27/10)
  console.log('\n--- Latest 10 Grades in DB ---');
  const latestGrades = await Grade.find({}).sort({ createdAt: -1, created_at: -1 }).limit(10).populate('student', 'full_name email username');
  latestGrades.forEach(g => console.log({
    id: g._id,
    student: g.student?.full_name,
    email: g.student?.email,
    subject: g.subject,
    score: `${g.score}/${g.max_score}`,
    date: g.createdAt || g.created_at,
    comments: g.comments
  }));

  // Check recent DfdSubmissions
  console.log('\n--- Latest 10 DfdSubmissions ---');
  const latestSubs = await DfdSubmission.find({}).sort({ createdAt: -1 }).limit(10).populate('student', 'full_name email');
  latestSubs.forEach(s => console.log({
    id: s._id,
    student: s.student?.full_name,
    email: s.student?.email,
    examType: s.examType,
    file: s.originalFileName,
    qId: s.questionId,
    date: s.createdAt
  }));

  // Check recent ExamDrafts
  console.log('\n--- Latest 5 ExamDrafts ---');
  const latestDrafts = await ExamDraft.find({}).sort({ updatedAt: -1 }).limit(5).populate('student', 'full_name email');
  latestDrafts.forEach(d => console.log({
    id: d._id,
    student: d.student?.full_name,
    subject: d.subject,
    updatedAt: d.updatedAt
  }));

  await mongoose.disconnect();
}
main().catch(console.error);
