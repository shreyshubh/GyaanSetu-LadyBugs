const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const cleanJsonResponse = (text) => {
  let c = text.trim();
  c = c.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  c = c.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  return c;
};

const safeParseJson = (text) => {
  let cleaned = cleanJsonResponse(text);
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Attempt to fix common "Bad control character" issues (raw newlines/tabs inside strings)
    const sanitized = cleaned.replace(/[\u0000-\u001F]+/g, (match) => {
      if (match.includes('\n')) return '\\n';
      if (match.includes('\t')) return '\\t';
      return '';
    });
    
    try {
      return JSON.parse(sanitized);
    } catch (e2) {
      const m = sanitized.match(/\[[\s\S]*\]/) || sanitized.match(/\{[\s\S]*\}/);
      if (m) {
        try { return JSON.parse(m[0]); } catch {}
      }
      throw e;
    }
  }
};

const extractSyllabusTopics = async (rawText) => {
  const prompt = `You are an expert Syllabus parser. Extract the full hierarchical structure from this syllabus text. 
Return ONLY a strictly formatted JSON array of "subjects". Each subject should have a "name" and an array of "units". Each unit should have a "name" and an array of "topics". Each topic should be an object with just a "name" string.
Example format:
[
  {
    "name": "Mathematics",
    "units": [
      {
        "name": "Calculus",
        "topics": [{ "name": "Limits" }, { "name": "Derivatives" }]
      }
    ]
  }
]
Do not include any markdown fences. Just the raw JSON array.
Text:
${rawText.substring(0, 25000)}`;
  
  const r = await groq.chat.completions.create({ messages: [{ role: 'user', content: prompt }], model: 'llama-3.3-70b-versatile', temperature: 0.1 });
  let parsed = safeParseJson(r.choices[0].message.content);
  if (parsed && !Array.isArray(parsed) && Array.isArray(parsed.subjects)) {
    parsed = parsed.subjects;
  }
  return parsed;
};

const generateQuizQuestions = async (subjectContext, count = 5, level = 'beginner', language = 'en') => {
  const lang = language === 'hi' ? 'Respond in Hindi.' : '';
  const prompt = `Generate ${count} quiz questions for ${level} level. ${lang}
Context (strictly test ONLY concepts from this syllabus subset):
${JSON.stringify(subjectContext)}

Mix: 70% MCQ, 20% theoretical, 10% coding.
Return ONLY a JSON array with this exact strict schema:
[
  {
    "type": "mcq", // or "theoretical" or "coding"
    "topic": "Topic Name",
    "question": "The question text?",
    "options": ["A", "B", "C", "D"], // REQUIRED for mcq
    "correctIndex": 0, // REQUIRED for mcq (0-3)
    "correctAnswer": "Detailed answer key for grading theoretical/coding" // REQUIRED for theoretical/coding
  }
]`;
  const r = await groq.chat.completions.create({ messages: [{ role: 'user', content: prompt }], model: 'llama-3.3-70b-versatile', temperature: 0.7 });
  return safeParseJson(r.choices[0].message.content);
};

const gradeTheoreticalAnswer = async (question, userAnswer, correctAnswer, language = 'en') => {
  const prompt = `Grade this answer 0-100. Question: ${question}\nModel: ${correctAnswer}\nStudent: ${userAnswer}\nReturn JSON: {"score":<num>,"feedback":"<text>"}`;
  try {
    const r = await groq.chat.completions.create({ messages: [{ role: 'user', content: prompt }], model: 'llama-3.3-70b-versatile', temperature: 0.2 });
    return safeParseJson(r.choices[0].message.content);
  } catch { return { score: 0, feedback: 'Unable to grade' }; }
};

const generateExplanationStream = async (question, context, selectedTopic, language = 'en') => {
  const lang = language === 'hi' ? 'Respond in Hindi.' : '';
  const prompt = `You are GyaanSetu AI. ${lang}
IMPORTANT RULE: You must ONLY answer questions directly related to the topic: "${selectedTopic}". 
If the user's question is unrelated to "${selectedTopic}", politely refuse to answer and ask them to stay on topic or select a different topic from their sidebar.

Context from syllabus:
${context}

User Question: ${question}
Explain clearly with examples.`;
  return await groq.chat.completions.create({ messages: [{ role: 'user', content: prompt }], model: 'llama-3.3-70b-versatile', temperature: 0.5, stream: true });
};

const generateNotes = async (topic, subject, unit, confidence = 'neutral', language = 'en') => {
  const lang = language === 'hi' ? 'Respond in Hindi.' : '';
  let styleGuide = '';
  if (confidence === 'weak') styleGuide = 'The student is struggling. Use highly simplified language, abundant real-world analogies, and break down concepts into very small, digestible steps.';
  else if (confidence === 'confident') styleGuide = 'The student is confident. Focus on advanced edge cases, deep technical nuances, best practices, and complex examples rather than basic definitions.';
  else styleGuide = 'Provide a balanced, comprehensive overview suitable for standard review.';

  const prompt = `Create deeply detailed, premium study notes for the topic: "${topic}" (Subject: ${subject}, Unit: ${unit}). ${lang}
Adaptation instructions: ${styleGuide}
The notes MUST be extremely detailed and formatted in clean Markdown. Include:
- An engaging introduction
- Core Definitions & Theory
- Step-by-Step Practical Examples or Code Snippets (with syntax highlighting)
- Common Pitfalls / Mistakes to Avoid
- A quick summary / cheat-sheet table at the end.`;

  const r = await groq.chat.completions.create({ messages: [{ role: 'user', content: prompt }], model: 'llama-3.3-70b-versatile', temperature: 0.4 });
  return r.choices[0].message.content.trim();
};

const generateCareerGuidance = async (studiedTopics, unstudiedTopics, language = 'en') => {
  const lang = language === 'hi' ? 'Respond in Hindi.' : '';
  const prompt = `You are a Career Catalyst mapping a student's syllabus to real tech industry roles. ${lang}
Topics they HAVE covered (Studied): ${studiedTopics.join(', ') || 'None'}
Topics left in syllabus to study: ${unstudiedTopics.join(', ') || 'None'}

Recommend exactly 3 suitable tech roles (e.g., Frontend Developer, Data Analyst).
For each role, provide:
1. "title": Role name
2. "readiness": 0-100 percentage based on studied topics
3. "status": "ready" or "partial"
4. "description": Short description of why this fits their studied topics
5. "gaps": An array of EXACTLY 2-3 specific topics/skills they need to learn to get this job. Prioritize unstudied topics from their syllabus first. If their syllabus doesn't cover enough, suggest extra industry skills outside their syllabus.

Return strictly as a JSON array of objects: [{title, readiness, status, description, gaps: []}]`;
  const r = await groq.chat.completions.create({ messages: [{ role: 'user', content: prompt }], model: 'llama-3.3-70b-versatile', temperature: 0.3 });
  return safeParseJson(r.choices[0].message.content);
};

module.exports = { extractSyllabusTopics, generateQuizQuestions, gradeTheoreticalAnswer, generateExplanationStream, generateNotes, generateCareerGuidance };
