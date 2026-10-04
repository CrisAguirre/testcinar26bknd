import mongoose from 'mongoose';

const classPlanSchema = new mongoose.Schema({
  teacher:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course:        { type: String, required: true, enum: ['algoritmos', 'desarrollo-web-1', 'desarrollo-web-2'] },
  level:         { type: String },
  date:          { type: Date, required: true },
  period:        { type: String, required: true },
  topics:        { type: String, required: true },
  competency:    { type: String },
  didacticStrategy: { type: String },
  thematicContext:  { type: String },
  ticTools:      { type: String },
  learningObjective: { type: String, required: true },
  resources:     { type: String },
  activityDevelopment: {
    experienciaVivencial: { type: String },
    reflexion:            { type: String },
    documentacion:        { type: String },
    ampliacion:           { type: String },
    aplicacion:           { type: String },
  },
  teacherActions:  { type: String },
  studentActions:  { type: String },
  evaluationMethod: {
    evaluation: { type: Boolean, default: false },
    portfolio:  { type: Boolean, default: false },
    selfEval:   { type: Boolean, default: false },
    other:      { type: String },
  },
  evaluationDescription: { type: String },
  postObservations:      { type: String },
  status:        { type: String, enum: ['borrador', 'enviado', 'revisado'], default: 'borrador' },
  reviewedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

classPlanSchema.index({ teacher: 1, course: 1, date: 1 });

export default mongoose.model('ClassPlan', classPlanSchema);
