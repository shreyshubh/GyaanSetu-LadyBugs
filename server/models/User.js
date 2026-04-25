const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const topicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  confidence: { type: String, enum: ['confident', 'neutral', 'weak'], default: 'neutral' },
  studied: { type: Boolean, default: false },
  studied_at: { type: Date, default: null },
  last_tested: { type: Date, default: null },
  score: { type: Number, default: 0 },
  quiz_priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' }
}, { _id: false });

const unitSchema = new mongoose.Schema({
  name: { type: String, required: true },
  topics: [topicSchema]
}, { _id: false });

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  units: [unitSchema]
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  language: { type: String, default: 'en', enum: ['en', 'hi'] },

  syllabi: [{
    name: { type: String, required: true },
    subjects: [subjectSchema],
    created_at: { type: Date, default: Date.now }
  }],
  activeSyllabusId: { type: mongoose.Schema.Types.ObjectId },
  
  // Legacy field, kept for backwards compatibility during migration
  syllabus: {
    subjects: [subjectSchema]
  },

  pacing_profile: {
    avg_time_per_q: { type: Number, default: 30 },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' }
  },

  quiz_history: [{
    subject: String,
    topics: [String],
    score: Number,
    total: Number,
    date: { type: Date, default: Date.now },
    time_taken: Number
  }],

  explanation_history: [{
    question: String,
    topic: String,
    date: { type: Date, default: Date.now }
  }],

  offline_queue: [{
    type: { type: String },
    data: { type: mongoose.Schema.Types.Mixed },
    timestamp: Date
  }],

  career_profile: {
    strong: [String],
    weak: [String],
    cached_roles: [{ type: mongoose.Schema.Types.Mixed }],
    cached_resources: [{ type: mongoose.Schema.Types.Mixed }]
  },

  gamification: {
    current_streak: { type: Number, default: 0 },
    longest_streak: { type: Number, default: 0 },
    last_active_date: { type: Date, default: null },
    total_topics_studied: { type: Number, default: 0 },
    total_quizzes_taken: { type: Number, default: 0 },
    badges_earned: [String],
    badge_seen: [String],
    badge_unseen: [String],
    offline_sync_count: { type: Number, default: 0 }
  },

  createdAt: { type: Date, default: Date.now }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Method to get active syllabus
userSchema.methods.getActiveSyllabus = function() {
  if (this.activeSyllabusId && this.syllabi && this.syllabi.length > 0) {
    const active = this.syllabi.id(this.activeSyllabusId);
    if (active) return active;
  }
  return this.syllabi?.[0] || this.syllabus || { subjects: [] };
};

// Pre-save hook to hash password
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
