import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: String,
    required: true,
    enum: ['desarrollo-web-1', 'desarrollo-web-2', 'algoritmos']
  },
  canPresent: {
    type: Boolean,
    default: true
  },
  projectIdea: {
    type: String,
    default: ''
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

export default mongoose.model('Enrollment', enrollmentSchema);
