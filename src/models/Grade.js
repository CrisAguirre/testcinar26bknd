import mongoose from 'mongoose';

const gradeSchema = new mongoose.Schema({
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
  score: {
    type: Number,
    required: true,
    min: 0
  },
  max_score: {
    type: Number,
    default: 100,
    min: 1
  },
  period: {
    type: String,
    required: true,
    trim: true
  },
  comments: {
    type: String,
    trim: true,
    default: null
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

gradeSchema.virtual('percentage').get(function () {
  return ((this.score / this.max_score) * 100).toFixed(2);
});

gradeSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Grade', gradeSchema);
