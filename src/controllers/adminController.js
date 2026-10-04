import CourseContent from '../models/CourseContent.js';
import TeacherAvailability from '../models/TeacherAvailability.js';
import ClassPlan from '../models/ClassPlan.js';
import AttendanceRecord from '../models/AttendanceRecord.js';
import ContentTracking from '../models/ContentTracking.js';
import GradeSheet from '../models/GradeSheet.js';
import Enrollment from '../models/Enrollment.js';

// ─── Helpers ─────────────────────────────────────────────────────────
function isPrivileged(user) {
  return user.role === 'admin' || user.role === 'coordinator';
}

function ownerOrPrivileged(doc, user) {
  return doc.teacher.toString() === user.id || isPrivileged(user);
}

function filterByOwnership(query, user) {
  if (!isPrivileged(user)) {
    query.teacher = user.id;
  }
  return query;
}

// =====================================================================
// F1 — CONTENIDO TEMÁTICO (CourseContent)
// =====================================================================
export async function createCourseContent(req, res) {
  try {
    const data = { ...req.body, teacher: req.user.id };
    const doc = await CourseContent.create(data);
    res.status(201).json(doc);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Ya existe un contenido temático para este curso y período' });
    res.status(400).json({ error: err.message });
  }
}

export async function listCourseContent(req, res) {
  try {
    const query = filterByOwnership({}, req.user);
    if (req.query.course) query.course = req.query.course;
    if (req.query.period) query.period = req.query.period;
    const docs = await CourseContent.find(query).populate('teacher', 'full_name email').populate('reviewedBy', 'full_name').sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getCourseContent(req, res) {
  try {
    const doc = await CourseContent.findById(req.params.id).populate('teacher', 'full_name email').populate('reviewedBy', 'full_name');
    if (!doc) return res.status(404).json({ error: 'No encontrado' });
    if (!ownerOrPrivileged(doc, req.user)) return res.status(403).json({ error: 'Sin permisos' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateCourseContent(req, res) {
  try {
    const doc = await CourseContent.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'No encontrado' });
    if (!ownerOrPrivileged(doc, req.user)) return res.status(403).json({ error: 'Sin permisos' });
    if (doc.status === 'aprobado') return res.status(400).json({ error: 'No se puede editar un contenido aprobado' });
    const { status, reviewedBy, reviewNote, ...editable } = req.body;
    Object.assign(doc, editable);
    if (doc.status === 'rechazado') doc.status = 'borrador';
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateCourseContentStatus(req, res) {
  try {
    const doc = await CourseContent.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'No encontrado' });
    const { status, reviewNote } = req.body;

    if (status === 'enviado') {
      if (doc.teacher.toString() !== req.user.id) return res.status(403).json({ error: 'Solo el autor puede enviar' });
      if (doc.status !== 'borrador' && doc.status !== 'rechazado') return res.status(400).json({ error: 'Solo se puede enviar desde borrador o rechazado' });
      doc.status = 'enviado';
    } else if (status === 'aprobado' || status === 'rechazado') {
      if (!isPrivileged(req.user)) return res.status(403).json({ error: 'Solo coordinación puede aprobar/rechazar' });
      if (doc.status !== 'enviado') return res.status(400).json({ error: 'Solo se puede aprobar/rechazar desde enviado' });
      doc.status = status;
      doc.reviewedBy = req.user.id;
      if (reviewNote) doc.reviewNote = reviewNote;
    } else {
      return res.status(400).json({ error: 'Estado no válido' });
    }
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// =====================================================================
// F2 — DISPONIBILIDAD DOCENTE (TeacherAvailability)
// =====================================================================
export async function createAvailability(req, res) {
  try {
    const data = { ...req.body, teacher: req.user.id };
    const doc = await TeacherAvailability.create(data);
    res.status(201).json(doc);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Ya existe disponibilidad para este período' });
    res.status(400).json({ error: err.message });
  }
}

export async function listAvailability(req, res) {
  try {
    const query = filterByOwnership({}, req.user);
    if (req.query.period) query.period = req.query.period;
    const docs = await TeacherAvailability.find(query).populate('teacher', 'full_name email').sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateAvailability(req, res) {
  try {
    const doc = await TeacherAvailability.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'No encontrado' });
    if (!ownerOrPrivileged(doc, req.user)) return res.status(403).json({ error: 'Sin permisos' });
    if (doc.status === 'recibido' && !isPrivileged(req.user)) return res.status(400).json({ error: 'Ya fue recibido por coordinación' });
    const { status, ...editable } = req.body;
    Object.assign(doc, editable);
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateAvailabilityStatus(req, res) {
  try {
    const doc = await TeacherAvailability.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'No encontrado' });
    const { status } = req.body;

    if (status === 'enviado') {
      if (doc.teacher.toString() !== req.user.id) return res.status(403).json({ error: 'Solo el autor puede enviar' });
      doc.status = 'enviado';
    } else if (status === 'recibido') {
      if (!isPrivileged(req.user)) return res.status(403).json({ error: 'Solo coordinación puede marcar recibido' });
      doc.status = 'recibido';
    } else {
      return res.status(400).json({ error: 'Estado no válido' });
    }
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// =====================================================================
// F3 — PLANEADOR DE CLASE (ClassPlan)
// =====================================================================
export async function createClassPlan(req, res) {
  try {
    const data = { ...req.body, teacher: req.user.id };
    const doc = await ClassPlan.create(data);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function listClassPlans(req, res) {
  try {
    const query = filterByOwnership({}, req.user);
    if (req.query.course) query.course = req.query.course;
    if (req.query.period) query.period = req.query.period;
    const docs = await ClassPlan.find(query).populate('teacher', 'full_name email').populate('reviewedBy', 'full_name').sort({ date: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getClassPlan(req, res) {
  try {
    const doc = await ClassPlan.findById(req.params.id).populate('teacher', 'full_name email').populate('reviewedBy', 'full_name');
    if (!doc) return res.status(404).json({ error: 'No encontrado' });
    if (!ownerOrPrivileged(doc, req.user)) return res.status(403).json({ error: 'Sin permisos' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateClassPlan(req, res) {
  try {
    const doc = await ClassPlan.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'No encontrado' });
    if (!ownerOrPrivileged(doc, req.user)) return res.status(403).json({ error: 'Sin permisos' });
    if (doc.status === 'revisado' && !isPrivileged(req.user)) return res.status(400).json({ error: 'Ya fue revisado' });
    const { status, reviewedBy, ...editable } = req.body;
    Object.assign(doc, editable);
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateClassPlanStatus(req, res) {
  try {
    const doc = await ClassPlan.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'No encontrado' });
    const { status } = req.body;

    if (status === 'enviado') {
      if (doc.teacher.toString() !== req.user.id) return res.status(403).json({ error: 'Solo el autor puede enviar' });
      doc.status = 'enviado';
    } else if (status === 'revisado') {
      if (!isPrivileged(req.user)) return res.status(403).json({ error: 'Solo coordinación puede revisar' });
      doc.status = 'revisado';
      doc.reviewedBy = req.user.id;
    } else {
      return res.status(400).json({ error: 'Estado no válido' });
    }
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// =====================================================================
// F4 — CONTROL DE ASISTENCIA (AttendanceRecord)
// =====================================================================
export async function createAttendance(req, res) {
  try {
    const data = { ...req.body, teacher: req.user.id };
    // Si no vienen entries, pre-cargar inscritos del curso
    if (!data.entries || data.entries.length === 0) {
      const enrollments = await Enrollment.find({ course: data.course, canPresent: true }).populate('user', '_id');
      data.entries = enrollments.map(e => ({ student: e.user._id, status: 'P' }));
    }
    const doc = await AttendanceRecord.create(data);
    res.status(201).json(doc);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Ya existe un registro de asistencia para esta fecha y curso' });
    res.status(400).json({ error: err.message });
  }
}

export async function listAttendance(req, res) {
  try {
    const query = filterByOwnership({}, req.user);
    if (req.query.course) query.course = req.query.course;
    if (req.query.period) query.period = req.query.period;
    const docs = await AttendanceRecord.find(query)
      .populate('teacher', 'full_name email')
      .populate('entries.student', 'full_name username')
      .sort({ date: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateAttendance(req, res) {
  try {
    const doc = await AttendanceRecord.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'No encontrado' });
    if (!ownerOrPrivileged(doc, req.user)) return res.status(403).json({ error: 'Sin permisos' });
    if (doc.status === 'cerrado') return res.status(400).json({ error: 'Planilla cerrada, no se puede editar' });
    const { status, ...editable } = req.body;
    Object.assign(doc, editable);
    await doc.save();
    const populated = await AttendanceRecord.findById(doc._id)
      .populate('teacher', 'full_name email')
      .populate('entries.student', 'full_name username');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function closeAttendance(req, res) {
  try {
    const doc = await AttendanceRecord.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'No encontrado' });
    if (!ownerOrPrivileged(doc, req.user)) return res.status(403).json({ error: 'Sin permisos' });
    doc.status = 'cerrado';
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// =====================================================================
// F5 — CONTROL DE CONTENIDOS (ContentTracking)
// =====================================================================
export async function createContentTracking(req, res) {
  try {
    const data = { ...req.body, teacher: req.user.id };
    const doc = await ContentTracking.create(data);
    res.status(201).json(doc);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Ya existe un control de contenidos para este curso y período' });
    res.status(400).json({ error: err.message });
  }
}

export async function listContentTracking(req, res) {
  try {
    const query = filterByOwnership({}, req.user);
    if (req.query.course) query.course = req.query.course;
    if (req.query.period) query.period = req.query.period;
    const docs = await ContentTracking.find(query).populate('teacher', 'full_name email').sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateContentTracking(req, res) {
  try {
    const doc = await ContentTracking.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'No encontrado' });
    if (!ownerOrPrivileged(doc, req.user)) return res.status(403).json({ error: 'Sin permisos' });
    if (doc.status === 'cerrado') return res.status(400).json({ error: 'Control cerrado' });
    const { status, ...editable } = req.body;
    Object.assign(doc, editable);
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function signContentTracking(req, res) {
  try {
    const doc = await ContentTracking.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'No encontrado' });
    const { sessionIndex, signType } = req.body;

    if (sessionIndex == null || !doc.sessions[sessionIndex]) {
      return res.status(400).json({ error: 'Índice de sesión no válido' });
    }

    if (signType === 'teacher') {
      if (doc.teacher.toString() !== req.user.id) return res.status(403).json({ error: 'Solo el docente puede firmar como profesor' });
      doc.sessions[sessionIndex].teacherSigned = true;
    } else if (signType === 'coordinator') {
      if (!isPrivileged(req.user)) return res.status(403).json({ error: 'Solo coordinación puede co-firmar' });
      doc.sessions[sessionIndex].coordinatorSigned = true;
    } else {
      return res.status(400).json({ error: 'signType debe ser teacher o coordinator' });
    }

    doc.markModified('sessions');
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// =====================================================================
// F6 — PLANILLA DE NOTAS (GradeSheet)
// =====================================================================
export async function createGradeSheet(req, res) {
  try {
    const data = { ...req.body, teacher: req.user.id };
    // Si no vienen entries, pre-cargar inscritos
    if (!data.entries || data.entries.length === 0) {
      const enrollments = await Enrollment.find({ course: data.course, canPresent: true }).populate('user', '_id full_name');
      data.entries = enrollments.map(e => ({
        student: e.user._id,
        firstPartial: null,
        firstPartialPct: null,
        finalExam: null,
        finalExamPct: null,
        finalGrade: null,
      }));
      data.totalEnrolled = enrollments.length;
      data.totalWithdrawn = 0;
      data.totalCompleted = enrollments.length;
    }
    const doc = await GradeSheet.create(data);
    res.status(201).json(doc);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Ya existe una planilla de notas para este curso y período' });
    res.status(400).json({ error: err.message });
  }
}

export async function listGradeSheets(req, res) {
  try {
    const query = filterByOwnership({}, req.user);
    if (req.query.course) query.course = req.query.course;
    if (req.query.period) query.period = req.query.period;
    const docs = await GradeSheet.find(query)
      .populate('teacher', 'full_name email')
      .populate('entries.student', 'full_name username')
      .sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateGradeSheet(req, res) {
  try {
    const doc = await GradeSheet.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'No encontrado' });
    if (!ownerOrPrivileged(doc, req.user)) return res.status(403).json({ error: 'Sin permisos' });
    if (doc.status === 'entregado') return res.status(400).json({ error: 'Planilla ya entregada' });

    const { status, signedByTeacher, ...editable } = req.body;

    // Recalcular porcentajes si vienen entries
    if (editable.entries) {
      editable.entries = editable.entries.map(e => {
        const fp = e.firstPartial != null ? Number(e.firstPartial) : null;
        const fe = e.finalExam != null ? Number(e.finalExam) : null;
        return {
          ...e,
          firstPartialPct: fp != null ? +(fp * 0.4).toFixed(2) : null,
          finalExamPct: fe != null ? +(fe * 0.6).toFixed(2) : null,
          finalGrade: (fp != null && fe != null) ? +(fp * 0.4 + fe * 0.6).toFixed(2) : null,
        };
      });
    }

    Object.assign(doc, editable);
    await doc.save();
    const populated = await GradeSheet.findById(doc._id)
      .populate('teacher', 'full_name email')
      .populate('entries.student', 'full_name username');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function signGradeSheet(req, res) {
  try {
    const doc = await GradeSheet.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'No encontrado' });
    const { action } = req.body;

    if (action === 'firmar') {
      if (doc.teacher.toString() !== req.user.id) return res.status(403).json({ error: 'Solo el docente puede firmar' });
      doc.signedByTeacher = true;
      doc.status = 'firmado';
    } else if (action === 'entregar') {
      if (!isPrivileged(req.user) && doc.teacher.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Sin permisos' });
      }
      if (!doc.signedByTeacher) return res.status(400).json({ error: 'Debe firmar antes de entregar' });
      doc.status = 'entregado';
    } else {
      return res.status(400).json({ error: 'action debe ser firmar o entregar' });
    }
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// ─── Utilidad: listar inscritos de un curso (para pre-cargar en Asistencia / Notas) ──
export async function getEnrolledStudents(req, res) {
  try {
    const { course } = req.params;
    const enrollments = await Enrollment.find({ course, canPresent: true })
      .populate('user', 'full_name username email');
    res.json(enrollments.map(e => ({
      _id: e.user._id,
      full_name: e.user.full_name,
      username: e.user.username,
      email: e.user.email,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
