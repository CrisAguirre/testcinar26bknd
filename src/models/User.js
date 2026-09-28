import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  full_name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin', 'coordinator'],
    default: 'student'
  },
  // P2: refresh token rotativo (solo hash + expiración, nunca el token plano).
  refreshTokenHash: {
    type: String,
    default: null,
    select: false
  },
  refreshTokenExpiresAt: {
    type: Date,
    default: null,
    select: false
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

export default mongoose.model('User', userSchema);
