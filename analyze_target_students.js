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

// Casos de prueba por pregunta práctica (ids 101-120) de grade-algo-p1.mjs
const CASES = {
  101: [
    { inputs: [8, 2], numbers: [10, 6, 16, 4] },
    { inputs: [5, 2], numbers: [7, 3, 10, 2.5] }
  ],
  102: [
    { inputs: [3], numbers: [28.2744, 18.8496] }
  ],
  103: [
    { inputs: [0], numbers: [32] },
    { inputs: [100], numbers: [212] }
  ],
  104: [
    { inputs: [40, 5000], numbers: [200000], keywords: ['salario'] }
  ],
  105: [
    { inputs: [4, 3, 5], numbers: [4], keywords: ['promedio'] },
    { inputs: [3, 3, 3], numbers: [3], keywords: ['promedio'] }
  ],
  106: [
    { inputs: [100000], numbers: [85000] }
  ],
  107: [
    { inputs: [2500, 4], numbers: [10000] }
  ],
  108: [
    { inputs: [5], keywords: ['positivo'] },
    { inputs: [-3], keywords: ['negativo'] },
    { inputs: [0], keywords: ['cero'] }
  ],
  109: [
    { inputs: [7, 3], numbers: [7], keywords: ['mayor'] },
    { inputs: [3, 7], numbers: [7], keywords: ['mayor'] },
    { inputs: [4, 4], keywords: ['igual'] }
  ],
  110: [
    { inputs: [18], keywords: ['mayor de edad'], absent: ['menor de edad'] },
    { inputs: [17], keywords: ['menor de edad'], absent: ['mayor de edad'] }
  ],
  111: [
    { inputs: [4, 4, 4], keywords: ['aprueba'], absent: ['reprueba'] },
    { inputs: [2, 2, 2], keywords: ['reprueba'], absent: ['aprueba'] }
  ],
  112: [
    { inputs: [150000], numbers: [135000] },
    { inputs: [80000], numbers: [80000] }
  ],
  113: [
    { inputs: [4], keywords: ['par'], absent: ['impar'] },
    { inputs: [7], keywords: ['impar'] }
  ],
  114: [
    { inputs: [2, 3], keywords: ['ambos son positivos'], absent: ['al menos'] },
    { inputs: [2, -3], keywords: ['al menos uno no'], absent: ['ambos son positivos'] }
  ],
  115: [
    { inputs: [], sequence: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }
  ],
  116: [
    { inputs: [5], numbers: [15] },
    { inputs: [10], numbers: [55] }
  ],
  117: [
    { inputs: [3], numbers: [3, 30], keywords: ['3 x 1', '3 x 10'] }
  ],
  118: [
    { inputs: [5, 0], numbers: [5, 1] },
    { inputs: [2, 3, 0], numbers: [5, 2] }
  ],
  119: [
    { inputs: [6], sequence: [0, 1, 1, 2, 3, 5] }
  ],
  120: [
    { inputs: [5], numbers: [120] },
    { inputs: [0], numbers: [1] }
  ]
};

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function extractNumbers(text) {
  return (String(text).match(/-?\d+(?:[.,]\d+)?/g) || []).map((n) => Number(n.replace(',', '.')));
}

function containsSequence(list, sequence) {
  for (let i = 0; i <= list.length - sequence.length; i++) {
    if (sequence.every((v, j) => list[i + j] === v)) return true;
  }
  return false;
}

function evaluateCase(testCase, outputs) {
  const text = outputs.join(' ');
  const norm = normalize(text);
  const nums = extractNumbers(text);
  const failures = [];

  if (testCase.keywords) {
    for (const keyword of testCase.keywords) {
      if (!norm.includes(normalize(keyword))) failures.push(`falta «${keyword}»`);
    }
  }
  if (testCase.absent) {
    for (const keyword of testCase.absent) {
      if (norm.includes(normalize(keyword))) failures.push(`no debía decir «${keyword}»`);
    }
  }
  if (testCase.numbers) {
    for (const expected of testCase.numbers) {
      if (!nums.some((n) => Math.abs(n - expected) <= 0.02)) failures.push(`falta ${expected}`);
    }
  }
  if (testCase.sequence) {
    if (!containsSequence(nums, testCase.sequence)) {
      failures.push(`secuencia esperada ${testCase.sequence.join(', ')}`);
    }
  }

  return {
    ok: failures.length === 0,
    failures,
    output: outputs.join(' | ').slice(0, 500),
    numbers: nums.slice(0, 40)
  };
}

async function runDfd(ast, inputs) {
  const outputs = [];
  const queue = [...inputs];
  const executor = new DfdExecutor(
    ast,
    async () => (queue.length ? String(queue.shift()) : '0'),
    async (out) => { if (outputs.length < 2000) outputs.push(String(out)); },
    null,
    0
  );

  const timer = setTimeout(() => executor.stop(), 2500);
  try {
    await executor.execute();
  } finally {
    clearTimeout(timer);
  }
  return {
    outputs: outputs.filter((o) => !o.includes('Ejecución Finalizada')),
    variables: executor.variables
  };
}

async function analyzeDfd(questionId, text) {
  const ast = parseDfd(text);
  if (!ast || ast.error || !Array.isArray(ast.nodes) || ast.nodes.length === 0) {
    return {
      questionId,
      parseOk: false,
      error: ast?.error || 'Sin nodos',
      nodes: ast?.nodes?.length || 0,
      cases: [],
      suggested: 0,
      notes: 'No se pudo interpretar el .dfd'
    };
  }

  let pseudocode = '';
  try {
    pseudocode = generatePseudocode(ast, `q${questionId}.dfd`);
  } catch (err) {
    pseudocode = `[Error: ${err.message}]`;
  }

  const cases = [];
  for (const testCase of CASES[questionId] || []) {
    let result;
    try {
      const run = await runDfd(ast, testCase.inputs);
      result = evaluateCase(testCase, run.outputs);
    } catch (err) {
      result = { ok: false, failures: [`error de ejecución: ${err.message}`], output: '', numbers: [] };
    }
    cases.push({ inputs: testCase.inputs, ...result });
  }

  const allOk = cases.length > 0 && cases.every((c) => c.ok);
  return {
    questionId,
    parseOk: true,
    nodes: ast.nodes.length,
    pseudocode,
    cases,
    suggested: allOk ? 1 : 0,
    notes: allOk
      ? 'Todos los casos pasaron'
      : cases.map((c) => `[${c.inputs.join(',')}] ${c.failures.join('; ')}`).join(' | ')
  };
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado a MongoDB Atlas');

  // Calificaciones de Algoritmos - Parcial 1 creadas DESPUÉS del miércoles 21 de octubre (2026-10-21 23:59:59 UTC)
  const wednesdayCutoff = new Date('2026-10-21T23:59:59.999Z');

  const allGrades = await Grade.find({ subject: /Algoritmos.*Parcial.*1/i })
    .populate('student', 'username full_name email role')
    .sort({ createdAt: 1, created_at: 1 });

  const targetGrades = allGrades.filter(g => {
    const ts = new Date(g.created_at || g.createdAt || g._id.getTimestamp());
    return ts > wednesdayCutoff;
  });

  console.log(`\nGrades a calificar después del miércoles (${targetGrades.length}):`);
  
  for (const grade of targetGrades) {
    console.log(`\n======================================================`);
    console.log(`Estudiante: ${grade.student?.full_name} (${grade.student?.email})`);
    console.log(`Grade ID: ${grade._id} | Intento en comments: ${grade.comments}`);
    console.log(`Fecha: ${new Date(grade.created_at || grade.createdAt || grade._id.getTimestamp()).toLocaleString('es-CO')}`);

    let examData = null;
    try { examData = JSON.parse(grade.examData); } catch {}
    if (!examData) {
      console.log('Sin examData JSON válido.');
      continue;
    }

    console.log(`MC Score: ${examData.mcScore}/${examData.mcTotal}`);
    console.log(`Uploaded files en examData:`, examData.uploadedFileNames);

    // Buscar entregas DFD en DfdSubmission para este estudiante
    const studentSubmissions = await DfdSubmission.find({
      student: grade.student._id,
      examType: 'parcial-1'
    }).sort({ createdAt: 1 });

    console.log(`Total DFD submissions del estudiante en parcial-1: ${studentSubmissions.length}`);

    const fileQuestions = (examData.questions || []).filter(q => q.type === 'file');
    console.log(`Preguntas tipo FILE (${fileQuestions.length}):`, fileQuestions.map(q => q.id));

    let totalDfdScore = 0;
    const reviewDetails = {};

    for (const q of fileQuestions) {
      console.log(`\n  --- Pregunta id ${q.id} : ${q.question.slice(0, 80)}... ---`);
      
      // Buscar la entrega por questionId y attemptNumber
      let matchingSub = studentSubmissions.filter(s => 
        s.questionId === q.id && 
        (s.attemptNumber === examData.attemptNumber || !s.attemptNumber)
      ).pop();

      // Si no hay con questionId, buscar por nombre de archivo
      if (!matchingSub) {
        const expectedName = examData.uploadedFileNames?.[q.id];
        if (expectedName) {
          matchingSub = studentSubmissions.filter(s => 
            s.originalFileName === expectedName &&
            (s.attemptNumber === examData.attemptNumber || !s.attemptNumber)
          ).pop();
        }
      }

      // Si aún no, buscar última entrega con ese questionId
      if (!matchingSub) {
        matchingSub = studentSubmissions.filter(s => s.questionId === q.id).pop();
      }

      if (!matchingSub) {
        console.log(`    ❌ NO se encontró archivo subido para la pregunta ${q.id}`);
        reviewDetails[q.id] = { points: 0, notes: 'Archivo no encontrado o no subido' };
        continue;
      }

      console.log(`    Archivo encontrado: ${matchingSub.originalFileName} (${matchingSub.fileSize} bytes, attempt ${matchingSub.attemptNumber})`);
      const dfdText = matchingSub.fileData.toString('utf8');
      const analysis = await analyzeDfd(q.id, dfdText);
      
      console.log(`    Resultado: parseOk=${analysis.parseOk}, nodos=${analysis.nodes}, sugerido=${analysis.suggested}/1`);
      console.log(`    Notas: ${analysis.notes}`);
      if (analysis.pseudocode) {
        console.log(`    Pseudocódigo:\n${analysis.pseudocode.split('\n').map(l => '      ' + l).join('\n')}`);
      }
      
      totalDfdScore += analysis.suggested;
      reviewDetails[q.id] = {
        points: analysis.suggested,
        notes: analysis.notes,
        submissionId: matchingSub._id.toString(),
        fileName: matchingSub.originalFileName
      };
    }

    const mcScore = examData.mcScore || 0;
    const finalScore = mcScore + totalDfdScore;
    console.log(`\nRESUMEN PARA ${grade.student?.full_name}:`);
    console.log(`Teóricas: ${mcScore}/15 | DFDs: ${totalDfdScore}/5 | NOTA DEFINITIVA: ${finalScore}/20 (${(finalScore / 20 * 5).toFixed(1)}/5.0)`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
