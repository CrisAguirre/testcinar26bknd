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

export function getAllowedOrigins() {
  return (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

export function isOriginAllowed(origin) {
  if (!origin) return false;
  return getAllowedOrigins().includes(origin);
}

// P2: los endpoints autenticados por cookie (refresh/logout) exigen
// Origin o Referer de la lista permitida. Los navegadores siempre envían
// uno de los dos en peticiones cross-site con credenciales, así un sitio
// atacante no puede rotar ni cerrar sesiones ajenas (CSRF).
// En desarrollo sin allowlist se permite (solo local).
export function requireAllowedOrigin(req, res, next) {
  const allowlist = getAllowedOrigins();
  if (allowlist.length === 0 && process.env.NODE_ENV !== 'production') {
    return next();
  }
  const origin = req.headers.origin || req.headers.referer;
  if (!origin) {
    return res.status(403).json({ error: 'Origen no permitido' });
  }
  let allowed;
  try {
    allowed = allowlist.includes(new URL(origin).origin);
  } catch {
    allowed = false;
  }
  if (!allowed) {
    return res.status(403).json({ error: 'Origen no permitido' });
  }
  next();
}

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
