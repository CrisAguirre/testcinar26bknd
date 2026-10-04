import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  hours:        { type: Number, required: true },
  learningGoal: { type: String, required: true }
}, { _id: false });

const courseContentSchema = new mongoose.Schema({
  teacher:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course:        { type: String, required: true, enum: ['algoritmos', 'desarrollo-web-1', 'desarrollo-web-2'] },
  program:       { type: String, default: 'Técnico Laboral por Competencias en Soporte, Sistemas e Informática' },
  modality:      { type: String, enum: ['presencial', 'virtual', 'mixta'], default: 'presencial' },
  totalHours:    { type: Number, required: true },
  presentation:  { type: String },
  introduction:  { type: String },
  generalObjective:    { type: String },
  specificObjectives:  [{ type: String }],
  methodology:         { type: String },
  evaluationTechniques: [{ type: String }],
  resources:     { type: String },
  topics:        [topicSchema],
  period:        { type: String, required: true },
  status:        { type: String, enum: ['borrador', 'enviado', 'aprobado', 'rechazado'], default: 'borrador' },
  reviewedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNote:    { type: String },
}, { timestamps: true });

courseContentSchema.index({ teacher: 1, course: 1, period: 1 }, { unique: true });

export default mongoose.model('CourseContent', courseContentSchema);
