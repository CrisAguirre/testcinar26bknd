import User from '../models/User.js';
import Grade from '../models/Grade.js';
import { nowColombia, colombiaString } from '../config/timezone.js';
import {
  EXAM_SUBJECTS,
  getParcial2Window,
  getTallerOverride
} from '../config/schedule.js';

export async function getSchedule(req, res) {
  try {
    const now = nowColombia();
    const user = await User.findById(req.user.id).select('email role full_name');
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const grades = await Grade.find({ student: req.user.id }).select('subject');
    const usedBySubject = {};
    for (const g of grades) {
      usedBySubject[g.subject] = (usedBySubject[g.subject] || 0) + 1;
    }

    const tallerOverride = getTallerOverride(user.email);

    res.json({
      serverNow: now.getTime(),
      colombiaTime: colombiaString(now),
      parcial2: {
        window: getParcial2Window(now),
        usedAttempts: usedBySubject[EXAM_SUBJECTS.PARCIAL2] || 0
      },
      taller: {
        deadline: tallerOverride ? tallerOverride.deadline : null,
        maxAttempts: tallerOverride ? tallerOverride.maxAttempts : null,
        usedAttempts: usedBySubject[EXAM_SUBJECTS.TALLER] || 0
      }
    });
  } catch (error) {
    console.error('Error al obtener horario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
