import mongoose from 'mongoose';

const attendanceEntrySchema = new mongoose.Schema({
  student:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  documentId: { type: String },
  level:      { type: String },
  program:    { type: String },
  statuses:   [{ type: String, enum: ['P', 'X', 'E', 'J', ''] }], // Array de 12 posiciones
}, { _id: false });

const sessionHeaderSchema = new mongoose.Schema({
  date: { type: Date },
}, { _id: false });

const attendanceRecordSchema = new mongoose.Schema({
  teacher:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course:        { type: String, required: true, enum: ['algoritmos', 'desarrollo-web-1', 'desarrollo-web-2'] },
  courseCode:    { type: String },
  period:        { type: String, required: true },
  schedule:      { type: String },
  shift:         { type: String },
  dayOfWeek:     { type: String },
  startDate:     { type: Date },
  endDate:       { type: Date },
  sessions:      [sessionHeaderSchema], // Array de hasta 12 sesiones
  entries:       [attendanceEntrySchema],
  status:        { type: String, enum: ['borrador', 'entregado'], default: 'borrador' },
}, { timestamps: true });

attendanceRecordSchema.index({ teacher: 1, course: 1, period: 1 }, { unique: true });

export default mongoose.model('AttendanceRecord', attendanceRecordSchema);
