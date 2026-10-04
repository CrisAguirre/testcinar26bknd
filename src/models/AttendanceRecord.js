import mongoose from 'mongoose';

const attendanceEntrySchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:  { type: String, enum: ['P', 'X', 'E', 'J'], required: true },
}, { _id: false });

const attendanceRecordSchema = new mongoose.Schema({
  teacher:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course:        { type: String, required: true, enum: ['algoritmos', 'desarrollo-web-1', 'desarrollo-web-2'] },
  sessionNumber: { type: Number, required: true },
  date:          { type: Date, required: true },
  period:        { type: String, required: true },
  schedule:      { type: String },
  dayOfWeek:     { type: String },
  entries:       [attendanceEntrySchema],
  status:        { type: String, enum: ['borrador', 'cerrado'], default: 'borrador' },
}, { timestamps: true });

attendanceRecordSchema.index({ teacher: 1, course: 1, date: 1 }, { unique: true });

export default mongoose.model('AttendanceRecord', attendanceRecordSchema);
