import mongoose from 'mongoose';

const gradeEntrySchema = new mongoose.Schema({
  student:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  documentId:      { type: String },
  level:           { type: Number },
  program:         { type: String },
  firstPartial:    { type: Number, min: 0, max: 5 },
  firstPartialPct: { type: Number },
  finalExam:       { type: Number, min: 0, max: 5 },
  finalExamPct:    { type: Number },
  finalGrade:      { type: Number },
}, { _id: false });

const gradeSheetSchema = new mongoose.Schema({
  teacher:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course:          { type: String, required: true, enum: ['algoritmos', 'desarrollo-web-1', 'desarrollo-web-2'] },
  courseCode:       { type: String },
  sheetId:         { type: String },
  period:          { type: String, required: true },
  year:            { type: Number },
  schedule:        { type: String },
  shift:           { type: String },
  dayOfWeek:       { type: String },
  entries:         [gradeEntrySchema],
  totalEnrolled:   { type: Number },
  totalWithdrawn:  { type: Number },
  totalCompleted:  { type: Number },
  status:          { type: String, enum: ['borrador', 'firmado', 'entregado'], default: 'borrador' },
  signedByTeacher: { type: Boolean, default: false },
}, { timestamps: true });

gradeSheetSchema.index({ teacher: 1, course: 1, period: 1 }, { unique: true });

export default mongoose.model('GradeSheet', gradeSheetSchema);
