import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  number:            { type: Number, required: true },
  date:              { type: Date },
  topicAndGoal:      { type: String, required: true },
  teacherSigned:     { type: Boolean, default: false },
  coordinatorSigned: { type: Boolean, default: false },
}, { _id: false });

const contentTrackingSchema = new mongoose.Schema({
  teacher:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course:     { type: String, required: true, enum: ['algoritmos', 'desarrollo-web-1', 'desarrollo-web-2'] },
  period:     { type: String, required: true },
  schedule:   { type: String },
  dayOfWeek:  { type: String },
  startDate:  { type: Date },
  endDate:    { type: Date },
  sessions:   [sessionSchema],
  status:     { type: String, enum: ['activo', 'cerrado'], default: 'activo' },
}, { timestamps: true });

contentTrackingSchema.index({ teacher: 1, course: 1, period: 1 }, { unique: true });

export default mongoose.model('ContentTracking', contentTrackingSchema);
