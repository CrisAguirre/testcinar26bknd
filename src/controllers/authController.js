import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = getJwtSecret();

function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET no configurado en producción. El servidor no arrancará.');
    process.exit(1);
  }
  console.warn('JWT_SECRET no configurado, usando fallback solo para desarrollo local');
  return 'dev-insecure-fallback';
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_ROLES = ['student', 'teacher', 'coordinator', 'admin'];

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function validateCredentials({ username, email, password, full_name }) {
  if (![username, email, password, full_name].every(isNonEmptyString)) {
    return 'Todos los campos son obligatorios';
  }
  if (!EMAIL_RE.test(email.trim())) {
    return 'Email inválido';
  }
  if (username.trim().length < 3 || username.trim().length > 40) {
    return 'El usuario debe tener entre 3 y 40 caracteres';
  }
  if (password.length < 8) {
    return 'La contraseña debe tener mínimo 8 caracteres';
  }
  if (full_name.trim().length > 120) {
    return 'El nombre es demasiado largo';
  }
  return null;
}

function generateToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export async function register(req, res) {
  try {
    const { username, email, password, full_name } = req.body ?? {};
    // P0: el registro público SIEMPRE crea estudiantes. El campo `role`
    // del body se ignora para evitar escalación de privilegios.

    const validationError = validateCredentials({ username, email, password, full_name });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    const existing = await User.findOne({ $or: [{ username: cleanUsername }, { email: cleanEmail }] });
    if (existing) {
      return res.status(409).json({ error: 'El usuario o email ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      full_name: full_name.trim(),
      role: 'student'
    });

    const token = generateToken(user);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function login(req, res) {
  try {
    const { username, password } = req.body ?? {};

    if (!isNonEmptyString(username) || !isNonEmptyString(password)) {
      return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
    }

    const cleanUsername = username.trim();
    const user = await User.findOne({
      $or: [{ username: cleanUsername }, { email: cleanUsername.toLowerCase() }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function createUserByAdmin(req, res) {
  try {
    const { username, email, password, full_name, role } = req.body ?? {};

    const validationError = validateCredentials({ username, email, password, full_name });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ error: `Rol inválido. Permitidos: ${ALLOWED_ROLES.join(', ')}` });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    const existing = await User.findOne({ $or: [{ username: cleanUsername }, { email: cleanEmail }] });
    if (existing) {
      return res.status(409).json({ error: 'El usuario o email ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      full_name: full_name.trim(),
      role
    });

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    if (req.user.id === id) {
      return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    }

    const target = await User.findById(id);
    if (!target) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (target.role === 'admin') {
      return res.status(403).json({ error: 'No puedes eliminar a otro administrador' });
    }

    const Grade = (await import('../models/Grade.js')).default;
    const gradeCount = await Grade.countDocuments({ student: id });
    if (gradeCount > 0) {
      await Grade.deleteMany({ student: id });
    }

    await User.findByIdAndDelete(id);

    res.json({
      message: 'Usuario eliminado exitosamente',
      gradesDeleted: gradeCount
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
