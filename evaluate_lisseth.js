import mongoose from 'mongoose';
import Grade from './src/models/Grade.js';
import User from './src/models/User.js';
import DfdSubmission from './src/models/DfdSubmission.js';
import { parseDfd } from '../testcinar26/src/lib/dfd/parser.js';
import { generatePseudocode } from '../testcinar26/src/lib/dfd/pseudocode.js';
import { DfdExecutor } from '../testcinar26/src/lib/dfd/executor.js';

const MONGODB_URI = 'mongodb+srv://Cris87:MorgothTheLord88@cluster0.r79rn7k.mongodb.net/cinar?appName=Cluster0';

// Casos de prueba por pregunta práctica
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

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado a MongoDB Atlas\n');

  const gradeId = '6ae14d983cb36e299c5cf5ad';
  const grade = await Grade.findById(gradeId).populate('student', 'full_name email username');

  console.log(`========================================================================`);
  console.log(`ESTUDIANTE: ${grade.student?.full_name} (${grade.student?.email})`);
  console.log(`Grade ID: ${grade._id}`);
  console.log(`Fecha: ${grade.createdAt || grade.created_at}`);
  console.log(`Comments actuales: ${grade.comments}`);
  console.log(`========================================================================`);

  const examData = JSON.parse(grade.examData);
  console.log(`Intento: ${examData.attemptNumber} | MC Score: ${examData.mcScore}/${examData.mcTotal}`);
  console.log(`Archivos reportados en examData:`, examData.uploadedFileNames);

  const fileQuestions = examData.questions.filter(q => q.type === 'file');
  console.log(`\nPreguntas prácticas asignadas (${fileQuestions.length}):`, fileQuestions.map(q => q.id));

  const submissions = await DfdSubmission.find({
    student: grade.student._id,
    examType: 'parcial-1'
  }).sort({ createdAt: 1 });

  console.log(`Submissions encontradas en BD: ${submissions.length}`);

  for (const q of fileQuestions) {
    console.log(`\n------------------------------------------------------------------------`);
    console.log(`PREGUNTA ${q.id} (Tema ${q.tema}): ${q.question.replace(/\n+/g, ' ')}`);

    let sub = submissions.filter(s => s.questionId === q.id).pop();
    if (!sub) {
      const expName = examData.uploadedFileNames?.[q.id];
      if (expName) sub = submissions.filter(s => s.originalFileName === expName).pop();
    }

    if (!sub) {
      console.log(`  ❌ No se encontró archivo subido para la pregunta ${q.id}`);
      continue;
    }

    console.log(`  Archivo: ${sub.originalFileName} (${sub.fileSize} bytes)`);
    const dfdText = sub.fileData.toString('utf8');
    console.log(`  Raw Text (primeros 250 chars):\n${dfdText.slice(0, 250)}`);

    const analysis = await analyzeDfd(q.id, dfdText);
    console.log(`  Resultado automático: parseOk=${analysis.parseOk}, nodos=${analysis.nodes}, sugerido=${analysis.suggested}/1`);
    console.log(`  Notas: ${analysis.notes}`);
    if (analysis.pseudocode) {
      console.log(`  Pseudocódigo:\n${analysis.pseudocode.split('\n').map(l => '    ' + l).join('\n')}`);
    }
  }

  await mongoose.disconnect();
}

main().catch(console.error);
