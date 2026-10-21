import Grade from '../models/Grade.js';
import DfdSubmission from '../models/DfdSubmission.js';
import ExamDraft from '../models/ExamDraft.js';
import { ALGO_P1_SUBJECT, ALGO_P1_DURATION_SECONDS } from '../config/schedule.js';

function parseExamData(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function normalizeFileName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function fileNameVariants(value) {
  const raw = String(value || '');
  const variants = new Set([raw]);
  // multer puede guardar el nombre en latin1 ("nÃºmero"); se compara también
  // la variante reinterpretada como UTF-8.
  try {
    variants.add(Buffer.from(raw, 'latin1').toString('utf8'));
  } catch {
    // Se conserva el nombre original.
  }
  return [...variants].map(normalizeFileName).filter(Boolean);
}

export function sameFileName(a, b) {
  const av = fileNameVariants(a);
  const bv = fileNameVariants(b);
  return av.some((name) => bv.includes(name));
}

export function findDfdSubmission(submissions, questionId, filename) {
  // questionId es autoritativo para las entregas nuevas.
  const byQuestion = submissions.find(
    (s) => s.questionId !== undefined && s.questionId !== null && Number(s.questionId) === Number(questionId)
  );
  if (byQuestion) return byQuestion;

  // Entregas antiguas sin questionId: cruce tolerante por nombre.
  if (!filename) return null;
  return submissions.find(
    (s) => (s.questionId === undefined || s.questionId === null) && sameFileName(s.originalFileName, filename)
  ) || null;
}

export function firstPendingIndex(questions, answers, uploadedFileNames) {
  const theoryPending = questions.findIndex(
    (q) => q.type !== 'file' && (answers[q.id] === undefined || answers[q.id] === null || answers[q.id] === '')
  );
  if (theoryPending >= 0) return theoryPending;

  const practicalPending = questions.findIndex(
    (q) => q.type === 'file' && !uploadedFileNames[String(q.id)]
  );
  if (practicalPending >= 0) return practicalPending;

  // Todo respondido: se abre en la última pregunta para que el estudiante
  // pueda finalizar sin recorrer las 20 preguntas de nuevo.
  return Math.max(questions.length - 1, 0);
}

/**
 * Reabre un intento ya registrado (p. ej. el que se autoenvió al agotarse
 * las 2 horas) sin crear un Grade nuevo ni consumir un intento adicional.
 * Deja un ExamDraft con las mismas preguntas, respuestas y DFD ya subidos.
 */
export async function reopenAlgoP1(req, res) {
  try {
    const { gradeId, seconds } = req.body ?? {};
    if (!gradeId) {
      return res.status(400).json({ error: 'gradeId es obligatorio' });
    }

    const grade = await Grade.findById(gradeId).populate('student', 'username full_name email');
    if (!grade) {
      return res.status(404).json({ error: 'Calificación no encontrada' });
    }
    if (grade.subject !== ALGO_P1_SUBJECT) {
      return res.status(400).json({ error: 'La calificación no corresponde al Parcial 1 de Algoritmos' });
    }
    if (!grade.student) {
      return res.status(400).json({ error: 'La calificación no tiene un estudiante asociado' });
    }

    const examData = parseExamData(grade.examData);
    if (!examData || !Array.isArray(examData.questions) || examData.questions.length === 0) {
      return res.status(400).json({
        error: 'La calificación no tiene examData con preguntas; no es posible reabrir el mismo intento'
      });
    }
    if (examData.reviewedAt) {
      return res.status(400).json({
        error: 'Este intento ya fue calificado por el docente; no se puede reabrir para sobrescribir la nota'
      });
    }

    const answers = {};
    for (const q of examData.questions) {
      if (q.type === 'file') continue;
      if (q.studentAnswer !== undefined && q.studentAnswer !== null && q.studentAnswer !== '') {
        answers[q.id] = q.studentAnswer;
      }
    }

    const uploadedFileNames = examData.uploadedFileNames && typeof examData.uploadedFileNames === 'object'
      ? examData.uploadedFileNames
      : {};

    // Cruzar las entregas .dfd por nombre de archivo (las antiguas no tienen
    // questionId; las nuevas sí).
    const submissions = await DfdSubmission.find({
      student: grade.student._id,
      examType: 'parcial-1',
      period: grade.period
    }).sort({ createdAt: -1 });

    // Solo se dan por subidos los archivos que existen realmente en la base.
    // Un nombre en examData.uploadedFileNames no prueba que la subida haya
    // terminado (pudo fallar justo después de seleccionar el archivo).
    const confirmedFileNames = {};
    const dfdSubmissions = {};
    for (const q of examData.questions) {
      if (q.type !== 'file') continue;
      const filename = uploadedFileNames[String(q.id)] || uploadedFileNames[q.id];
      const sub = findDfdSubmission(submissions, q.id, filename);
      if (!sub) continue;
      confirmedFileNames[q.id] = filename || sub.originalFileName;
      dfdSubmissions[q.id] = String(sub._id);
    }

    const currentIndex = firstPendingIndex(examData.questions, answers, confirmedFileNames);
    const timeLeft = Number.isFinite(Number(seconds)) && Number(seconds) > 0
      ? Math.min(Number(seconds), ALGO_P1_DURATION_SECONDS)
      : ALGO_P1_DURATION_SECONDS;

    // Marcar el Grade como reabierto: al finalizar, el estudiante actualiza
    // este mismo registro (no crea otro).
    examData.reopened = true;
    examData.reopenedAt = new Date().toISOString();
    examData.reopenedBy = req.user?.id || null;
    examData.reopenedFromScore = grade.score;
    grade.examData = JSON.stringify(examData);
    await grade.save();

    // El examData original incluye correctAnswer/isCorrect (para la revisión
    // del docente). Al estudiante se le entregan solo los datos necesarios
    // para continuar; de lo contrario podría leer las respuestas correctas
    // desde el borrador y "corregir" sus teóricas antes de reenviar.
    const draftQuestions = examData.questions.map((q) => ({
      id: q.id,
      tema: q.tema,
      type: q.type,
      question: q.question,
      options: Array.isArray(q.options) ? q.options : []
    }));

    const payload = {
      attemptNumber: examData.attemptNumber || 1,
      questions: draftQuestions,
      answers,
      currentIndex,
      timeLeft,
      timeUsed: 0,
      tabSwitchCount: examData.tabSwitches || 0,
      uploadedFileNames: confirmedFileNames,
      dfdSubmissions,
      gradeId: grade._id,
      status: 'in_progress',
      clientUpdatedAt: Date.now()
    };

    let draft;
    try {
      draft = await ExamDraft.findOneAndUpdate(
        { student: grade.student._id, subject: ALGO_P1_SUBJECT },
        { $set: payload },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
      );
    } catch (err) {
      if (err?.code !== 11000) throw err;
      draft = await ExamDraft.findOneAndUpdate(
        { student: grade.student._id, subject: ALGO_P1_SUBJECT },
        { $set: payload },
        { new: true, runValidators: true }
      );
    }

    res.json({
      ok: true,
      draftId: draft._id,
      gradeId: grade._id,
      student: grade.student,
      attemptNumber: payload.attemptNumber,
      currentIndex,
      answered: Object.keys(answers).length,
      uploadedDfds: Object.keys(dfdSubmissions).length,
      timeLeft
    });
  } catch (err) {
    console.error('Error al reabrir el Parcial 1 de Algoritmos:', err);
    res.status(500).json({ error: 'Error interno' });
  }
}
