const { HfInference } = require('@huggingface/inference');

const hf = new HfInference(process.env.HF_TOKEN);

// 384-dim embeddings — same as what Atlas vector index expects
const EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2";

/**
 * Generate embeddings for an array of texts (batch).
 * Limited to 50 at a time to avoid payload issues.
 */
const generateEmbeddings = async (textArray) => {
  if (!textArray || textArray.length === 0) return [];

  const safeArray = textArray.slice(0, 50);

  try {
    const response = await hf.featureExtraction({
      model: EMBEDDING_MODEL,
      inputs: safeArray
    }, { use_cache: true, wait_for_model: true });

    return response;
  } catch (error) {
    console.error("HuggingFace Batch Inference Error:", error);
    throw new Error("Failed to generate vector embeddings");
  }
};

/**
 * Generate a single embedding for one text string.
 * Used by RAG explanation pipeline to embed user queries.
 */
const getEmbedding = async (text) => {
  if (!text || text.trim().length === 0) return null;

  try {
    const response = await hf.featureExtraction({
      model: EMBEDDING_MODEL,
      inputs: text
    }, { use_cache: true, wait_for_model: true });

    // HF returns nested array for single input: [[...384 floats]]
    // Or flat array: [...384 floats]
    return Array.isArray(response[0]) ? response[0] : response;
  } catch (error) {
    console.error("HuggingFace Single Inference Error:", error);
    throw new Error("Failed to generate query embedding");
  }
};

module.exports = {
  generateEmbeddings,
  getEmbedding
};
