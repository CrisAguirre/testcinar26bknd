import mongoose from 'mongoose';

// Borrador de un examen en progreso. Vive en el servidor para que el
// estudiante pueda retomarlo desde otro equipo o después de perder la red.
// No crea un Grade (no consume intento): el intento se registra al finalizar.
const examDraftSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  attemptNumber: {
    type: Number,
    default: 1,
    min: 1
  },
  // Set exacto de preguntas seleccionadas para ESTE intento (para que al
  // retomar vea las mismas, no una selección aleatoria nueva).
  questions: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  answers: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  currentIndex: {
    type: Number,
    default: 0,
    min: 0
  },
  timeLeft: {
    type: Number,
    default: 0,
    min: 0
  },
  timeUsed: {
    type: Number,
    default: 0,
    min: 0
  },
  tabSwitchCount: {
    type: Number,
    default: 0,
    min: 0
  },
  uploadedFileNames: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  dfdSubmissions: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Si el intento fue reabierto, apunta al Grade existente para actualizarlo
  // en lugar de crear uno nuevo al finalizar.
  gradeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grade',
    default: null
  },
  status: {
    type: String,
    enum: ['in_progress', 'submitted'],
    default: 'in_progress'
  },
  clientUpdatedAt: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

examDraftSchema.index({ student: 1, subject: 1 }, { unique: true });

export default mongoose.model('ExamDraft', examDraftSchema);
