import mongoose from 'mongoose';

const dfdSubmissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: String, required: true, default: 'algoritmos' },
  examType: { type: String, required: true, default: 'taller-1' },
  period: { type: String, required: true, default: '2026-3' },
  originalFileName: { type: String, required: true },
  fileData: { type: Buffer, required: true },
  mimeType: { type: String, default: 'application/octet-stream' },
  fileSize: { type: Number },
  attemptNumber: { type: Number, default: 1 },
  gradeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grade' }
}, { timestamps: true });

dfdSubmissionSchema.index({ student: 1, examType: 1, period: 1 });

export default mongoose.model('DfdSubmission', dfdSubmissionSchema);
