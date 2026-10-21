import test from 'node:test';
import assert from 'node:assert/strict';
import {
  firstPendingIndex,
  normalizeFileName,
  sameFileName,
  findDfdSubmission
} from './examAdminController.js';

const questions = [
  { id: 1, type: 'mc' },
  { id: 2, type: 'mc' },
  { id: 3, type: 'file' },
  { id: 4, type: 'file' }
];

test('firstPendingIndex: primera teórica sin responder', () => {
  assert.equal(firstPendingIndex(questions, { 1: 0 }, {}), 1);
});

test('firstPendingIndex: primera práctica sin archivo confirmado', () => {
  assert.equal(firstPendingIndex(questions, { 1: 0, 2: 1 }, { 3: 'a.dfd' }), 3);
});

test('firstPendingIndex: todo respondido abre en la última pregunta', () => {
  const uploaded = { 3: 'a.dfd', 4: 'b.dfd' };
  assert.equal(firstPendingIndex(questions, { 1: 0, 2: 1 }, uploaded), questions.length - 1);
});

test('normalizeFileName: quita acentos, mayúsculas y espacios extra', () => {
  assert.equal(normalizeFileName('  Árbol.DFD  '), 'arbol.dfd');
});

test('sameFileName: tolera nombres guardados como latin1', () => {
  assert.equal(
    sameFileName('Ejercicio número 1.dfd', 'Ejercicio nÃºmero 1.dfd'),
    true
  );
  assert.equal(sameFileName('a.dfd', 'b.dfd'), false);
});

test('findDfdSubmission: questionId tiene prioridad sobre el nombre', () => {
  const submissions = [
    { _id: 'nueva', questionId: 101, originalFileName: 'otro.dfd' },
    { _id: 'vieja', originalFileName: 'Ejercicio número 1.dfd' }
  ];
  assert.equal(findDfdSubmission(submissions, 101, 'Ejercicio nÃºmero 1.dfd')._id, 'nueva');
});

test('findDfdSubmission: entregas antiguas se cruzan por nombre tolerante', () => {
  const submissions = [
    { _id: 'vieja', originalFileName: 'Ejercicio nÃºmero 1.dfd' }
  ];
  assert.equal(findDfdSubmission(submissions, 101, 'Ejercicio número 1.dfd')._id, 'vieja');
});

test('findDfdSubmission: no acepta una entrega de otra pregunta', () => {
  const submissions = [
    { _id: 'otra', questionId: 102, originalFileName: 'a.dfd' }
  ];
  assert.equal(findDfdSubmission(submissions, 101, 'a.dfd'), null);
});
