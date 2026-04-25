const Embedding = require('../models/Embedding');
const { generateEmbeddings, getEmbedding } = require('./embeddings');

/**
 * Store embeddings for all topics in a user's syllabus.
 * Deletes existing embeddings for the user + syllabus first, then batch-embeds + inserts.
 * @param {string} userId
 * @param {string} syllabusId
 * @param {Array} subjects - [{name, units: [{name, topics: [{name}]}]}]
 */
const storeEmbeddings = async (userId, syllabusId, subjects) => {
  // Build text chunks from syllabus structure
  const chunks = [];
  for (const subject of subjects) {
    for (const unit of subject.units) {
      for (const topic of unit.topics) {
        chunks.push({
          subject: subject.name,
          unit: unit.name,
          topic: topic.name,
          text: `${subject.name} - ${unit.name} - ${topic.name}`
        });
      }
    }
  }

  if (chunks.length === 0) return;

  // Delete old embeddings for this user + specific syllabus
  await Embedding.deleteMany({ 
    user_id: userId.toString(), 
    syllabus_id: syllabusId?.toString() 
  });

  // Batch embed all topic texts (max 50 per call)
  const allTexts = chunks.map(c => c.text);
  const allEmbeddings = [];
  
  for (let i = 0; i < allTexts.length; i += 50) {
    const batch = allTexts.slice(i, i + 50);
    const batchEmbeddings = await generateEmbeddings(batch);
    allEmbeddings.push(...batchEmbeddings);
  }

  // Build documents for insertMany
  const docs = chunks.map((chunk, i) => ({
    user_id: userId.toString(),
    syllabus_id: syllabusId?.toString(),
    subject: chunk.subject,
    unit: chunk.unit,
    topic: chunk.topic,
    text: chunk.text,
    embedding: allEmbeddings[i] || allEmbeddings[allEmbeddings.length - 1]
  }));

  await Embedding.insertMany(docs);
  return docs.length;
};

/**
 * Retrieve the most relevant topic chunks for a user query using Atlas Vector Search.
 * Requires the `vector_index` to be created manually in Atlas UI.
 * @param {string} userId
 * @param {string} syllabusId
 * @param {string} queryText
 * @param {number} limit - max results (default 5)
 * @returns {Array} matched documents with score
 */
const retrieveChunks = async (userId, syllabusId, queryText, limit = 5) => {
  try {
    const queryVector = await getEmbedding(queryText);
    if (!queryVector) return [];

    const results = await Embedding.aggregate([
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryVector,
          numCandidates: limit * 10,
          limit: limit,
          filter: { 
            user_id: userId.toString(),
            ...(syllabusId && { syllabus_id: syllabusId.toString() })
          }
        }
      },
      {
        $project: {
          _id: 1,
          subject: 1,
          unit: 1,
          topic: 1,
          text: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ]);

    return results;
  } catch (error) {
    // Gracefully degrade if vector_index doesn't exist yet
    if (error.message && error.message.includes('vector_index')) {
      console.warn('⚠️  Atlas vector_index not found. Falling back to text match.');
      // Fallback: simple text search
      return await Embedding.find({
        user_id: userId.toString(),
        ...(syllabusId && { syllabus_id: syllabusId.toString() }),
        text: { $regex: queryText.split(' ').slice(0, 3).join('|'), $options: 'i' }
      }).limit(limit).lean();
    }
    console.error('Vector search error:', error);
    return [];
  }
};

module.exports = {
  storeEmbeddings,
  retrieveChunks
};
