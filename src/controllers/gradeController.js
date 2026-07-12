import Grade from '../models/Grade.js';
import User from '../models/User.js';

export async function getAllGrades(req, res) {
  try {
    const { student, subject, period } = req.query;
    const filter = {};

    if (student) filter.student = student;
    if (subject) filter.subject = { $regex: subject, $options: 'i' };
    if (period) filter.period = period;

    const grades = await Grade.find(filter)
      .populate('student', 'username full_name email')
      .sort({ created_at: -1 });

    res.json(grades);
  } catch (error) {
    console.error('Error al obtener calificaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function getGradeById(req, res) {
  try {
    const grade = await Grade.findById(req.params.id)
      .populate('student', 'username full_name email');

    if (!grade) {
      return res.status(404).json({ error: 'Calificación no encontrada' });
    }
    res.json(grade);
  } catch (error) {
    console.error('Error al obtener calificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function createGrade(req, res) {
  try {
    const { student: student_id, subject, score, max_score, period, comments } = req.body;

    if (!student_id || !subject || score === undefined || !period) {
      return res.status(400).json({ error: 'student, subject, score y period son obligatorios' });
    }

    const student = await User.findById(student_id);
    if (!student) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    const grade = await Grade.create({
      student: student_id,
      subject,
      score,
      max_score: max_score || 100,
      period,
      comments: comments || null
    });

    const populated = await grade.populate('student', 'username full_name email');

    res.status(201).json({ message: 'Calificación registrada exitosamente', grade: populated });
  } catch (error) {
    console.error('Error al crear calificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function updateGrade(req, res) {
  try {
    const { subject, score, max_score, period, comments } = req.body;

    const grade = await Grade.findByIdAndUpdate(
      req.params.id,
      { subject, score, max_score, period, comments },
      { new: true, runValidators: true }
    ).populate('student', 'username full_name email');

    if (!grade) {
      return res.status(404).json({ error: 'Calificación no encontrada' });
    }

    res.json({ message: 'Calificación actualizada exitosamente', grade });
  } catch (error) {
    console.error('Error al actualizar calificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function deleteGrade(req, res) {
  try {
    const grade = await Grade.findByIdAndDelete(req.params.id);
    if (!grade) {
      return res.status(404).json({ error: 'Calificación no encontrada' });
    }
    res.json({ message: 'Calificación eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar calificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function getStudentGrades(req, res) {
  try {
    const grades = await Grade.find({ student: req.user.id })
      .populate('student', 'username full_name email')
      .sort({ created_at: -1 });

    res.json(grades);
  } catch (error) {
    console.error('Error al obtener calificaciones del estudiante:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
