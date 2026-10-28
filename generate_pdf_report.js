import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const studentsData = [
  {
    name: "Oscar Alexander Rodríguez Insuasti",
    email: "algo6@cinar.edu.co",
    username: "algo6",
    attempts: [
      { num: 1, score: 14, max: 20, scale5: "3.5", mc: "14/15", dfd: "Pendiente", date: "20/10/2026, 7:10 p. m." },
      { num: 2, score: 20, max: 20, scale5: "5.0", mc: "15/15", dfd: "5/5", date: "20/10/2026, 7:55 p. m." }
    ],
    finalScore: 20,
    finalScale5: "5.0",
    status: "Excelente (Desempeño Superior)",
    theoryFeedback: "Excelente dominio conceptual. En el intento 1 falló una sola pregunta sobre precedencia de operadores, la cual corrigió con éxito en el intento 2.",
    dfdExercises: [
      { id: 115, name: "Serie 1 al 10 (Ciclo Mientras)", file: "EjercicioOR-1.dfd", score: "1/1", status: "Aprobado", note: "Inicialización, condición `i <= 10` e incremento `i = i + 1` correctos." },
      { id: 117, name: "Tabla de multiplicar (Ciclo Mientras)", file: "EjercicioOR-3.dfd", score: "1/1", status: "Aprobado", note: "Lectura de N, iteración y salida formateada correctamente." },
      { id: 102, name: "Área y perímetro de círculo", file: "EjercicioOR-4.dfd", score: "1/1", status: "Aprobado", note: "Cálculo preciso con fórmulas de Pi * r^2 y 2 * Pi * r." },
      { id: 107, name: "Precio unitario y total compra", file: "EjercicioOR-5.dfd", score: "1/1", status: "Aprobado", note: "Lectura y cálculo del producto correctos." },
      { id: 118, name: "Suma hasta centinela 0", file: "EjercicioOR-2.dfd", score: "1/1", status: "Aprobado", note: "Control de ciclo con valor 0 y contador de positivos adecuado." }
    ],
    teacherRecommendations: "Dominio sobresaliente tanto de la teoría como de la implementación lógica en DFD. Continuar con este nivel para el estudio de funciones y arreglos en el Parcial 2."
  },
  {
    name: "Iván Felipe Guancha Galindres",
    email: "algo3@cinar.edu.co",
    username: "algo3",
    attempts: [
      { num: 1, score: 19, max: 20, scale5: "4.8", mc: "15/15", dfd: "4/5", date: "20/10/2026, 8:28 p. m." }
    ],
    finalScore: 19,
    finalScale5: "4.8",
    status: "Sobresaliente",
    theoryFeedback: "Puntaje perfecto en la parte teórica (15/15). Dominio completo de secuenciales, condicionales simples y compuestos, y ciclos.",
    dfdExercises: [
      { id: 113, name: "Par o Impar (Operador Mod)", file: "nuevo (3).dfd", score: "1/1", status: "Aprobado", note: "Uso correcto de `n mod 2 = 0` y ramas condicionales." },
      { id: 114, name: "Ambos números positivos (Operador Y)", file: "nuevo (4).dfd", score: "0/1", status: "No aprobado", note: "La condición lógica `(n1 > 0) Y (n2 > 0)` fue correcta, pero el texto del mensaje alternativo decía 'Al menos uno es positivo' en vez de 'Al menos uno no es positivo'." },
      { id: 106, name: "Descuento del 15% en compra", file: "nuevo (5).dfd", score: "1/1", status: "Aprobado", note: "Cálculo matemático y descuento aplicado con precisión." },
      { id: 105, name: "Promedio de 3 calificaciones", file: "nuevo (6).dfd", score: "1/1", status: "Aprobado", note: "Uso adecuado de paréntesis `(c1+c2+c3)/3`." },
      { id: 119, name: "Serie de Fibonacci (N términos)", file: "nuevo (7).dfd", score: "1/1", status: "Aprobado", note: "Manejo impecable de variables auxiliares para la sucesión." }
    ],
    teacherRecommendations: "Gran rigor en la resolución de problemas lógicos. Únicamente prestar atención a los textos exactos solicitados en enunciados para no perder puntos de formato."
  },
  {
    name: "Johan Sebastian Rodríguez Rosero",
    email: "algo8@cinar.edu.co",
    username: "algo8",
    attempts: [
      { num: 1, score: 19, max: 20, scale5: "4.8", mc: "15/15", dfd: "4/5", date: "24/10/2026, 2:54 p. m." },
      { num: 2, score: 19, max: 20, scale5: "4.8", mc: "15/15", dfd: "4/5", date: "24/10/2026, 4:50 p. m." }
    ],
    finalScore: 19,
    finalScale5: "4.8",
    status: "Sobresaliente",
    theoryFeedback: "15/15 en ambos intentos. Conoce a cabalidad los operadores relacionales, lógica booleana y la arquitectura de ciclos.",
    dfdExercises: [
      { id: 120, name: "Factorial con ciclo", file: "factorial.dfd", score: "1/1", status: "Aprobado", note: "Estructura cíclica con acumulador multiplicativo `fac = fac * i` impecable." },
      { id: 108, name: "Número positivo, negativo o cero", file: "_o_.dfd", score: "1/1", status: "Aprobado", note: "Anidamiento condicional doble correctamente implementado." },
      { id: 106, name: "Descuento 15%", file: "descuento.dfd", score: "1/1", status: "Aprobado", note: "Fórmula de resta de porcentaje directa y limpia." },
      { id: 102, name: "Área y perímetro círculo", file: "radio.dfd", score: "1/1", status: "Aprobado", note: "Cálculos geométricos exactos." },
      { id: 109, name: "Mayor de dos números", file: "mayor.dfd", score: "0/1", status: "No aprobado", note: "En el intento 2 evaluó `n1 mod 2` en vez de comparar `n1 > n2` directamente." }
    ],
    teacherRecommendations: "Excelente trabajo y perseverancia en ambos intentos. Revisar la formulación de condiciones de comparación directa vs operador residuo."
  },
  {
    name: "Claudia Verónica Angulo",
    email: "algo1@cinar.edu.co",
    username: "algo1",
    attempts: [
      { num: 1, score: 18, max: 20, scale5: "4.5", mc: "14/15", dfd: "4/5", date: "25/10/2026, 11:20 a. m." }
    ],
    finalScore: 18,
    finalScale5: "4.5",
    status: "Alto",
    theoryFeedback: "14/15 en teoría. Tuvo una única duda conceptual en el ciclo Para (For) y su condición de conteo predeterminado.",
    dfdExercises: [
      { id: 117, name: "Tabla de multiplicar de N", file: "nuevo.dfd", score: "1/1", status: "Aprobado", note: "Ciclo de 1 a 10 con salida concatenada clara." },
      { id: 116, name: "Suma de 1 a N con ciclo", file: "nuevo (2).dfd", score: "1/1", status: "Aprobado", note: "Acumulador `suma = suma + i` e incremento de índice bien estructurados." },
      { id: 105, name: "Promedio de calificaciones", file: "nuevo (4).dfd", score: "1/1", status: "Aprobado", note: "Lectura de notas y división con precedencia correcta." },
      { id: 107, name: "Precio unitario y total", file: "nuevo (3).dfd", score: "1/1", status: "Aprobado", note: "Cálculo aritmético secuencial correcto." },
      { id: 113, name: "Número par o impar", file: "nuevo.dfd (duplicado)", score: "0/1", status: "No aprobado", note: "Subió un archivo repetido y no incluyó la solución para par/impar." }
    ],
    teacherRecommendations: "Muy buen desempeño en algoritmos repetitivos y secuenciales. Asegurarse de verificar los nombres de los archivos antes de confirmar el envío en plataforma."
  },
  {
    name: "Brayan Buesaquillo",
    email: "algo12@cinar.edu.co",
    username: "algo12",
    attempts: [
      { num: 1, score: 18, max: 20, scale5: "4.5", mc: "15/15", dfd: "3/5", date: "25/10/2026, 12:00 m." }
    ],
    finalScore: 18,
    finalScale5: "4.5",
    status: "Alto",
    theoryFeedback: "15/15 perfecto en preguntas teóricas, demostrando sólida base en conceptos fundamentales de lógica computacional.",
    dfdExercises: [
      { id: 116, name: "Suma de 1 a N", file: "nuevo (1).dfd", score: "1/1", status: "Aprobado", note: "Ciclo sumatorio funcional y bien controlado." },
      { id: 103, name: "Celsius a Fahrenheit", file: "nuevo (2).dfd", score: "1/1", status: "Aprobado", note: "Aplicación correcta de la ecuación termométrica." },
      { id: 104, name: "Cálculo de salario por horas", file: "nuevo (4).dfd", score: "1/1", status: "Aprobado", note: "Entrada de horas, tarifa horaria y producto final correctos." },
      { id: 112, name: "Descuento 10% si compra > 100k", file: "nuevo.dfd", score: "0/1", status: "No aprobado", note: "Lógica bien pensada, pero nombró una variable con espacios o caracteres no permitidos en DFD." },
      { id: 115, name: "Serie del 1 al 10", file: "nuevo (3).dfd", score: "0/1", status: "No aprobado", note: "Ubicó la figura de Salida (Escribir) después del cierre del ciclo en vez de adentro, mostrando solo el valor final 11." }
    ],
    teacherRecommendations: "Excelente comprensión general. Recordar que las instrucciones que deben repetirse (como imprimir cada elemento de una serie) deben estar dentro del cuerpo del ciclo."
  },
  {
    name: "David Santiago Erazo Moncayo",
    email: "algo11@cinar.edu.co",
    username: "algo11",
    attempts: [
      { num: 1, score: 17, max: 20, scale5: "4.3", mc: "15/15", dfd: "2/5", date: "26/10/2026, 1:56 p. m." }
    ],
    finalScore: 17,
    finalScale5: "4.3",
    status: "Alto",
    theoryFeedback: "Puntaje máximo de 15/15 en preguntas teóricas. Respondió acertadamente sobre diagramas de flujo, switch/case, ciclos y precedencia.",
    dfdExercises: [
      { id: 103, name: "Conversión de Celsius a Fahrenheit", file: "nuevo (3).dfd", score: "1/1", status: "Aprobado", note: "Fórmula `F = C * 1.8 + 32` y salida de `F` impecables." },
      { id: 107, name: "Precio unitario y cantidad comprada", file: "nuevo (4).dfd", score: "1/1", status: "Aprobado", note: "Lectura de precio y cantidad, producto almacenado en `total` y salida correcta." },
      { id: 112, name: "Descuento 10% si compra > 100.000", file: "nuevo (1).dfd", score: "0/1", status: "No aprobado", note: "Calculó bien `descuento` y `total`, pero en el nodo de salida escribió `'mostrartotal: ', x` (variable `x` no definida). Además, la rama falsa no imprime el total sin descuento." },
      { id: 120, name: "Factorial de N usando ciclo", file: "nuevo (2).dfd", score: "0/1", status: "No aprobado", note: "Usó una figura de decisión simple `Si (i <= N)` en vez de un bucle `Mientras` o `Para`, por lo que no itera. Además mandó a imprimir `x` indefinida." },
      { id: 118, name: "Suma hasta centinela 0", file: "nuevo.dfd", score: "0/1", status: "No aprobado", note: "Subió un archivo que calcula promedio de 3 notas de un taller previo en lugar del problema solicitado." }
    ],
    teacherRecommendations: "Muy buena capacidad de análisis secuencial y teórico. Reforzar el uso de estructuras iterativas (bucles) y verificar siempre que las variables impresas coincidan con las calculadas."
  },
  {
    name: "Juan Carlos Bastidas Montilla",
    email: "algo7@cinar.edu.co",
    username: "algo7",
    attempts: [
      { num: 1, score: 10, max: 20, scale5: "2.5", mc: "9/15", dfd: "1/5", date: "20/10/2026, 8:09 p. m." },
      { num: 2, score: 16, max: 20, scale5: "4.0", mc: "14/15", dfd: "2/5", date: "25/10/2026, 11:05 p. m." }
    ],
    finalScore: 16,
    finalScale5: "4.0",
    status: "Aprobado (Notable mejoría)",
    theoryFeedback: "Gran progreso entre intentos: pasó de 9/15 a 14/15 en teoría, afianzando la jerarquía de operadores y condicionales.",
    dfdExercises: [
      { id: 120, name: "Factorial con ciclo Mientras", file: "nuevofac.dfd", score: "1/1", status: "Aprobado", note: "En el intento 2 logró la estructura de acumulación multiplicativa correcta." },
      { id: 113, name: "Par o Impar con mod", file: "N2-Problema 12.dfd", score: "1/1", status: "Aprobado", note: "Cálculo del residuo y bifurcación lógica adecuada." },
      { id: 112, name: "Descuento 10% en compras", file: "N2-Problema 12.dfd", score: "0/1", status: "No aprobado", note: "Los valores límite configurados en la decisión no correspondieron al umbral de $100.000." },
      { id: 105, name: "Promedio de notas", file: "nuevopromedio.dfd", score: "0/1", status: "No aprobado", note: "Falta de paréntesis en la suma antes de la división (`n1+n2+n3/3`)." },
      { id: 110, name: "Mayor de edad", file: "nuevoedad.dfd", score: "0/1", status: "No aprobado", note: "Condición invertida en la evaluación de `>= 18`." }
    ],
    teacherRecommendations: "Felicitaciones por aprovechar el segundo intento para superar la materia. Recordar siempre la regla de oro: la división tiene mayor prioridad que la suma, por lo que siempre se deben agrupar los sumandos entre paréntesis."
  },
  {
    name: "Andrés Felipe Mena Oviedo",
    email: "algo4@cinar.edu.co",
    username: "algo4",
    attempts: [
      { num: 1, score: 15, max: 20, scale5: "3.8", mc: "15/15", dfd: "0/5", date: "23/10/2026, 11:26 a. m." }
    ],
    finalScore: 15,
    finalScale5: "3.8",
    status: "Aprobado",
    theoryFeedback: "15/15 perfecto en la parte teórica. Comprensión conceptual intachable de las tres unidades evaluadas.",
    dfdExercises: [
      { id: 119, name: "Serie de Fibonacci", file: "algoritmoresultados.dfd", score: "0/1", status: "No aprobado", note: "Subió un archivo genérico de operaciones básicas en vez de generar la secuencia de Fibonacci." },
      { id: 111, name: "Aprobación de estudiante", file: "Algoritmo número N.dfd", score: "0/1", status: "No aprobado", note: "El archivo subido no contiene la condición de aprobación (`nota >= 3.0`)." },
      { id: 115, name: "Serie del 1 al 10", file: "preciount.cantund.dfd", score: "0/1", status: "No aprobado", note: "Subió un algoritmo de cálculo de precio en lugar del bucle del 1 al 10." },
      { id: 107, name: "Precio y cantidad", file: "calculosalario.dfd", score: "0/1", status: "No aprobado", note: "Subió un archivo de nómina de salario sin salida configurada." },
      { id: 110, name: "Mayor de edad", file: "numeroparoimpar.dfd", score: "0/1", status: "No aprobado", note: "Subió un algoritmo de par/impar en lugar de evaluar la edad." }
    ],
    teacherRecommendations: "La teoría demuestra que posee el conocimiento. El problema radicó en el desorden al guardar y adjuntar los archivos en el formulario, subiendo archivos cruzados. En el Parcial 2 debe nombrar cada archivo claramente antes de subirlo."
  },
  {
    name: "David Felipe Narváez",
    email: "algo10@cinar.edu.co",
    username: "algo10",
    attempts: [
      { num: 1, score: 5, max: 20, scale5: "1.3", mc: "5/15", dfd: "0/5", date: "20/10/2026, 8:06 p. m." },
      { num: 2, score: 15, max: 20, scale5: "3.8", mc: "15/15", dfd: "0/5", date: "23/10/2026, 11:01 a. m." }
    ],
    finalScore: 15,
    finalScale5: "3.8",
    status: "Aprobado (Gran esfuerzo)",
    theoryFeedback: "Destacable recuperación teórica: en el segundo intento logró 15/15 en preguntas conceptuales tras un primer intento bajo.",
    dfdExercises: [
      { id: 118, name: "Suma hasta centinela 0", file: "nuevo.dfd", score: "0/1", status: "No aprobado", note: "No se implementó el bucle centinela ni la condición de parada." },
      { id: 113, name: "Par o Impar", file: "nuevo.dfd", score: "0/1", status: "No aprobado", note: "Archivo con asignaciones fijas sin estructura de decisión ni lectura." },
      { id: 105, name: "Promedio de 3 notas", file: "nuevo (2).dfd", score: "0/1", status: "No aprobado", note: "Resultado hardcodeado en la salida sin lectura de datos por teclado." },
      { id: 114, name: "Ambos positivos", file: "nuevo (3).dfd", score: "0/1", status: "No aprobado", note: "No se utilizó el operador lógico Y para enlazar ambas condiciones." },
      { id: 102, name: "Área y perímetro círculo", file: "nuevo (4).dfd", score: "0/1", status: "No aprobado", note: "Fórmulas incompletas sin cálculo de radio al cuadrado." }
    ],
    teacherRecommendations: "Gran demostración de compromiso al estudiar la teoría para el intento 2. Para los talleres prácticos, practicar la construcción paso a paso en el software DFD sin apresurarse a colocar valores fijos."
  },
  {
    name: "Jairo Granja Bravo",
    email: "algo5@cinar.edu.co",
    username: "algo5",
    attempts: [
      { num: 1, score: 10, max: 20, scale5: "2.5", mc: "10/15", dfd: "Pendiente", date: "20/10/2026, 10:26 p. m." },
      { num: 2, score: 14, max: 20, scale5: "3.5", mc: "12/15", dfd: "2/5", date: "25/10/2026, 7:50 p. m." }
    ],
    finalScore: 14,
    finalScale5: "3.5",
    status: "Aprobado",
    theoryFeedback: "12/15 en teoría en el segundo intento. Buenos conceptos en secuenciales y condicionales.",
    dfdExercises: [
      { id: 104, name: "Salario por horas trabajadas", file: "nuevo (4).dfd", score: "1/1", status: "Aprobado", note: "Lectura y cálculo de nómina básica correcto." },
      { id: 101, name: "Operaciones aritméticas básicas", file: "nuevo (5).dfd", score: "1/1", status: "Aprobado", note: "Suma, resta, multiplicación y división bien implementadas." },
      { id: 112, name: "Descuento 10% en compras", file: "nuevo (6).dfd", score: "0/1", status: "No aprobado", note: "No aplicó la resta del descuento al valor de la compra." },
      { id: 116, name: "Suma de 1 a N con ciclo", file: "nuevo (7).dfd", score: "0/1", status: "No aprobado", note: "Faltó la instrucción de incremento del contador, generando ciclo potencial infinito." },
      { id: 119, name: "Serie de Fibonacci", file: "nuevo (8).dfd", score: "0/1", status: "No aprobado", note: "Lógica de intercambio de variables a y b incompleta." }
    ],
    teacherRecommendations: "Aprobado satisfactoriamente. Practicar con especial énfasis en el control de ciclos: recordar que todo ciclo necesita inicialización, condición y actualización obligatoria."
  },
  {
    name: "Julián David Reina Cabrera",
    email: "jd.reina@cinar.edu.co",
    username: "JDRC13@LgC26",
    attempts: [
      { num: 1, score: 14, max: 20, scale5: "3.5", mc: "12/15", dfd: "2/5", date: "26/10/2026, 5:05 p. m." }
    ],
    finalScore: 14,
    finalScale5: "3.5",
    status: "Aprobado (Desempeño Medio)",
    theoryFeedback: "12/15 en teoría (80%). Identifica bien las fases de un algoritmo, estructuras de control y tipos de datos.",
    dfdExercises: [
      { id: 104, name: "Salario por horas trabajadas", file: "nuevo.dfd", score: "1/1", status: "Aprobado (Ajuste Docente)", note: "Reconocimiento pedagógico a la formulación de variables de entrada y cálculo de salario." },
      { id: 101, name: "Operaciones aritméticas básicas", file: "nuevo (2).dfd", score: "1/1", status: "Aprobado (Ajuste Docente)", note: "Reconocimiento pedagógico a la estructura de las cuatro operaciones aritméticas elementales." },
      { id: 112, name: "Descuento en compras", file: "nuevo (1).dfd", score: "0/1", status: "No aprobado", note: "Escribió `1compra es> 10000` en la condición, lo cual genera error léxico en DFD." },
      { id: 118, name: "Suma hasta 0", file: "nuevo (3).dfd", score: "0/1", status: "No aprobado", note: "Algoritmo incompleto, con condición invertida y salida de variable inexistente `x`." },
      { id: 116, name: "Suma de 1 a N", file: "No subido", score: "0/1", status: "No aprobado", note: "No subió archivo para esta pregunta." }
    ],
    teacherRecommendations: "Nota final consolidada en 14/20 (3.5/5.0) con asignación de 2 puntos en DFD por parte del docente. Para el Parcial 2, es imperativo corregir la nomenclatura de variables en DFD (sin dos puntos ni números al inicio) y afianzar la lógica de bucles repetitivos."
  }
];

const generalQuestionsFeedback = [
  {
    id: 1,
    tema: "Nivel 1 — Secuenciales",
    title: "Cálculo del promedio de 3 calificaciones",
    question: "Para calcular el promedio de 3 calificaciones (c1, c2, c3), ¿cuál es la expresión correcta?",
    correctAnswer: "(c1 + c2 + c3) / 3",
    commonError: "c1 + c2 + c3 / 3",
    explanation: "Por jerarquía de operadores, la división (`/`) tiene mayor precedencia que la suma (`+`). Si no se utilizan paréntesis, la computadora primero divide `c3 / 3` y luego le suma `c1` y `c2`, arrojando un resultado matemático totalmente incorrecto. Los paréntesis obligan a que la sumatoria se resuelva en primer lugar.",
    tip: "Regla mnemotécnica: siempre que debas promediar o calcular porcentajes compuestos, encierra toda la suma entre paréntesis antes de dividir."
  },
  {
    id: 3,
    tema: "Nivel 1 — Secuenciales",
    title: "Conversión de tiempo (H, M, S) a segundos totales",
    question: "Para calcular la cantidad de segundos totales dado un tiempo en horas (H), minutos (M) y segundos (S), ¿cómo se formula?",
    correctAnswer: "(H * 60 * 60) + (M * 60) + S",
    commonError: "(H + M + S) * 60  o  H * 60 + M * 60 + S",
    explanation: "Una hora tiene 60 minutos y cada minuto tiene 60 segundos (es decir, 1 hora = 3600 segundos). Un minuto equivale a 60 segundos. Por lo tanto, los segundos totales corresponden a multiplicar las horas por 3600 (`H * 60 * 60`), los minutos por 60 (`M * 60`) y sumarle directamente los segundos restantes `S` sin multiplicar.",
    tip: "Recuerda las equivalencias directas: 1h = 3600s, 1min = 60s."
  },
  {
    id: 4,
    tema: "Nivel 1 — Operadores",
    title: "Jerarquía de operadores aritméticos: 8 + 4 * 2",
    question: "¿Cuál es el resultado de la expresión 8 + 4 * 2, siguiendo la jerarquía de operadores?",
    correctAnswer: "16",
    commonError: "24",
    explanation: "La multiplicación (`*`) se ejecuta antes que la suma (`+`). Primero se resuelve `4 * 2 = 8`, y posteriormente se suma `8 + 8 = 16`. Quienes respondieron 24 realizaron la suma primero (`8 + 4 = 12`) y luego multiplicaron por 2 (`12 * 2 = 24`), lo cual viola la precedencia estándar de las matemáticas y la programación.",
    tip: "Orden de operaciones: 1) Paréntesis, 2) Potencias/Raíces, 3) Multiplicación/División/Módulo, 4) Suma/Resta."
  },
  {
    id: 8,
    tema: "Nivel 1 — Diagramas de Flujo",
    title: "Simbología DFD: Lectura / Entrada de datos",
    question: "¿Qué figura del diagrama de flujo representa la entrada y salida de datos (o específicamente Lectura en DFD)?",
    correctAnswer: "El paralelogramo (trapecio en DFD para lectura)",
    commonError: "El rectángulo (Asignación/Proceso)",
    explanation: "El rectángulo en la notación de diagramas de flujo y en DFD se reserva exclusivamente para asignaciones, operaciones aritméticas o procesos internos (ej: `suma = a + b`). Para interactuar con el usuario solicitando datos por teclado se utiliza la figura de Entrada/Lectura.",
    tip: "Rectángulo = Proceso interno. Trapecio/Paralelogramo = Entrada de datos. Cono/Óvalo = Salida a pantalla."
  },
  {
    id: 25,
    tema: "Nivel 2 — Condicionales",
    title: "Operador lógico Y (AND) en condiciones compuestas",
    question: "Al utilizar una estructura condicional con el operador Y (AND), si la primera condición es Verdadera y la segunda es Falsa, ¿qué camino toma el flujo?",
    correctAnswer: "El camino de Falso (No), porque ambas condiciones deben ser obligatoriamente verdaderas.",
    commonError: "El camino de Verdadero.",
    explanation: "La tabla de verdad del operador lógico Y (AND / conjunción) estipula que el resultado global es Verdadero ÚNICAMENTE si TODAS las condiciones individuales son verdaderas. Basta con que una sola de las condiciones sea Falsa para que toda la expresión resulte Falsa.",
    tip: "Operador Y: exige que TODO se cumpla. Operador O: se conforma con que AL MENOS UNO se cumpla."
  },
  {
    id: 38,
    tema: "Nivel 3 — Ciclos",
    title: "Diferencia crucial entre Contador y Acumulador",
    question: "En un ciclo, ¿qué es un contador y cómo se diferencia de un acumulador?",
    correctAnswer: "Una variable que se incrementa o decrementa en un valor CONSTANTE (ej: c = c + 1).",
    commonError: "Una variable que acumula sumas de valores variables.",
    explanation: "Un **contador** aumenta en saltos fijos y predecibles (generalmente de 1 en 1, como `i = i + 1`) para llevar la cuenta de repeticiones. Por el contrario, un **acumulador** o totalizador suma valores variables ingresados por el usuario o calculados en cada vuelta (ej: `suma = suma + valorLeido`).",
    tip: "Contador: cuenta vueltas (`c = c + 1`). Acumulador: acumula cantidades (`total = total + precio`)."
  },
  {
    id: 40,
    tema: "Nivel 3 — Ciclos",
    title: "Condición de ciclo Mientras para repetir exactamente 10 veces",
    question: "Si el contador i inicia en 1, ¿cuál condición del ciclo Mientras garantiza exactamente 10 vueltas?",
    correctAnswer: "Mientras i <= 10",
    commonError: "Mientras i < 10  o  Mientras i = 10",
    explanation: "Si se inicia en `i = 1`, la condición `i < 10` se detendrá cuando `i` llegue a 10, ejecutando solamente 9 veces (del 1 al 9). Para incluir la décima vuelta, debe utilizarse el operador relacional menor o igual (`<= 10`). Por otra parte, `i = 10` no entraría al ciclo porque al inicio `i` vale 1.",
    tip: "Siempre verifica los extremos: para 1..N usa `<= N`. Si inicias en 0..N-1 usa `< N`."
  }
];

const dfdSolucionario = [
  {
    id: "101 al 107 (Nivel 1)",
    title: "Patrón de Diseño para Algoritmos Secuenciales",
    description: "Cálculo de salarios, áreas, promedios, conversiones y totales de venta.",
    badPractices: [
      "Escribir valores fijos en las operaciones (ej: `suma = 3 + 5`) en lugar de usar variables.",
      "Nombrar variables con espacios, dos puntos o caracteres especiales (ej: `leer:horas`, `1compra`).",
      "Dividir antes de sumar por falta de paréntesis en promedios."
    ],
    pseudocode: `Algoritmo Secuencial_Correcto
  Inicio
    // 1. Entrada de datos limpios
    Leer precioUnitario, cantidad
    // 2. Procesamiento aritmético
    subtotal <- precioUnitario * cantidad
    descuento <- subtotal * 0.15
    totalPagar <- subtotal - descuento
    // 3. Salida clara al usuario
    Escribir "El total a pagar es: ", totalPagar
  Fin`
  },
  {
    id: "108 al 114 (Nivel 2)",
    title: "Patrón de Diseño para Algoritmos Condicionales",
    description: "Evaluación de descuentos > $100.000, par/impar, mayor de edad y números positivos.",
    badPractices: [
      "No proporcionar salida en la rama 'No / Falso' (dejar al usuario sin respuesta cuando no aplica el descuento).",
      "Imprimir variables no declaradas o usar nombres temporales genéricos como 'x'.",
      "Sintaxis errónea en la condición de DFD (ej: `compra es > 10000` en vez de `compra > 100000`)."
    ],
    pseudocode: `Algoritmo Condicional_Correcto (Ej: Descuento Compra)
  Inicio
    Leer valorCompra
    Si (valorCompra > 100000) Entonces
      descuento <- valorCompra * 0.10
      totalPagar <- valorCompra - descuento
      Escribir "Aplica descuento 10%. Total a pagar: $", totalPagar
    Sino
      totalPagar <- valorCompra
      Escribir "No aplica descuento. Total a pagar: $", totalPagar
    FinSi
  Fin`
  },
  {
    id: "115 al 120 (Nivel 3)",
    title: "Patrón de Diseño para Algoritmos Cíclicos (Bucles)",
    description: "Series numéricas, factoriales, tablas de multiplicar y bucles centinela con parada en 0.",
    badPractices: [
      "Utilizar un rombo de decisión simple `Si` esperando que se repita automáticamente sin bucle.",
      "Olvidar el incremento del contador (`i = i + 1`), creando ciclos infinitos que congelan el software.",
      "Colocar la instrucción de salida (Escribir) fuera del ciclo cuando se pide imprimir cada elemento de la serie."
    ],
    pseudocode: `Algoritmo Factorial_Con_Ciclo (N >= 0)
  Inicio
    Leer N
    factorial <- 1
    i <- 1
    Mientras (i <= N) Hacer
      factorial <- factorial * i
      i <- i + 1   // Incremento obligatorio para evitar ciclo infinito
    FinMientras
    Escribir "El factorial de ", N, " es: ", factorial
  Fin

Algoritmo Centinela_Hasta_Cero
  Inicio
    suma <- 0
    mayoresCero <- 0
    Leer num
    Mientras (num <> 0) Hacer
      suma <- suma + num
      Si (num > 0) Entonces
        mayoresCero <- mayoresCero + 1
      FinSi
      Leer num   // Lectura del siguiente número para avanzar el centinela
    FinMientras
    Escribir "Suma total: ", suma
    Escribir "Cantidad de números mayores que cero: ", mayoresCero
  Fin`
  }
];

function buildHtml() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Informe de Resultados y Retroalimentación Pedagógica — Parcial 1 Algoritmos</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap');

    @page {
      size: A4 portrait;
      margin: 12mm 10mm 14mm 10mm;
      @bottom-right {
        content: "Página " counter(page) " de " counter(pages);
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        color: #64748b;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0f172a;
      background-color: #ffffff;
      font-size: 9pt;
      line-height: 1.45;
    }

    .page-break {
      page-break-before: always;
    }

    .no-break {
      page-break-inside: avoid;
    }

    /* HEADER BANNER */
    .header-banner {
      background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%);
      color: white;
      padding: 22px 24px;
      border-radius: 8px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .header-titles h1 {
      font-size: 17pt;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 4px;
      color: #ffffff;
    }

    .header-titles h2 {
      font-size: 11pt;
      font-weight: 500;
      color: #bfdbfe;
      margin-bottom: 6px;
    }

    .header-meta {
      font-size: 8pt;
      color: #93c5fd;
      display: flex;
      gap: 14px;
    }

    .header-meta span strong {
      color: #ffffff;
    }

    .header-badge {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 10px 16px;
      border-radius: 8px;
      text-align: right;
    }

    .header-badge .term {
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #dbeafe;
    }

    .header-badge .val {
      font-size: 15pt;
      font-weight: 800;
      color: #ffffff;
    }

    /* STATS SUMMARY TILES */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      text-align: center;
    }

    .stat-card .label {
      font-size: 7.5pt;
      text-transform: uppercase;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 4px;
    }

    .stat-card .number {
      font-size: 16pt;
      font-weight: 800;
      color: #1e3a8a;
    }

    .stat-card .desc {
      font-size: 7pt;
      color: #94a3b8;
    }

    /* SECTION TITLES */
    .section-title {
      font-size: 12.5pt;
      font-weight: 700;
      color: #1e3a8a;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 22px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-title::before {
      content: "";
      display: inline-block;
      width: 5px;
      height: 15px;
      background: #2563eb;
      border-radius: 2px;
    }

    /* TABLES */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 8.5pt;
    }

    th {
      background: #1e293b;
      color: #ffffff;
      text-align: left;
      padding: 7px 9px;
      font-weight: 600;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    th.center, td.center {
      text-align: center;
    }

    th.right, td.right {
      text-align: right;
    }

    td {
      padding: 6px 9px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: middle;
    }

    tr:nth-child(even) td {
      background-color: #f8fafc;
    }

    /* BADGES */
    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 7.5pt;
      text-align: center;
    }

    .badge-success {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }

    .badge-primary {
      background: #dbeafe;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }

    .badge-warning {
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #fde68a;
    }

    .badge-danger {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }

    /* CALLOUT BOXES */
    .callout {
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 12px;
      font-size: 8.5pt;
    }

    .callout-info {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      color: #1e40af;
    }

    .callout-warning {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      color: #92400e;
    }

    .callout-success {
      background: #f0fdf4;
      border-left: 4px solid #22c55e;
      color: #166534;
    }

    /* QUESTION CORRECTION CARDS */
    .q-card {
      border: 1px solid #e2e8f0;
      background: #ffffff;
      border-radius: 6px;
      padding: 12px 14px;
      margin-bottom: 12px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }

    .q-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 4px;
    }

    .q-card-title {
      font-weight: 700;
      font-size: 9pt;
      color: #1e3a8a;
    }

    .q-text {
      font-weight: 600;
      color: #334155;
      margin-bottom: 6px;
    }

    .q-answers-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 8px;
    }

    .q-ans-box {
      padding: 6px 10px;
      border-radius: 4px;
      font-size: 8pt;
    }

    .q-ans-correct {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
    }

    .q-ans-wrong {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }

    .q-explanation {
      font-size: 8pt;
      color: #475569;
      background: #f8fafc;
      padding: 8px 10px;
      border-radius: 4px;
      border-left: 3px solid #64748b;
      margin-top: 4px;
    }

    /* CODE BLOCKS */
    pre code {
      font-family: 'Fira Code', monospace;
      font-size: 7.5pt;
      background: #0f172a;
      color: #e2e8f0;
      display: block;
      padding: 10px 12px;
      border-radius: 6px;
      overflow-x: hidden;
      line-height: 1.35;
      margin: 6px 0;
      white-space: pre-wrap;
    }

    /* STUDENT RETRO CARD */
    .student-card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      margin-bottom: 16px;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      overflow: hidden;
      page-break-inside: avoid;
    }

    .student-card-header {
      background: #f1f5f9;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
    }

    .student-card-name {
      font-size: 10.5pt;
      font-weight: 700;
      color: #0f172a;
    }

    .student-card-email {
      font-size: 8pt;
      color: #64748b;
    }

    .student-card-score {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .student-card-body {
      padding: 12px 14px;
    }

    .student-subgrid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
      margin-bottom: 8px;
    }

    .teacher-note {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 8px 10px;
      border-radius: 6px;
      font-size: 8pt;
      color: #166534;
      margin-top: 8px;
    }

    .teacher-note strong {
      color: #14532d;
    }

    ul.dfd-mini-list {
      list-style-type: none;
      font-size: 8pt;
      margin-top: 6px;
    }

    ul.dfd-mini-list li {
      padding: 4px 0;
      border-bottom: 1px dashed #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    ul.dfd-mini-list li:last-child {
      border-bottom: none;
    }

    .footer {
      text-align: center;
      font-size: 7.5pt;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      margin-top: 20px;
    }
  </style>
</head>
<body>

  <!-- ==================== PÁGINA 1: RESUMEN Y LISTADO ==================== -->
  <div class="header-banner">
    <div class="header-titles">
      <h1>Informe General de Resultados y Retroalimentación</h1>
      <h2>Parcial 1 — Algoritmos y Lógica de Programación</h2>
      <div class="header-meta">
        <span>Materia: <strong>Algoritmos</strong></span>
        <span>Periodo Académico: <strong>2026-3</strong></span>
        <span>Docente / Evaluador: <strong>CINAR</strong></span>
        <span>Fecha de Cierre: <strong>28/10/2026</strong></span>
      </div>
    </div>
    <div class="header-badge">
      <div class="term">Promedio General</div>
      <div class="val">16.8 / 20</div>
      <div class="term" style="margin-top: 2px;">(4.2 / 5.0)</div>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="label">Estudiantes Evaluados</div>
      <div class="number">11</div>
      <div class="desc">100% de la cohorte activa</div>
    </div>
    <div class="stat-card">
      <div class="label">Intentos Realizados</div>
      <div class="number">16</div>
      <div class="desc">5 alumnos usaron 2 intentos</div>
    </div>
    <div class="stat-card">
      <div class="label">Tasa de Aprobación</div>
      <div class="number">100%</div>
      <div class="desc">Todos con nota ≥ 3.0 (12/20)</div>
    </div>
    <div class="stat-card">
      <div class="label">Nota Máxima Obtenida</div>
      <div class="number">20 / 20</div>
      <div class="desc">5.0 / 5.0 (Desempeño Superior)</div>
    </div>
  </div>

  <div class="callout callout-info">
    <strong>Propósito Pedagógico del Informe:</strong> Este documento consolida las calificaciones definitivas del <strong>Parcial 1 de Algoritmos</strong>, analizando en profundidad los aciertos y las dificultades observadas tanto en los componentes teóricos (preguntas de opción múltiple) como en los ejercicios prácticos de diseño de diagramas de flujo (.dfd). Su fin es servir como herramienta de retroalimentación formativa y guía de estudio de cara al Parcial 2.
  </div>

  <div class="section-title">1. Listado Consolidado de Calificaciones Definitivas</div>
  <table>
    <thead>
      <tr>
        <th style="width: 4%;">#</th>
        <th style="width: 28%;">Estudiante</th>
        <th style="width: 20%;">Correo Institucional</th>
        <th class="center" style="width: 9%;">Intentos</th>
        <th class="center" style="width: 11%;">Teoría (15)</th>
        <th class="center" style="width: 10%;">DFD (5)</th>
        <th class="center" style="width: 9%;">Escala 20</th>
        <th class="center" style="width: 9%;">Escala 5.0</th>
      </tr>
    </thead>
    <tbody>
      ${studentsData
        .sort((a, b) => b.finalScore - a.finalScore)
        .map((s, idx) => {
          const latestAttempt = s.attempts[s.attempts.length - 1];
          const badgeClass = s.finalScore >= 18 ? 'badge-success' : s.finalScore >= 15 ? 'badge-primary' : 'badge-warning';
          return `
          <tr>
            <td class="center" style="font-weight: 700;">${idx + 1}</td>
            <td><strong>${s.name}</strong></td>
            <td style="color: #64748b;">${s.email}</td>
            <td class="center">${s.attempts.length}</td>
            <td class="center">${latestAttempt.mc}</td>
            <td class="center">${latestAttempt.dfd}</td>
            <td class="center"><span class="badge ${badgeClass}">${s.finalScore} / 20</span></td>
            <td class="center"><strong>${s.finalScale5}</strong></td>
          </tr>
          `;
        }).join('')}
    </tbody>
  </table>

  <div class="callout callout-success">
    <strong>Balance Cualitativo del Grupo:</strong>
    <ul style="margin-left: 16px; margin-top: 4px;">
      <li><strong>Nivel Alto / Superior (17 a 20 / 20 · 4.3 a 5.0):</strong> 6 estudiantes (54.5%). Destacan por su capacidad para modelar problemas en DFD y articular bucles y acumuladores.</li>
      <li><strong>Nivel Medio / Aprobado (14 a 16 / 20 · 3.5 a 4.0):</strong> 5 estudiantes (45.5%). Poseen una base teórica sobresaliente (12 a 15 puntos) con destrezas intermedias en la resolución de problemas lógicos.</li>
      <li><strong>Nivel Básico (&lt; 14 / 20):</strong> 0 estudiantes (0%). Ningún estudiante quedó en rango inferior a 3.5.</li>
    </ul>
  </div>

  <!-- ==================== PÁGINA 2: BANCO DE CORRECCIÓN TEÓRICA ==================== -->
  <div class="page-break"></div>
  <div class="section-title">2. Banco de Corrección y Retroalimentación de Preguntas Teóricas</div>
  <p style="margin-bottom: 12px; font-size: 8.5pt; color: #475569;">
    A continuación se exponen las preguntas conceptuales donde se detectó mayor índice de error en los intentos de evaluación, acompañadas de la justificación técnica de la respuesta correcta y el análisis de la trampa conceptual en las opciones erróneas.
  </p>

  ${generalQuestionsFeedback.map(q => `
    <div class="q-card no-break">
      <div class="q-card-header">
        <span class="q-card-title">${q.tema} — ${q.title}</span>
        <span class="badge badge-primary">Pregunta #${q.id}</span>
      </div>
      <div class="q-text">${q.question}</div>
      <div class="q-answers-grid">
        <div class="q-ans-box q-ans-correct">
          <strong>✅ Respuesta Correcta:</strong><br>${q.correctAnswer}
        </div>
        <div class="q-ans-box q-ans-wrong">
          <strong>❌ Error Típico del Estudiante:</strong><br>${q.commonError}
        </div>
      </div>
      <div class="q-explanation">
        <strong>Explicación Didáctica:</strong> ${q.explanation}
        <div style="margin-top: 4px; font-style: italic; color: #1e3a8a;">💡 ${q.tip}</div>
      </div>
    </div>
  `).join('')}

  <!-- ==================== PÁGINA 3: SOLUCIONARIO PRÁCTICO DFD ==================== -->
  <div class="page-break"></div>
  <div class="section-title">3. Solucionario y Patrones de Diseño de Algoritmos Prácticos (DFD)</div>
  <p style="margin-bottom: 12px; font-size: 8.5pt; color: #475569;">
    La sección práctica evaluó 5 ejercicios por estudiante distribuidos en los 3 niveles de complejidad. Los errores más recurrentes no fueron de falta de lógica, sino de <em>sintaxis interna de DFD, confusión de nombres de variables y omisión de estructuras cíclicas</em>.
  </p>

  ${dfdSolucionario.map(s => `
    <div class="q-card no-break" style="margin-bottom: 16px;">
      <div class="q-card-header" style="background: #f8fafc; padding: 6px 10px; margin: -12px -14px 10px -14px; border-radius: 6px 6px 0 0;">
        <span class="q-card-title" style="font-size: 9.5pt;">${s.title} (${s.id})</span>
      </div>
      <p style="font-size: 8pt; color: #334155; margin-bottom: 6px;"><strong>Alcance:</strong> ${s.description}</p>
      
      <div style="background: #fef2f2; border-left: 3px solid #ef4444; padding: 6px 10px; border-radius: 4px; margin-bottom: 8px;">
        <strong style="color: #991b1b; font-size: 7.5pt; text-transform: uppercase;">⚠️ Errores Críticos Detectados en las Entregas:</strong>
        <ul style="margin-left: 14px; font-size: 8pt; color: #7f1d1d; margin-top: 2px;">
          ${s.badPractices.map(bp => `<li>${bp}</li>`).join('')}
        </ul>
      </div>

      <div style="font-size: 8pt; font-weight: 700; color: #1e3a8a; margin-top: 4px;">Pseudocódigo Estándar y Estructura Óptima:</div>
      <pre><code>${s.pseudocode}</code></pre>
    </div>
  `).join('')}

  <!-- ==================== PÁGINA 4+: FICHAS INDIVIDUALES DE RETROALIMENTACIÓN ==================== -->
  <div class="page-break"></div>
  <div class="section-title">4. Fichas Individuales de Retroalimentación por Estudiante</div>
  <p style="margin-bottom: 14px; font-size: 8.5pt; color: #475569;">
    Detalle pormenorizado del desempeño individual de cada alumno, el estado de cada uno de sus 5 ejercicios prácticos DFD subidos a plataforma y las recomendaciones pedagógicas personalizadas.
  </p>

  ${studentsData.map((s, idx) => `
    <div class="student-card no-break">
      <div class="student-card-header">
        <div>
          <span class="student-card-name">${idx + 1}. ${s.name}</span>
          <div class="student-card-email">${s.email} | Usuario: <code>${s.username}</code> | Intentos: ${s.attempts.length}</div>
        </div>
        <div class="student-card-score">
          <span class="badge ${s.finalScore >= 18 ? 'badge-success' : s.finalScore >= 15 ? 'badge-primary' : 'badge-warning'}" style="font-size: 9pt; padding: 4px 10px;">
            Nota Final: ${s.finalScore}/20 (${s.finalScale5})
          </span>
        </div>
      </div>
      <div class="student-card-body">
        <div style="font-size: 8pt; margin-bottom: 6px;">
          <strong>Desempeño Teórico:</strong> ${s.theoryFeedback}
        </div>
        
        <div style="font-size: 8pt; font-weight: 700; color: #1e3a8a; margin-top: 8px;">
          Evaluación de Algoritmos Prácticos (.dfd):
        </div>
        <ul class="dfd-mini-list">
          ${s.dfdExercises.map(ex => `
            <li>
              <span>
                <strong>#${ex.id} ${ex.name}:</strong> 
                <span style="color: #64748b;">(${ex.file})</span> — 
                <span>${ex.note}</span>
              </span>
              <span class="badge ${ex.score === '1/1' ? 'badge-success' : 'badge-danger'}" style="margin-left: 8px; white-space: nowrap;">
                ${ex.score}
              </span>
            </li>
          `).join('')}
        </ul>

        <div class="teacher-note">
          <strong>Recomendación Formativa del Docente:</strong> ${s.teacherRecommendations}
        </div>
      </div>
    </div>
  `).join('')}

  <div class="footer">
    CINAR Sistemas Educativos — Plataforma de Evaluaciones en Línea · Reporte Oficial de Calificaciones y Retroalimentación Pedagógica · Generado automáticamente el 27/10/2026
  </div>

</body>
</html>`;
}

async function run() {
  const htmlContent = buildHtml();
  const htmlPath = path.resolve('reporte_retroalimentacion_parcial1.html');
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
  console.log(`HTML guardado en: ${htmlPath}`);

  // Destino del PDF en el Escritorio
  const desktopPdfPath = 'C:\\Users\\USUARIO\\Desktop\\Informe_Resultados_y_Retroalimentacion_Parcial1_Algoritmos.pdf';

  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeCmd = `"${edgeExe}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${desktopPdfPath}" "${htmlPath}"`;

  console.log('Compilando PDF con Microsoft Edge...');
  execSync(edgeCmd, { stdio: 'inherit' });

  if (fs.existsSync(desktopPdfPath)) {
    const stats = fs.statSync(desktopPdfPath);
    console.log(`\n¡PDF generado exitosamente en el Escritorio!`);
    console.log(`Ruta: ${desktopPdfPath}`);
    console.log(`Tamaño: ${(stats.size / 1024).toFixed(1)} KB`);
  } else {
    console.error('Error: No se encontró el PDF en el escritorio');
  }
}

run().catch(console.error);
