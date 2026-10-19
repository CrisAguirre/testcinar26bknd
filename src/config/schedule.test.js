// Tests unitarios de las ventanas e intentos de los parciales (node --test, sin base de datos).
// Cubren el candado que decide si el envío de un estudiante se acepta o se rechaza (403).
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  TALLER_ALGO_SUBJECT,
  TALLER_ALGO_MAX_ATTEMPTS,
  ALGO_P1_SUBJECT,
  ALGO_P1_OPEN,
  ALGO_P1_CLOSE,
  ALGO_P1_MAX_ATTEMPTS,
  DW2P1_SUBJECT,
  DW2P1_PREP_OPEN,
  DW2P1_PREP_CLOSE,
  DW2P1_OPEN,
  DW2P1_CLOSE,
  DW2P1_PREP_MAX,
  DW2P1_MAX_ATTEMPTS,
  isTallerAlgoOpen,
  isAlgoP1Open,
  isDW2P1Open,
  isSubmissionAllowed
} from './schedule.js';

// Fechas absolutas en hora Colombia (UTC-5): deterministas en cualquier máquina.
const bogota = (iso) => new Date(`${iso}-05:00`);
const ms = (iso) => bogota(iso).getTime();

const ALUMNO = 'algo1@cinar.edu.co';

describe('Parcial 1 de Algoritmos — ventana lunes 19 y martes 20/10 (todo el día)', () => {
  it('constantes exactas: 19/10 00:00 → 20/10 23:59:59 y 2 intentos', () => {
    assert.equal(ALGO_P1_OPEN.toISOString(), '2026-10-19T05:00:00.000Z');
    assert.equal(ALGO_P1_CLOSE.toISOString(), '2026-10-21T04:59:59.000Z');
    assert.equal(ALGO_P1_MAX_ATTEMPTS, 2);
    assert.equal(ALGO_P1_SUBJECT, 'Algoritmos - Parcial 1');
  });

  it('isAlgoP1Open: bordes domingo → lunes → martes → miércoles', () => {
    assert.equal(isAlgoP1Open(bogota('2026-10-18T23:59:59')), false);
    assert.equal(isAlgoP1Open(bogota('2026-10-19T00:00:00')), true);
    assert.equal(isAlgoP1Open(bogota('2026-10-19T12:00:00')), true);
    assert.equal(isAlgoP1Open(bogota('2026-10-20T23:59:59')), true);
    assert.equal(isAlgoP1Open(bogota('2026-10-21T00:00:00')), false);
  });

  it('isAlgoP1Open acepta ms numéricos (submittedAt del intento)', () => {
    assert.equal(isAlgoP1Open(ms('2026-10-19T10:00:00')), true);
    assert.equal(isAlgoP1Open(ms('2026-10-21T10:00:00')), false);
  });

  it('isSubmissionAllowed: 0 y 1 intento dentro de ventana → permitido', () => {
    const now = bogota('2026-10-19T10:00:00');
    assert.deepEqual(isSubmissionAllowed(ALGO_P1_SUBJECT, ALUMNO, 0, null, now), { allowed: true, reason: null });
    assert.deepEqual(isSubmissionAllowed(ALGO_P1_SUBJECT, ALUMNO, 1, null, now), { allowed: true, reason: null });
  });

  it('isSubmissionAllowed: con 2 intentos → rechaza con mensaje de máximo', () => {
    const res = isSubmissionAllowed(ALGO_P1_SUBJECT, ALUMNO, 2, null, bogota('2026-10-20T18:00:00'));
    assert.equal(res.allowed, false);
    assert.equal(res.reason, 'Has alcanzado el máximo de intentos del parcial');
  });

  it('isSubmissionAllowed: fuera de ventana → rechaza con mensaje de horario', () => {
    const fuera = isSubmissionAllowed(ALGO_P1_SUBJECT, ALUMNO, 0, null, bogota('2026-10-18T22:00:00'));
    assert.equal(fuera.allowed, false);
    assert.equal(fuera.reason, 'El Parcial 1 de Algoritmos está fuera de horario (lunes 19 y martes 20/10, todo el día)');

    const tarde = isSubmissionAllowed(ALGO_P1_SUBJECT, ALUMNO, 0, null, bogota('2026-10-21T00:00:01'));
    assert.equal(tarde.allowed, false);
    assert.equal(tarde.reason, 'El Parcial 1 de Algoritmos está fuera de horario (lunes 19 y martes 20/10, todo el día)');
  });

  it('isSubmissionAllowed: intento hecho en ventana se acepta al sincronizar tarde (submittedAt manda)', () => {
    const res = isSubmissionAllowed(ALGO_P1_SUBJECT, ALUMNO, 0, ms('2026-10-20T23:50:00'), bogota('2026-10-25T09:00:00'));
    assert.deepEqual(res, { allowed: true, reason: null });
  });

  it('isSubmissionAllowed: bordes del 20/10 23:59:59 dentro y 21/10 00:00 fuera', () => {
    assert.equal(isSubmissionAllowed(ALGO_P1_SUBJECT, ALUMNO, 1, ms('2026-10-20T23:59:59'), bogota('2026-10-25T09:00:00')).allowed, true);
    assert.equal(isSubmissionAllowed(ALGO_P1_SUBJECT, ALUMNO, 1, ms('2026-10-21T00:00:00'), bogota('2026-10-25T09:00:00')).allowed, false);
  });
});

describe('Parcial 1 de DW2 — preparación 8–13/10 y evaluación del 19 al 21/10 (hasta medianoche)', () => {
  it('constantes exactas: prep 8–13/10, evaluación 19–21/10 y esquema 2+2', () => {
    assert.equal(DW2P1_PREP_OPEN.toISOString(), '2026-10-08T05:00:00.000Z');
    assert.equal(DW2P1_PREP_CLOSE.toISOString(), '2026-10-14T04:59:59.000Z');
    assert.equal(DW2P1_OPEN.toISOString(), '2026-10-19T05:00:00.000Z');
    assert.equal(DW2P1_CLOSE.toISOString(), '2026-10-22T04:59:59.000Z');
    assert.equal(DW2P1_PREP_MAX, 2);
    assert.equal(DW2P1_MAX_ATTEMPTS, 4);
  });

  it('isDW2P1Open: cubre prep + evaluación (el hueco 14–18/10 lo bloquea el gate, no el candado)', () => {
    assert.equal(isDW2P1Open(bogota('2026-10-07T23:59:59')), false);
    assert.equal(isDW2P1Open(bogota('2026-10-08T00:00:00')), true);
    assert.equal(isDW2P1Open(bogota('2026-10-13T23:59:59')), true);
    assert.equal(isDW2P1Open(bogota('2026-10-16T12:00:00')), true);
    assert.equal(isDW2P1Open(bogota('2026-10-18T23:59:59')), true);
    assert.equal(isDW2P1Open(bogota('2026-10-19T00:00:00')), true);
    assert.equal(isDW2P1Open(bogota('2026-10-21T00:00:00')), true);
    assert.equal(isDW2P1Open(bogota('2026-10-21T23:59:59')), true);
    assert.equal(isDW2P1Open(bogota('2026-10-22T00:00:00')), false);
  });

  it('preparación: 0 y 1 intento permitido; el 2.º ya bloquea con aviso de evaluación', () => {
    const now = bogota('2026-10-10T20:00:00');
    assert.equal(isSubmissionAllowed(DW2P1_SUBJECT, 'd.algo@cinar.edu.co', 0, null, now).allowed, true);
    assert.equal(isSubmissionAllowed(DW2P1_SUBJECT, 'd.algo@cinar.edu.co', 1, null, now).allowed, true);
    const res = isSubmissionAllowed(DW2P1_SUBJECT, 'd.algo@cinar.edu.co', 2, null, now);
    assert.equal(res.allowed, false);
    assert.equal(res.reason, 'Ya usaste tus 2 intentos de preparación; la evaluación es del 19 al 21/10 (hasta medianoche)');
  });

  it('hueco 14–18/10: rechaza con el mensaje de la evaluación 19–21/10', () => {
    const res = isSubmissionAllowed(DW2P1_SUBJECT, 'd.algo@cinar.edu.co', 2, null, bogota('2026-10-16T12:00:00'));
    assert.equal(res.allowed, false);
    assert.equal(res.reason, 'El Parcial 1 de DW2: preparación hasta el 13/10 y evaluación del 19 al 21/10 (hasta medianoche)');
  });

  it('evaluación 19–21/10: intentos 3 y 4 permitidos; el 5.º bloqueado por máximo', () => {
    const now = bogota('2026-10-19T15:00:00');
    assert.equal(isSubmissionAllowed(DW2P1_SUBJECT, 'd.algo@cinar.edu.co', 2, null, now).allowed, true);
    assert.equal(isSubmissionAllowed(DW2P1_SUBJECT, 'd.algo@cinar.edu.co', 3, null, now).allowed, true);
    const res = isSubmissionAllowed(DW2P1_SUBJECT, 'd.algo@cinar.edu.co', 4, null, now);
    assert.equal(res.allowed, false);
    assert.equal(res.reason, 'Has alcanzado el máximo de intentos del parcial');
  });

  it('bordes: 18/10 23:59:59 rechazado (hueco) y 19/10 00:00 aceptado (evaluación)', () => {
    const g = isSubmissionAllowed(DW2P1_SUBJECT, 'd.algo@cinar.edu.co', 2, ms('2026-10-18T23:59:59'), bogota('2026-10-25T09:00:00'));
    assert.equal(g.allowed, false);
    const e = isSubmissionAllowed(DW2P1_SUBJECT, 'd.algo@cinar.edu.co', 2, ms('2026-10-19T00:00:00'), bogota('2026-10-25T09:00:00'));
    assert.equal(e.allowed, true);
  });
});

describe('Taller 1 de Algoritmos — ventana 06/10 14:00 a 07/10 23:59', () => {
  it('isTallerAlgoOpen: bordes de apertura y cierre', () => {
    assert.equal(isTallerAlgoOpen(bogota('2026-10-06T13:59:59')), false);
    assert.equal(isTallerAlgoOpen(bogota('2026-10-06T14:00:00')), true);
    assert.equal(isTallerAlgoOpen(bogota('2026-10-07T23:59:59')), true);
    assert.equal(isTallerAlgoOpen(bogota('2026-10-08T00:00:00')), false);
  });

  it('gate de intentos: 0 y 1 permitido; el 2.º bloqueado', () => {
    assert.equal(isSubmissionAllowed(TALLER_ALGO_SUBJECT, ALUMNO, 0, null, bogota('2026-10-06T15:00:00')).allowed, true);
    assert.equal(isSubmissionAllowed(TALLER_ALGO_SUBJECT, ALUMNO, 1, null, bogota('2026-10-07T10:00:00')).allowed, true);
    const res = isSubmissionAllowed(TALLER_ALGO_SUBJECT, ALUMNO, TALLER_ALGO_MAX_ATTEMPTS, null, bogota('2026-10-07T10:00:00'));
    assert.equal(res.allowed, false);
    assert.equal(res.reason, 'Has alcanzado el máximo de intentos del taller');
  });

  it('fuera de ventana rechaza con el mensaje del taller', () => {
    const res = isSubmissionAllowed(TALLER_ALGO_SUBJECT, ALUMNO, 0, null, bogota('2026-10-08T10:00:00'));
    assert.equal(res.allowed, false);
    assert.equal(res.reason, 'El Taller 1 de Algoritmos está fuera de horario (06/10 hasta 07/10 23:59)');
  });
});

describe('Asuntos que no son evaluación de estos parciales', () => {
  it('otras materias no se bloquean por estas ventanas', () => {
    assert.deepEqual(
      isSubmissionAllowed('Matemáticas - Quiz', ALUMNO, 5, null, bogota('2026-10-19T10:00:00')),
      { allowed: true, reason: null }
    );
  });
});
