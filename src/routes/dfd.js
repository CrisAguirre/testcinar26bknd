import { Router } from 'express';
import multer from 'multer';
import DfdSubmission from '../models/DfdSubmission.js';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB max
  fileFilter: (_req, file, cb) => {
    // Solo archivos .dfd
    const ext = (file.originalname || '').toLowerCase();
    if (ext.endsWith('.dfd')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos .dfd'), false);
    }
  }
});

router.use(authenticateToken);

// Estudiante sube su archivo .dfd
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ningún archivo .dfd' });
    }

    const { examType = 'taller-1', period = '2026-3', attemptNumber = 1, gradeId } = req.body;

    const submission = await DfdSubmission.create({
      student: req.user.id,
      course: 'algoritmos',
      examType,
      period,
      originalFileName: req.file.originalname,
      fileData: req.file.buffer,
      mimeType: req.file.mimetype || 'application/octet-stream',
      fileSize: req.file.size,
      attemptNumber: parseInt(attemptNumber) || 1,
      gradeId: gradeId || undefined
    });

    res.status(201).json({
      message: 'Archivo DFD subido correctamente',
      submissionId: submission._id,
      fileName: submission.originalFileName,
      fileSize: submission.fileSize
    });
  } catch (err) {
    console.error('Error al subir archivo DFD:', err);
    if (err.message?.includes('.dfd')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Error al guardar el archivo' });
  }
});

// Admin/Teacher: listar entregas de un examen
router.get('/submissions', requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const { examType = 'taller-1', period = '2026-3' } = req.query;
    const submissions = await DfdSubmission.find({ examType, period })
      .select('-fileData') // No enviar el binario en el listado
      .populate('student', 'username full_name email')
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    console.error('Error al listar entregas DFD:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Admin/Teacher: descargar un archivo específico
router.get('/submissions/:id/download', requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const submission = await DfdSubmission.findById(req.params.id)
      .populate('student', 'username full_name');
    if (!submission) {
      return res.status(404).json({ error: 'Entrega no encontrada' });
    }
    const safeName = `${submission.student?.username || 'student'}_${submission.examType}_${submission.originalFileName}`;
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'Content-Length': submission.fileData.length
    });
    res.send(submission.fileData);
  } catch (err) {
    console.error('Error al descargar archivo DFD:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

export default router;
