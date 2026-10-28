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
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Cris87:MorgothTheLord88@cluster0.r79rn7k.mongodb.net/cinar?appName=Cluster0';

// Casos de prueba por pregunta práctica (ids 101-120)
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
    { inputs: [10, 2500], numbers: [25000] }
  ],
  108: [
    { inputs: [5], keywords: ['positivo'] },
    { inputs: [-3], keywords: ['negativo'] },
    { inputs: [0], keywords: ['cero'] }
  ],
  109: [
    { inputs: [7, 4], numbers: [7] },
    { inputs: [3, 9], numbers: [9] }
  ],
  110: [
    { inputs: [18], keywords: ['mayor'] },
    { inputs: [20], keywords: ['mayor'] },
    { inputs: [15], keywords: ['menor'] }
  ],
  111: [
    { inputs: [3.5], keywords: ['aprueba'] },
    { inputs: [2.8], keywords: ['reprueba'] }
  ],
  112: [
    { inputs: [150000], numbers: [120000] },
    { inputs: [50000], numbers: [50000] }
  ],
  113: [
    { inputs: [4], keywords: ['par'], absent: ['impar'] },
    { inputs: [7], keywords: ['impar'] }
  ],
  114: [
    { inputs: [5, 3], keywords: ['ambos positivos'] },
    { inputs: [-2, 4], keywords: ['al menos uno no'] }
  ],
  115: [
    { inputs: [], sequence: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }
  ],
  116: [
    { inputs: [5], numbers: [15] },
    { inputs: [10], numbers: [55] }
  ],
  117: [
    { inputs: [3], numbers: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30] }
  ],
  118: [
    { inputs: [5, 10, 3, 0], numbers: [18] }
  ],
  119: [
    { inputs: [7], sequence: [0, 1, 1, 2, 3, 5, 8] },
    { inputs: [5], sequence: [0, 1, 1, 2, 3] }
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
      if (!norm.includes(normalize(keyword))) failures.push(`falta "${keyword}"`);
    }
  }
  if (testCase.absent) {
    for (const keyword of testCase.absent) {
      if (norm.includes(normalize(keyword))) failures.push(`no debía decir "${keyword}"`);
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

async function inspect() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado a MongoDB Atlas\n');

  // Buscar usuarios por nombre
  const students = await User.find({
    $or: [
      { full_name: /Julian/i },
      { full_name: /Reina/i },
      { full_name: /Eraso/i },
      { email: /reina/i },
      { email: /eraso/i }
    ]
  });

  console.log('--- Estudiantes Encontrados ---');
  students.forEach(s => console.log({ id: s._id, full_name: s.full_name, email: s.email, username: s.username, role: s.role }));

  const studentIds = students.map(s => s._id);

  // Buscar calificaciones de Algoritmos Parcial 1 para estos estudiantes
  const grades = await Grade.find({
    student: { $in: studentIds },
    subject: /Algoritmos.*Parcial.*1/i
  }).populate('student', 'full_name email').sort({ createdAt: 1 });

  console.log(`\n--- Calificaciones en Algoritmos - Parcial 1 (${grades.length}) ---`);
  for (const g of grades) {
    console.log(`\n======================================================`);
    console.log(`Estudiante: ${g.student?.full_name} (${g.student?.email})`);
    console.log(`Grade ID: ${g._id}`);
    console.log(`Score actual: ${g.score}/${g.max_score}`);
    console.log(`Comments: ${g.comments}`);
    console.log(`Created: ${g.createdAt || g.created_at}`);

    let examData = null;
    try { examData = JSON.parse(g.examData); } catch {}
    if (!examData) {
      console.log('examData no disponible o no es JSON válido');
      continue;
    }

    console.log(`Intento: ${examData.attemptNumber} | MC Score: ${examData.mcScore}/${examData.mcTotal}`);
    console.log(`uploadedFileNames:`, examData.uploadedFileNames);

    // Buscar entregas DFD
    const submissions = await DfdSubmission.find({
      student: g.student._id,
      examType: 'parcial-1'
    }).sort({ createdAt: 1 });

    console.log(`Total DFD submissions del estudiante: ${submissions.length}`);
    submissions.forEach(sub => {
      console.log(`  Sub: questionId=${sub.questionId}, attempt=${sub.attemptNumber}, file=${sub.originalFileName}, size=${sub.fileSize}, date=${sub.createdAt}`);
    });

    const fileQuestions = (examData.questions || []).filter(q => q.type === 'file');
    console.log(`\nPreguntas prácticas (${fileQuestions.length}):`, fileQuestions.map(q => q.id));

    let totalDfdScore = 0;
    const reviewDetails = {};

    for (const q of fileQuestions) {
      console.log(`\n  --- Pregunta id ${q.id} : ${q.question.slice(0, 80)}... ---`);

      let matchingSub = submissions.filter(s => 
        s.questionId === q.id && 
        (s.attemptNumber === examData.attemptNumber || !s.attemptNumber)
      ).pop();

      if (!matchingSub) {
        const expectedName = examData.uploadedFileNames?.[q.id];
        if (expectedName) {
          matchingSub = submissions.filter(s => 
            s.originalFileName === expectedName &&
            (s.attemptNumber === examData.attemptNumber || !s.attemptNumber)
          ).pop();
        }
      }

      if (!matchingSub) {
        matchingSub = submissions.filter(s => s.questionId === q.id).pop();
      }

      if (!matchingSub) {
        console.log(`    ⚠️ NO se encontró archivo subido para la pregunta ${q.id}`);
        reviewDetails[q.id] = { points: 0, notes: 'Archivo no encontrado o no subido' };
        continue;
      }

      console.log(`    Archivo encontrado: ${matchingSub.originalFileName} (${matchingSub.fileSize} bytes)`);
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
    console.log(`\nRESUMEN PARA ${g.student?.full_name}:`);
    console.log(`Teóricas: ${mcScore}/15 | DFDs: ${totalDfdScore}/5 | DEFINITIVA: ${finalScore}/20 (${(finalScore / 20 * 5).toFixed(1)}/5.0)`);
  }

  // Also check if there are any submissions or drafts for these students if grade is not yet created
  for (const s of students) {
    const subs = await DfdSubmission.find({ student: s._id });
    console.log(`\n${s.full_name} (${s.email}): Total DfdSubmissions en BD: ${subs.length}`);
  }

  await mongoose.disconnect();
}

inspect().catch(console.error);
