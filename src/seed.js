import { config } from 'dotenv';
config();
import './config/timezone.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from './models/User.js';

const MONGODB_URI = process.env.MONGODB_URI;

const dw1Students = [
  { code: '1', full_name: 'DIEGO SEBASTIAN AZAIN MORAN', email: 'd.azain@cinar.edu.co', password: '@cc3501' },
  { code: '2', full_name: 'JAIRO DANIEL ZAMBRANO VALLEID', email: 'j.zambrano@cinar.edu.co', password: '@cc3502' },
  { code: '3', full_name: 'DAVID ALEJANDRO GARCIA ENRIQUEZ', email: 'd.garcia@cinar.edu.co', password: '@cc3503' },
  { code: '4', full_name: 'HAROLD ESTEBAN QUIROZ ALVAREZ', email: 'h.quiroz@cinar.edu.co', password: '@cc3504' },
  { code: '5', full_name: 'ANDRES FELIPE MEZA LEON', email: 'a.meza@cinar.edu.co', password: '@cc3505' },
  { code: '6', full_name: 'JEISON STIVEN MARTINEZ ZAMBRA', email: 'jeison.martinez@cinar.edu.co', password: '@cc3506' },
  { code: '7', full_name: 'WILLIAM DAVID SALAS LASSO', email: 'w.salas@cinar.edu.co', password: '@cc3507' },
];

const algoStudents = [
  { code: '1', full_name: 'Claudia Verónica Angulo', username: 'CVA1@LgC26', email: 'algo1@cinar.edu.co', password: '@cc3500' },
  { code: '2', full_name: 'Andrea Lisseth Quiscualtud', username: 'ALQ2@LgC26', email: 'algo2@cinar.edu.co', password: '@cc3500' },
  { code: '3', full_name: 'Iván Felipe Guancha Galindres', username: 'IFGG3@LgC26', email: 'algo3@cinar.edu.co', password: '@cc3500' },
  { code: '4', full_name: 'Andrés Felipe Mena Oviedo', username: 'AFMO4@LgC26', email: 'algo4@cinar.edu.co', password: '@cc3500' },
  { code: '5', full_name: 'Jairo Granja Bravo', username: 'JGB5@LgC26', email: 'algo5@cinar.edu.co', password: '@cc3500' },
  { code: '6', full_name: 'Oscar Alexander Rodríguez Insuasti', username: 'OARI6@LgC26', email: 'algo6@cinar.edu.co', password: '@cc3500' },
  { code: '7', full_name: 'Juan Carlos Bastidas Montilla', username: 'JCBM7@LgC26', email: 'algo7@cinar.edu.co', password: '@cc3500' },
  { code: '8', full_name: 'Johan Sebastian Rodríguez Rosero', username: 'JSRR8@LgC26', email: 'algo8@cinar.edu.co', password: '@cc3500' },
  { code: '9', full_name: 'Jeferson Hair Hernández', username: 'JHH9@LgC26', email: 'algo9@cinar.edu.co', password: '@cc3500' },
  { code: '10', full_name: 'David Felipe Narváez', username: 'DFN10@LgC26', email: 'algo10@cinar.edu.co', password: '@cc3500' },
  { code: '11', full_name: 'David Santiago Erazo Moncayo', username: 'DSEM11@LgC26', email: 'algo11@cinar.edu.co', password: '@cc3500' },
  { code: '12', full_name: 'Brayan Buesaquillo', username: 'BB12@LgC26', email: 'algo12@cinar.edu.co', password: '@cc3500' },
  { code: '13', full_name: 'Julián David Reina Cabrera', username: 'JDRC13@LgC26', email: 'jd.reina@cinar.edu.co', password: '@cc3500' },
];

const coordinator = {
  username: 'coordinacion',
  email: 'coordinacion@cinarsistemas.edu.co',
  full_name: 'Coordinación Cinar Sistemas',
  password: '@cc3500',
  role: 'coordinator'
};

async function seedStudents() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado a MongoDB');

  const Enrollment = (await import('./models/Enrollment.js')).default;

  // NO TOCAR los 7 de DW (instrucción usuario 24/09): ya están bien, se omiten.
  const dwEmails = new Set(dw1Students.map((s) => s.email.toLowerCase()));
  console.log('Omitiendo 7 DW por instrucción (sin cambios):', [...dwEmails].join(', '));

  // Sembrar estudiantes de Algoritmos y registrarlos en Algoritmos
  for (const s of algoStudents) {
    const hashedPassword = await bcrypt.hash(s.password, 10);
    const userData = {
      username: s.username,
      email: s.email,
      password: hashedPassword,
      full_name: s.full_name,
      role: 'student'
    };

    let user = await User.findOneAndUpdate(
      { email: s.email },
      { $set: userData },
      { new: true, upsert: true }
    );
    console.log(`Upserted Algo: ${s.full_name} (${s.username})`);

    // Inscribir en Algoritmos (únicamente este curso) y reparar canPresent
    const enrollment = await Enrollment.findOne({ user: user._id, course: 'algoritmos' });
    if (!enrollment) {
      await Enrollment.create({ user: user._id, course: 'algoritmos', canPresent: true });
      console.log(`Inscrito en Algoritmos: ${s.full_name}`);
    } else if (!enrollment.canPresent) {
      enrollment.canPresent = true;
      await enrollment.save();
      console.log(`Desbloqueado Algoritmos: ${s.full_name}`);
    }

    // Garantizar exclusividad: eliminar DW1/DW2 si existieran para alumnos de algoritmos
    const stray = await Enrollment.deleteMany({ user: user._id, course: { $in: ['desarrollo-web-1', 'desarrollo-web-2'] } });
    if (stray.deletedCount > 0) {
      console.log(`Limpieza DW para ${s.full_name}: eliminadas ${stray.deletedCount}`);
    }
  }

  // Regla general: todo student que NO sea de los 7 DW -> solo Algoritmos
  // (no toca admin/coordinator/teacher ni a los 7 DW)
  const otherStudents = await User.find({ role: 'student' });
  for (const u of otherStudents) {
    if (dwEmails.has((u.email || '').toLowerCase())) continue;
    let algoEnr = await Enrollment.findOne({ user: u._id, course: 'algoritmos' });
    if (!algoEnr) {
      await Enrollment.create({ user: u._id, course: 'algoritmos', canPresent: true });
      console.log(`Inscrito en Algoritmos (general): ${u.full_name} (${u.email})`);
    } else if (!algoEnr.canPresent) {
      algoEnr.canPresent = true;
      await algoEnr.save();
      console.log(`Desbloqueado Algoritmos (general): ${u.full_name} (${u.email})`);
    }
    const cleaned = await Enrollment.deleteMany({ user: u._id, course: { $in: ['desarrollo-web-1', 'desarrollo-web-2'] } });
    if (cleaned.deletedCount > 0) {
      console.log(`Limpieza DW (general) para ${u.full_name}: eliminadas ${cleaned.deletedCount}`);
    }
  }

  const coordExists = await User.findOne({ email: coordinator.email });
  if (!coordExists) {
    const hashedPassword = await bcrypt.hash(coordinator.password, 10);
    await User.create({
      username: coordinator.username,
      email: coordinator.email,
      password: hashedPassword,
      full_name: coordinator.full_name,
      role: coordinator.role
    });
    console.log(`Creado: ${coordinator.full_name} (${coordinator.email})`);
  } else {
    console.log(`Ya existe: ${coordinator.email}`);
  }

  console.log('Seed completado');
  process.exit(0);
}

seedStudents().catch(err => {
  console.error('Error en seed:', err);
  process.exit(1);
});
