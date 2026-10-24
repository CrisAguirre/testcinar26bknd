import { config } from 'dotenv';
config();
import mongoose from 'mongoose';
import User from './src/models/User.js';
import Grade from './src/models/Grade.js';

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB:', process.env.MONGODB_URI);

    const admins = await User.find({ role: 'admin' }).select('_id email full_name role');
    console.log('Admins found:', admins);

    const david = await User.find({
      $or: [
        { email: /garcia/i },
        { full_name: /garcia/i }
      ]
    }).select('_id email full_name role');
    console.log('David found:', david);

    const adminIds = admins.map(a => a._id);
    const adminGrades = await Grade.find({ student: { $in: adminIds } }).sort({ createdAt: -1 });
    console.log('Admin grades count:', adminGrades.length);
    for (const g of adminGrades) {
      console.log('Admin Grade:', {
        id: g._id,
        subject: g.subject,
        score: g.score,
        max_score: g.max_score,
        student: g.student,
        createdAt: g.createdAt,
        comments: g.comments,
        hasExamData: !!g.examData
      });
    }

    // Also check all DW2 grades
    const dw2Grades = await Grade.find({ subject: /Desarrollo Web 2/i }).sort({ createdAt: -1 }).populate('student', 'email full_name role');
    console.log('\n--- All DW2 grades (total ' + dw2Grades.length + ') ---');
    for (const g of dw2Grades) {
      console.log({
        id: g._id,
        subject: g.subject,
        score: g.score,
        max_score: g.max_score,
        student: g.student ? `${g.student.full_name} (${g.student.email}, role: ${g.student.role})` : g.student,
        createdAt: g.createdAt
      });
    }

    // Check David Garcia's existing grades
    if (david.length > 0) {
      const davidGrades = await Grade.find({ student: david[0]._id });
      console.log('\n--- David Garcia existing grades ---', davidGrades.length);
      for (const dg of davidGrades) {
        console.log({
          id: dg._id,
          subject: dg.subject,
          score: dg.score,
          max_score: dg.max_score,
          createdAt: dg.createdAt
        });
      }
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error during query:', err);
    process.exit(1);
  }
}

run();
