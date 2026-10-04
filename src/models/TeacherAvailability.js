import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema({
  day:       { type: String, enum: ['lunes','martes','miercoles','jueves','viernes','sabado'], required: true },
  timeSlot:  { type: String, required: true },
  available: { type: Boolean, default: false }
}, { _id: false });

const teacherAvailabilitySchema = new mongoose.Schema({
  teacher:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName:           { type: String, required: true },
  documentId:         { type: String },
  profession:         { type: String },
  specialization:     { type: String },
  address:            { type: String },
  phone:              { type: String },
  cellphone:          { type: String },
  email:              { type: String },
  professionalProfile: { type: String },
  subjectExpertise:   [{ type: String }],
  slots:              [slotSchema],
  periodStart:        { type: Date },
  periodEnd:          { type: Date },
  period:             { type: String, required: true },
  status:             { type: String, enum: ['borrador', 'enviado', 'recibido'], default: 'borrador' },
}, { timestamps: true });

teacherAvailabilitySchema.index({ teacher: 1, period: 1 }, { unique: true });

export default mongoose.model('TeacherAvailability', teacherAvailabilitySchema);
