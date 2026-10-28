import mongoose from 'mongoose';
import User from './src/models/User.js';
import Grade from './src/models/Grade.js';
import DfdSubmission from './src/models/DfdSubmission.js';
import { parseDfd } from '../testcinar26/src/lib/dfd/parser.js';
import { generatePseudocode } from '../testcinar26/src/lib/dfd/pseudocode.js';
import { DfdExecutor } from '../testcinar26/src/lib/dfd/executor.js';

const MONGODB_URI = 'mongodb+srv://Cris87:MorgothTheLord88@cluster0.r79rn7k.mongodb.net/cinar?appName=Cluster0';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado a MongoDB Atlas\n');

  const targetStudents = [
    { name: 'Julián David Reina Cabrera', gradeId: '6adfceb6155f0fa14ea52f93' },
    { name: 'David Santiago Erazo Moncayo', gradeId: '6adfa26fa9ba31c77b8b5f89' }
  ];

  for (const target of targetStudents) {
    console.log(`========================================================================`);
    console.log(`ESTUDIANTE: ${target.name} (Grade ID: ${target.gradeId})`);
    console.log(`========================================================================`);

    const grade = await Grade.findById(target.gradeId).populate('student');
    const examData = JSON.parse(grade.examData);

    console.log(`Intento: ${examData.attemptNumber} | MC: ${examData.mcScore}/${examData.mcTotal} | Score actual: ${grade.score}/${grade.max_score}`);
    console.log(`Archivos reportados en examData:`, examData.uploadedFileNames);

    const fileQuestions = examData.questions.filter(q => q.type === 'file');

    for (const q of fileQuestions) {
      console.log(`\n------------------------------------------------------------------------`);
      console.log(`PREGUNTA ${q.id} (Tema ${q.tema}): ${q.question.replace(/\n+/g, ' ')}`);
      
      const sub = await DfdSubmission.findOne({
        student: grade.student._id,
        examType: 'parcial-1',
        questionId: q.id
      }).sort({ createdAt: -1 });

      if (!sub) {
        console.log(`  [x] NO SE ENCONTRÓ SUBMISSION para la pregunta ${q.id}`);
        continue;
      }

      console.log(`  Archivo: ${sub.originalFileName} (${sub.fileSize} bytes)`);
      const rawText = sub.fileData.toString('utf8');
      console.log(`  Raw Text (primeros 300 chars):\n${rawText.slice(0, 300)}`);

      const ast = parseDfd(rawText);
      console.log(`  AST parse: ${ast?.error ? 'ERROR: ' + ast.error : 'OK (' + ast.nodes?.length + ' nodos)'}`);

      let pseudocode = '';
      try {
        pseudocode = generatePseudocode(ast, sub.originalFileName);
        console.log(`  Pseudocódigo:\n${pseudocode.split('\n').map(l => '    ' + l).join('\n')}`);
      } catch (e) {
        console.log(`  Error generando pseudocódigo: ${e.message}`);
      }

      // Probar ejecuciones interactivas o casos
      if (ast && !ast.error) {
        console.log(`  Nodos AST detalles:`, JSON.stringify(ast.nodes, null, 2));
      }
    }
  }

  await mongoose.disconnect();
}

main().catch(console.error);
