import { Router } from 'express';
import mongoose from 'mongoose';
import ExamDraft from '../models/ExamDraft.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import {
  ALGO_P1_SUBJECT,
  isAlgoP1Open,
  DW2P1_SUBJECT,
  isDW2P1Open
} from '../config/schedule.js';

const router = Router();
router.use(authenticateToken);

const MAX_QUESTIONS = 30;
const MAX_PAYLOAD_BYTES = 500 * 1024; // 500 KB: sobra para 20 preguntas + respuestas

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function cleanObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function sanitizeDraft(body = {}) {
  const questions = Array.isArray(body.questions) ? body.questions.slice(0, MAX_QUESTIONS) : [];
  const currentIndex = clampInt(body.currentIndex, 0, Math.max(questions.length - 1, 0), 0);

  return {
    attemptNumber: clampInt(body.attemptNumber, 1, 10, 1),
    questions,
    answers: cleanObject(body.answers),
    currentIndex,
    timeLeft: clampInt(body.timeLeft, 0, 24 * 60 * 60, 0),
    timeUsed: clampInt(body.timeUsed, 0, 24 * 60 * 60, 0),
    tabSwitchCount: clampInt(body.tabSwitchCount, 0, 100000, 0),
    uploadedFileNames: cleanObject(body.uploadedFileNames),
    dfdSubmissions: cleanObject(body.dfdSubmissions),
    gradeId: mongoose.isValidObjectId(body.gradeId) ? body.gradeId : null,
    clientUpdatedAt: clampInt(body.clientUpdatedAt, 0, Date.now() + 60_000, Date.now())
  };
}

function registerDraftRoutes({ basePath, subject, isOpenFn, closedErrorMsg }) {
  // Devuelve el borrador del estudiante autenticado (si existe).
  router.get(`/${basePath}/draft`, async (req, res) => {
    try {
      const draft = await ExamDraft.findOne({
        student: req.user.id,
        subject,
        status: 'in_progress'
      }).lean();

      if (!draft) {
        return res.status(404).json({ error: 'No hay un intento en progreso' });
      }
      res.json(draft);
    } catch (err) {
      console.error(`Error al leer borrador de ${subject}:`, err);
      res.status(500).json({ error: 'Error interno' });
    }
  });

  // Guarda/actualiza el borrador. Es idempotente: el frontend puede llamarlo
  // cada pocos segundos sin crear registros duplicados.
  router.put(`/${basePath}/draft`, async (req, res) => {
    try {
      const existing = await ExamDraft.findOne({
        student: req.user.id,
        subject
      }).select('_id');

      const isPrivileged = req.user && ['admin', 'coordinator', 'teacher'].includes(req.user.role);
      // Después del cierre no se permiten borradores nuevos, pero sí conservar
      // el que ya existía (para no perder respuestas si el estudiante reconecta).
      if (!isPrivileged && !isOpenFn() && !existing) {
        return res.status(403).json({ error: closedErrorMsg });
      }

      const payload = sanitizeDraft(req.body);
      if (payload.questions.length === 0) {
        return res.status(400).json({ error: 'El borrador no contiene preguntas' });
      }
      if (Buffer.byteLength(JSON.stringify(payload), 'utf8') > MAX_PAYLOAD_BYTES) {
        return res.status(413).json({ error: 'El borrador supera el tamaño permitido' });
      }

      const draft = await ExamDraft.findOneAndUpdate(
        { student: req.user.id, subject },
        {
          $set: {
            ...payload,
            status: 'in_progress'
          }
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
          runValidators: true
        }
      );

      res.json({
        ok: true,
        draftId: draft._id,
        updatedAt: draft.updatedAt,
        currentIndex: draft.currentIndex,
        answered: Object.keys(payload.answers || {}).length
      });
    } catch (err) {
      // Dos autosaves simultáneos pueden chocar con el índice único: se
      // resuelve reintentando el update (sin crear duplicados).
      if (err?.code === 11000) {
        try {
          const payload = sanitizeDraft(req.body);
          const draft = await ExamDraft.findOneAndUpdate(
            { student: req.user.id, subject },
            { $set: { ...payload, status: 'in_progress' } },
            { new: true, runValidators: true }
          );
          return res.json({ ok: true, draftId: draft._id, updatedAt: draft.updatedAt });
        } catch (retryErr) {
          console.error(`Error al guardar borrador de ${subject} (reintento):`, retryErr);
        }
      }
      console.error(`Error al guardar borrador de ${subject}:`, err);
      res.status(500).json({ error: 'Error interno' });
    }
  });

  // Elimina el borrador cuando el intento ya quedó registrado o se descarta.
  router.delete(`/${basePath}/draft`, async (req, res) => {
    try {
      await ExamDraft.deleteOne({ student: req.user.id, subject });
      res.json({ ok: true });
    } catch (err) {
      console.error(`Error al eliminar borrador de ${subject}:`, err);
      res.status(500).json({ error: 'Error interno' });
    }
  });
}

// Parcial 1 de Algoritmos
registerDraftRoutes({
  basePath: 'algo-p1',
  subject: ALGO_P1_SUBJECT,
  isOpenFn: isAlgoP1Open,
  closedErrorMsg: 'El Parcial 1 de Algoritmos está fuera de horario (lunes 19 al miércoles 28/10, hasta medianoche)'
});

// Parcial 1 de Desarrollo Web 2
registerDraftRoutes({
  basePath: 'dw2-p1',
  subject: DW2P1_SUBJECT,
  isOpenFn: isDW2P1Open,
  closedErrorMsg: 'El Parcial 1 de DW2 está fuera de horario (evaluación del 19 al 21/10, hasta medianoche)'
});

export default router;
