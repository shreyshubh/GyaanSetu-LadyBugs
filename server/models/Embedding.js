const mongoose = require('mongoose');

const embeddingSchema = new mongoose.Schema({
  user_id: { type: String, required: true, index: true },
  syllabus_id: { type: String, index: true },
  subject: { type: String, default: '' },
  unit: { type: String, default: '' },
  topic: { type: String, required: true },
  text: { type: String, required: true },
  // 384-dimensional dense vector embeddings
  embedding: { type: [Number], required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Embedding', embeddingSchema);
