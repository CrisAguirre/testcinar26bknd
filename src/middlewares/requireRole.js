/**
 * Middleware genérico de autorización por rol.
 * Uso: requireRole('admin', 'coordinator', 'teacher')
 */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'No tiene permisos para esta acción' });
  }
  next();
};
