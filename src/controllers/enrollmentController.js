import Enrollment from '../models/Enrollment.js';


export async function getMyEnrollments(req, res) {
  try {
    const enrollments = await Enrollment.find({ user: req.user.id });
    res.json(enrollments);
  } catch (error) {
    console.error('Error al obtener inscripciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function enrollUser(req, res) {
  try {
    const { userId, course, canPresent } = req.body;

    if (!course) {
      return res.status(400).json({ error: 'Curso es obligatorio' });
    }

    const existing = await Enrollment.findOne({ user: userId, course });
    if (existing) {
      existing.canPresent = canPresent !== undefined ? canPresent : existing.canPresent;
      await existing.save();
      return res.json({ message: 'Inscripción actualizada', enrollment: existing });
    }

    const enrollment = await Enrollment.create({
      user: userId,
      course,
      canPresent: canPresent !== undefined ? canPresent : true
    });

    res.status(201).json({ message: 'Usuario inscrito exitosamente', enrollment });
  } catch (error) {
    console.error('Error al inscribir usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function unenrollUser(req, res) {
  try {
    const { userId, course } = req.params;

    const enrollment = await Enrollment.findOneAndDelete({ user: userId, course });
    if (!enrollment) {
      return res.status(404).json({ error: 'Inscripción no encontrada' });
    }

    res.json({ message: 'Usuario desinscrito exitosamente' });
  } catch (error) {
    console.error('Error al desinscribir usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function getCourseEnrollments(req, res) {
  try {
    const { course } = req.params;
    const enrollments = await Enrollment.find({ course }).populate('user', 'username full_name email');
    res.json(enrollments);
  } catch (error) {
    console.error('Error al obtener inscripciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function checkEnrollment(userId, course) {
  if (course === 'desarrollo-web-1') {
    return { enrolled: false, canPresent: false, reason: 'Curso finalizado, ya no está disponible.' };
  }

  // Verificar si hay registro en la tabla Enrollment
  const enrollment = await Enrollment.findOne({ user: userId, course });
  
  if (course === 'desarrollo-web-2') {
    if (!enrollment) {
      return { enrolled: false, canPresent: false, reason: 'No está inscrito en Desarrollo Web 2. Consulte con coordinación.' };
    }
    return { enrolled: true, canPresent: enrollment.canPresent };
  }

  if (course === 'algoritmos') {
    if (!enrollment) {
      return { enrolled: false, canPresent: false, reason: 'No inscrito en el curso de Algoritmos' };
    }
    if (!enrollment.canPresent) {
      return { enrolled: true, canPresent: false, reason: 'Inscripción sin permisos de presentación' };
    }
    return { enrolled: true, canPresent: true };
  }

  return { enrolled: false, canPresent: false, reason: 'Curso no reconocido' };
}

export async function saveProjectIdea(req, res) {
  try {
    const { course, projectIdea } = req.body;
    if (!course || projectIdea === undefined) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos' });
    }

    const enrollment = await Enrollment.findOne({ user: req.user.id, course });
    if (!enrollment) {
      return res.status(404).json({ error: 'Inscripción no encontrada' });
    }

    enrollment.projectIdea = projectIdea;
    await enrollment.save();

    res.json({ message: 'Idea de proyecto guardada exitosamente', projectIdea });
  } catch (error) {
    console.error('Error al guardar idea de proyecto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
