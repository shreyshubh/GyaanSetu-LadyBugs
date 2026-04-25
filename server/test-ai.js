require('dotenv').config();
const { extractSyllabusTopics } = require('./services/groq');
const { generateEmbeddings } = require('./services/embeddings');

const runTests = async () => {
  try {
    console.log("=== STARTING AI INFRASTRUCTURE TESTS ===\n");

    const sampleSyllabusText = `
    Introduction to Computer Science Fundamentals.
    Course Code: CS101.
    
    1. Basics of Mathematics algorithms.
    2. Data Structures: Arrays, Linked Lists, Trees, Graphs.
    3. Big O Notation, Time and Space Complexity.
    4. Object Oriented Programming (OOP): Inheritance, Polymorphism.
    5. Operating Systems Basics: Threads, Processes, Deadlocks.
    `;

    console.log("[1] Testing Groq Llama 3.3 Topic Extraction...");
    const beforeGroq = Date.now();
    const topics = await extractSyllabusTopics(sampleSyllabusText);
    const groqTime = Date.now() - beforeGroq;
    
    console.log(`✅ Groq Success! Took ${groqTime}ms.`);
    console.log("Extracted Topics array:");
    console.log(topics);
    
    if (!Array.isArray(topics)) {
        throw new Error("Topics is not an array!");
    }

    console.log("\n[2] Testing HuggingFace Embeddings for Vector DB...");
    const beforeHF = Date.now();
    const embeddings = await generateEmbeddings(topics);
    const hfTime = Date.now() - beforeHF;

    console.log(`✅ HuggingFace Success! Took ${hfTime}ms.`);
    console.log(`Generated ${embeddings.length} total vectors.`);
    if (embeddings.length > 0) {
      console.log(`Each vector dimension size: ${embeddings[0].length} (Should be 384 for MiniLM)`);
      console.log("Sample of first vector's first 5 numbers:", embeddings[0].slice(0, 5));
    }

    console.log("\n=== ALL AI TESTS PASSED! ===");
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error);
  }
};

runTests();
