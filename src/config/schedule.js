import { nowColombia } from './timezone.js';

export const EXAM_SUBJECTS = {
  PARCIAL1: 'Desarrollo Web 1 - Parcial 1',
  PARCIAL2: 'Desarrollo Web 1 - Parcial 2',
  TALLER: 'Desarrollo Web 1 - Taller Algoritmia'
};

export const KNOWN_EXAM_SUBJECTS = new Set(Object.values(EXAM_SUBJECTS));

// Parcial 2 — Desarrollo Web 1
// 3 simulacros + 1 evaluación.
// Simulacros: desde el 15 de agosto hasta el inicio de la evaluación (19 ago 18:45).
// Evaluación: 19 de agosto 18:45 - 20:00 (hora Colombia).
export const PARCIAL2_SIMULACRO_START = new Date(2026, 7, 15, 0, 0);
export const PARCIAL2_EVAL_START = new Date(2026, 7, 19, 18, 45);
export const PARCIAL2_EVAL_END = new Date(2026, 7, 19, 20, 0);

export const PARCIAL2_MAX_SIMULACROS = 3;
export const PARCIAL2_MAX_EVALUACIONES = 1;
export const PARCIAL2_MAX_TOTAL = PARCIAL2_MAX_SIMULACROS + PARCIAL2_MAX_EVALUACIONES;

// Extensiones por estudiante (email -> config).
// Taller 1 (Taller de Algoritmia) habilitado para Diego Azain hasta el
// miércoles 19 de agosto de 2026 a las 4:00 PM hora Colombia.
export const STUDENT_OVERRIDES = {
  'd.azain@cinar.edu.co': {
    tallerDeadline: new Date(2026, 7, 19, 16, 0),
    tallerMaxAttempts: 2
  }
};

export function getParcial2Window(now = nowColombia()) {
  if (now < PARCIAL2_SIMULACRO_START) {
    return {
      kind: 'closed',
      label: 'El Parcial 2 aún no está habilitado',
      maxAttempts: 0,
      simStart: PARCIAL2_SIMULACRO_START.getTime(),
      evalStart: PARCIAL2_EVAL_START.getTime(),
      evalEnd: PARCIAL2_EVAL_END.getTime(),
      maxSimulacros: PARCIAL2_MAX_SIMULACROS,
      maxEvaluaciones: PARCIAL2_MAX_EVALUACIONES
    };
  }
  if (now < PARCIAL2_EVAL_START) {
    return {
      kind: 'simulacro',
      label: 'Simulacros (hasta las 18:45)',
      maxAttempts: PARCIAL2_MAX_SIMULACROS,
      simStart: PARCIAL2_SIMULACRO_START.getTime(),
      evalStart: PARCIAL2_EVAL_START.getTime(),
      evalEnd: PARCIAL2_EVAL_END.getTime(),
      maxSimulacros: PARCIAL2_MAX_SIMULACROS,
      maxEvaluaciones: PARCIAL2_MAX_EVALUACIONES
    };
  }
  if (now <= PARCIAL2_EVAL_END) {
    return {
      kind: 'evaluacion',
      label: 'Evaluación (18:45 - 20:00)',
      maxAttempts: PARCIAL2_MAX_TOTAL,
      simStart: PARCIAL2_SIMULACRO_START.getTime(),
      evalStart: PARCIAL2_EVAL_START.getTime(),
      evalEnd: PARCIAL2_EVAL_END.getTime(),
      maxSimulacros: PARCIAL2_MAX_SIMULACROS,
      maxEvaluaciones: PARCIAL2_MAX_EVALUACIONES
    };
  }
  return {
    kind: 'closed',
    label: 'El Parcial 2 ha finalizado',
    maxAttempts: PARCIAL2_MAX_TOTAL,
    simStart: PARCIAL2_SIMULACRO_START.getTime(),
    evalStart: PARCIAL2_EVAL_START.getTime(),
    evalEnd: PARCIAL2_EVAL_END.getTime(),
    maxSimulacros: PARCIAL2_MAX_SIMULACROS,
    maxEvaluaciones: PARCIAL2_MAX_EVALUACIONES
  };
}

export function getTallerOverride(email) {
  const key = (email || '').toLowerCase();
  const override = STUDENT_OVERRIDES[key];
  if (!override) return null;
  return {
    email: key,
    deadline: override.tallerDeadline.getTime(),
    maxAttempts: override.tallerMaxAttempts
  };
}

export function isSubmissionAllowed(subject, userEmail, usedAttempts, submittedAtMs, now = nowColombia()) {
  const nowMs = now.getTime();

  if (subject === EXAM_SUBJECTS.PARCIAL2) {
    const checkMs = submittedAtMs && Number.isFinite(submittedAtMs) ? submittedAtMs : nowMs;
    const window = getParcial2Window(new Date(checkMs));
    if (window.kind === 'closed') {
      return { allowed: false, reason: window.label };
    }
    if (usedAttempts >= window.maxAttempts) {
      return { allowed: false, reason: 'Has alcanzado el máximo de intentos permitidos' };
    }
    return { allowed: true, reason: null };
  }

  if (subject === EXAM_SUBJECTS.TALLER) {
    const override = getTallerOverride(userEmail);
    if (override) {
      // El guardado puede validarse contra el momento real del intento (submittedAt)
      // para no perder intentos que se hicieron dentro del plazo pero se sincronizaron después.
      const checkMs = submittedAtMs && Number.isFinite(submittedAtMs) ? submittedAtMs : nowMs;
      if (checkMs > override.deadline) {
        return { allowed: false, reason: 'El plazo del taller ha vencido' };
      }
      if (usedAttempts >= override.maxAttempts) {
        return { allowed: false, reason: 'Has alcanzado el máximo de intentos del taller' };
      }
      return { allowed: true, reason: null };
    }
    return { allowed: true, reason: null };
  }

  return { allowed: true, reason: null };
}
