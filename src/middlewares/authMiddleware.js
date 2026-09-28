import jwt from 'jsonwebtoken';

function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET no configurado en producción. El servidor no arrancará.');
    process.exit(1);
  }
  console.warn('JWT_SECRET no configurado, usando fallback solo para desarrollo local');
  return 'dev-insecure-fallback';
}

const JWT_SECRET = getJwtSecret();

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    const effectiveRole = req.user.role === 'coordinator' ? 'admin' : req.user.role;
    if (!roles.includes(effectiveRole)) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }
    next();
  };
}
