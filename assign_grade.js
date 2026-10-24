import mongoose from 'mongoose';
import User from './src/models/User.js';
import Grade from './src/models/Grade.js';
import ExamDraft from './src/models/ExamDraft.js';

if (typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(); } catch { /* ignore */ }
}
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI no está definido en las variables de entorno ni en .env');
  process.exit(1);
}

async function main() {
  try {
    console.log('Conectando a MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('Conexión exitosa a MongoDB Atlas.');

    // 1. Buscar Admin
    const adminUser = await User.findOne({
      $or: [{ username: 'admin' }, { email: 'admin@cinar.com' }, { role: 'admin' }]
    });
    if (!adminUser) {
      console.error('No se encontró el usuario administrador.');
      process.exit(1);
    }
    console.log('Admin encontrado:', {
      id: adminUser._id,
      username: adminUser.username,
      email: adminUser.email,
      role: adminUser.role
    });

    // 2. Buscar David Garcia
    const davidUser = await User.findOne({
      $or: [
        { email: 'd.garcia@cinar.edu.co' },
        { username: 'd.garcia' },
        { _id: new mongoose.Types.ObjectId('6a545e9bd0a53068e51ce293') }
      ]
    });
    if (!davidUser) {
      console.error('No se encontró al estudiante David Garcia.');
      process.exit(1);
    }
    console.log('David Garcia encontrado:', {
      id: davidUser._id,
      username: davidUser.username,
      email: davidUser.email,
      full_name: davidUser.full_name
    });

    // 3. Buscar todas las calificaciones del Admin para Desarrollo Web 2
    const adminDW2Grades = await Grade.find({
      student: adminUser._id,
      subject: /Desarrollo Web 2/i
    }).sort({ createdAt: -1 });

    console.log(`\nCalificaciones del Admin en Desarrollo Web 2 encontradas (${adminDW2Grades.length}):`);
    adminDW2Grades.forEach((g, index) => {
      console.log(`[${index + 1}] ID: ${g._id} | Subject: "${g.subject}" | Score: ${g.score}/${g.max_score} | Period: ${g.period} | CreatedAt: ${g.createdAt} | Comments: "${g.comments}"`);
    });

    if (adminDW2Grades.length === 0) {
      console.log('Buscando borradores (ExamDraft) del Admin para DW2...');
      const adminDrafts = await ExamDraft.find({
        student: adminUser._id,
        subject: /Desarrollo Web 2/i
      });
      console.log('Borradores encontrados:', adminDrafts.length);
      adminDrafts.forEach(d => console.log('Draft:', d.subject, d.updatedAt, d.answers));

      console.log('\nBuscando todas las calificaciones del Admin en cualquier materia:');
      const allAdminGrades = await Grade.find({ student: adminUser._id }).sort({ createdAt: -1 });
      allAdminGrades.forEach(g => console.log(`ID: ${g._id} | Subject: ${g.subject} | Score: ${g.score}`));
      
      console.log('\nBuscando calificaciones de DW2 de cualquier usuario:');
      const allDW2 = await Grade.find({ subject: /Desarrollo Web 2/i }).sort({ createdAt: -1 }).populate('student', 'email full_name');
      allDW2.slice(0, 10).forEach(g => console.log(`ID: ${g._id} | User: ${g.student?.full_name} (${g.student?.email}) | Subject: ${g.subject} | Score: ${g.score} | Date: ${g.createdAt}`));
      
      await mongoose.disconnect();
      return;
    }

    const lastAdminGrade = adminDW2Grades[0];
    console.log('\n--- Última calificación del Admin a transferir ---');
    console.log({
      id: lastAdminGrade._id,
      subject: lastAdminGrade.subject,
      score: lastAdminGrade.score,
      max_score: lastAdminGrade.max_score,
      period: lastAdminGrade.period,
      comments: lastAdminGrade.comments,
      createdAt: lastAdminGrade.createdAt,
      hasExamData: !!lastAdminGrade.examData
    });

    // 4. Comprobar si David ya tiene calificación en este examen
    const existingDavidGrade = await Grade.findOne({
      student: davidUser._id,
      subject: lastAdminGrade.subject
    });

    let assignedGrade;
    if (existingDavidGrade) {
      console.log(`\nDavid Garcia ya tenía un registro en "${lastAdminGrade.subject}" (ID: ${existingDavidGrade._id}). Actualizando...`);
      existingDavidGrade.score = lastAdminGrade.score;
      existingDavidGrade.max_score = lastAdminGrade.max_score;
      existingDavidGrade.period = lastAdminGrade.period;
      existingDavidGrade.comments = lastAdminGrade.comments;
      existingDavidGrade.examData = lastAdminGrade.examData;
      assignedGrade = await existingDavidGrade.save();
    } else {
      console.log(`\nCreando calificación para David Garcia en "${lastAdminGrade.subject}"...`);
      assignedGrade = await Grade.create({
        student: davidUser._id,
        subject: lastAdminGrade.subject,
        score: lastAdminGrade.score,
        max_score: lastAdminGrade.max_score,
        period: lastAdminGrade.period,
        comments: lastAdminGrade.comments,
        examData: lastAdminGrade.examData
      });
    }

    console.log('\n¡Calificación asignada con éxito a David Garcia!');
    console.log({
      gradeId: assignedGrade._id,
      student: davidUser.full_name,
      studentEmail: davidUser.email,
      subject: assignedGrade.subject,
      score: assignedGrade.score,
      max_score: assignedGrade.max_score,
      period: assignedGrade.period,
      comments: assignedGrade.comments,
      createdAt: assignedGrade.createdAt
    });

    // 5. Verificar todas las notas de David Garcia
    const finalDavidGrades = await Grade.find({ student: davidUser._id }).sort({ createdAt: -1 });
    console.log('\n--- Calificaciones consolidadas de David Garcia ---');
    finalDavidGrades.forEach(g => {
      console.log(`- ${g.subject}: ${g.score}/${g.max_score} (${g.period}) [ID: ${g._id}]`);
    });

    await mongoose.disconnect();
    console.log('\nOperación completada exitosamente.');
  } catch (err) {
    console.error('Error durante la ejecución:', err);
    process.exit(1);
  }
}

main();
