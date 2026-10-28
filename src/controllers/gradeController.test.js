// Tests unitarios del candado de envíos y del mapeo materia→curso (node --test, sin base de datos).
import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { examLockError, getCourseFromSubject, isExamSubject } from './gradeController.js';

const bogota = (iso) => new Date(`${iso}-05:00`);
const ms = (iso) => bogota(iso).getTime();

const ESTUDIANTE = { role: 'student' };
const ADMIN = { role: 'admin' };
const COORDINADOR = { role: 'coordinator' };
const DOCENTE = { role: 'teacher' };

const PREV_LOCK = process.env.EXAMS_LOCKED;
afterEach(() => {
  if (PREV_LOCK === undefined) delete process.env.EXAMS_LOCKED;
  else process.env.EXAMS_LOCKED = PREV_LOCK;
});

describe('examLockError — Parcial 1 de Algoritmos', () => {
  it('dentro de la ventana (19–28/10) no bloquea al estudiante', () => {
    assert.equal(examLockError(ESTUDIANTE, 'Algoritmos - Parcial 1', ms('2026-10-19T10:00:00')), null);
    assert.equal(examLockError(ESTUDIANTE, 'Algoritmos - Parcial 1', ms('2026-10-20T23:59:59')), null);
    assert.equal(examLockError(ESTUDIANTE, 'Algoritmos - Parcial 1', ms('2026-10-28T23:59:59')), null);
  });

  it('fuera de la ventana rechaza con el mensaje exacto', () => {
    assert.equal(
      examLockError(ESTUDIANTE, 'Algoritmos - Parcial 1', ms('2026-10-18T22:00:00')),
      'El Parcial 1 de Algoritmos está fuera de horario (lunes 19 al miércoles 28/10, hasta medianoche)'
    );
    assert.equal(
      examLockError(ESTUDIANTE, 'Algoritmos - Parcial 1', ms('2026-10-29T00:00:01')),
      'El Parcial 1 de Algoritmos está fuera de horario (lunes 19 al miércoles 28/10, hasta medianoche)'
    );
  });

  it('admin, coordinación y docente nunca se bloquean', () => {
    for (const user of [ADMIN, COORDINADOR, DOCENTE]) {
      assert.equal(examLockError(user, 'Algoritmos - Parcial 1', ms('2026-10-15T10:00:00')), null);
    }
  });

  it('sin usuario (petición anónima) también se bloquea fuera de horario', () => {
    assert.equal(
      examLockError(null, 'Algoritmos - Parcial 1', ms('2026-10-15T10:00:00')),
      'El Parcial 1 de Algoritmos está fuera de horario (lunes 19 al miércoles 28/10, hasta medianoche)'
    );
  });
});

describe('examLockError — Parcial 1 de DW2 (prep 8–13/10, evaluación 19–21/10)', () => {
  it('preparación (10/10) y evaluación (19–21/10) no bloquean; en el hueco el rechazo lo da el gate de envío (isSubmissionAllowed)', () => {
    assert.equal(examLockError(ESTUDIANTE, 'Desarrollo Web 2 - Parcial 1', ms('2026-10-10T20:00:00')), null);
    assert.equal(examLockError(ESTUDIANTE, 'Desarrollo Web 2 - Parcial 1', ms('2026-10-19T10:00:00')), null);
    assert.equal(examLockError(ESTUDIANTE, 'Desarrollo Web 2 - Parcial 1', ms('2026-10-21T15:00:00')), null);
    // El hueco 14–18/10 cae dentro de isDW2P1Open (prep → evaluación), así que el candado no lo bloquea;
    // quien rechaza es isSubmissionAllowed con el mensaje de la evaluación 19–21/10 (cubierto en schedule.test.js).
    assert.equal(examLockError(ESTUDIANTE, 'Desarrollo Web 2 - Parcial 1', ms('2026-10-16T12:00:00')), null);
  });

  it('el hueco solo aplica a estudiantes (admin/coordinación pasan)', () => {
    assert.equal(examLockError(ADMIN, 'Desarrollo Web 2 - Parcial 1', ms('2026-10-16T12:00:00')), null);
    assert.equal(examLockError(COORDINADOR, 'Desarrollo Web 2 - Parcial 1', ms('2026-10-16T12:00:00')), null);
  });
});

describe('examLockError — Taller 1 de Algoritmos', () => {
  it('dentro de ventana pasa; después del 07/10 bloquea para estudiantes', () => {
    assert.equal(examLockError(ESTUDIANTE, 'Algoritmos - Taller 1', ms('2026-10-06T15:00:00')), null);
    assert.equal(
      examLockError(ESTUDIANTE, 'Algoritmos - Taller 1', ms('2026-10-10T10:00:00')),
      'El Taller 1 de Algoritmos está fuera de horario (06/10 hasta 07/10 23:59)'
    );
    assert.equal(examLockError(DOCENTE, 'Algoritmos - Taller 1', ms('2026-10-10T10:00:00')), null);
  });
});

describe('examLockError — bloqueo global (EXAMS_LOCKED)', () => {
  it('con EXAMS_LOCKED=true rechaza materias genéricas; con false permite', () => {
    process.env.EXAMS_LOCKED = 'true';
    assert.equal(
      examLockError(ESTUDIANTE, 'Desarrollo Web 1 - Parcial 2', ms('2026-10-19T10:00:00')),
      'Exámenes bloqueados temporalmente: todavía no son las fechas'
    );
    process.env.EXAMS_LOCKED = 'false';
    assert.equal(examLockError(ESTUDIANTE, 'Desarrollo Web 1 - Parcial 2', ms('2026-10-19T10:00:00')), null);
  });

  it('el bloqueo global tampoco aplica a roles privilegiados', () => {
    process.env.EXAMS_LOCKED = 'true';
    assert.equal(examLockError(ADMIN, 'Desarrollo Web 1 - Parcial 2', ms('2026-10-19T10:00:00')), null);
  });
});

describe('getCourseFromSubject / isExamSubject', () => {
  it('mapea cada materia al curso de inscripción correcto', () => {
    assert.equal(getCourseFromSubject('Algoritmos - Parcial 1'), 'algoritmos');
    assert.equal(getCourseFromSubject('Algoritmos - Taller 1'), 'algoritmos');
    assert.equal(getCourseFromSubject('Desarrollo Web 2 - Parcial 1'), 'desarrollo-web-2');
    assert.equal(getCourseFromSubject('Desarrollo Web 1 - Parcial 2'), 'desarrollo-web-1');
    assert.equal(getCourseFromSubject('Desarrollo Web 1 - Taller Algoritmia'), 'desarrollo-web-1');
    assert.equal(getCourseFromSubject('Matemáticas - Quiz'), null);
    assert.equal(getCourseFromSubject(null), null);
  });

  it('isExamSubject reconoce las evaluaciones y rechaza lo demás', () => {
    assert.equal(isExamSubject('Algoritmos - Parcial 1'), true);
    assert.equal(isExamSubject('Desarrollo Web 2 - Parcial 1'), true);
    assert.equal(isExamSubject('Desarrollo Web 1 - Taller Algoritmia'), true);
    assert.equal(isExamSubject('Matemáticas - Quiz'), false);
    assert.equal(isExamSubject(null), false);
    assert.equal(isExamSubject(123), false);
  });
});
