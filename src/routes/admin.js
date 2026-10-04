import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/requireRole.js';
import * as adminController from '../controllers/adminController.js';

const router = Router();

// Todas las rutas requieren autenticación y un rol de los 3 permitidos
router.use(authenticateToken);
router.use(requireRole('admin', 'coordinator', 'teacher'));

// Utilidad para pre-cargar estudiantes
router.get('/enrollments/:course', adminController.getEnrolledStudents);

// ==========================================
// F1: Contenido Temático (CourseContent)
// ==========================================
router.post('/course-content', adminController.createCourseContent);
router.get('/course-content', adminController.listCourseContent);
router.get('/course-content/:id', adminController.getCourseContent);
router.put('/course-content/:id', adminController.updateCourseContent);
router.patch('/course-content/:id/status', adminController.updateCourseContentStatus);

// ==========================================
// F2: Disponibilidad Docente (TeacherAvailability)
// ==========================================
router.post('/availability', adminController.createAvailability);
router.get('/availability', adminController.listAvailability);
router.put('/availability/:id', adminController.updateAvailability);
router.patch('/availability/:id/status', adminController.updateAvailabilityStatus);

// ==========================================
// F3: Planeador de Clase (ClassPlan)
// ==========================================
router.post('/class-plans', adminController.createClassPlan);
router.get('/class-plans', adminController.listClassPlans);
router.get('/class-plans/:id', adminController.getClassPlan);
router.put('/class-plans/:id', adminController.updateClassPlan);
router.patch('/class-plans/:id/status', adminController.updateClassPlanStatus);

// ==========================================
// F4: Control de Asistencia (AttendanceRecord)
// ==========================================
router.post('/attendance', adminController.createAttendance);
router.get('/attendance', adminController.listAttendance);
router.put('/attendance/:id', adminController.updateAttendance);
router.patch('/attendance/:id/close', adminController.closeAttendance);

// ==========================================
// F5: Control de Contenidos (ContentTracking)
// ==========================================
router.post('/content-tracking', adminController.createContentTracking);
router.get('/content-tracking', adminController.listContentTracking);
router.put('/content-tracking/:id', adminController.updateContentTracking);
router.patch('/content-tracking/:id/sign', adminController.signContentTracking);

// ==========================================
// F6: Planilla de Notas (GradeSheet)
// ==========================================
router.post('/grade-sheets', adminController.createGradeSheet);
router.get('/grade-sheets', adminController.listGradeSheets);
router.put('/grade-sheets/:id', adminController.updateGradeSheet);
router.patch('/grade-sheets/:id/sign', adminController.signGradeSheet);

export default router;
