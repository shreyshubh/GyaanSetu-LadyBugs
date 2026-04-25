const Groq = require('groq-sdk');
require('dotenv').config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const prompt = 'You are an expert Syllabus parser. Extract the full hierarchical structure from this syllabus text. Return ONLY a strictly formatted JSON array of subjects. Each subject should have a name and an array of units. Each unit should have a name and an array of topics. Each topic should be an object with just a name string. Example format: [ { "name": "Math", "units": [ { "name": "Calc", "topics": [{ "name": "Limits" }] } ] } ] Do not include any markdown fences. Just the raw JSON array. Text: Syllabus for CS. Unit 1: Programming. Topics: Loops, Functions';
groq.chat.completions.create({ messages: [{ role: 'user', content: prompt }], model: 'llama-3.3-70b-versatile', temperature: 0.1 })
  .then(r => console.log('Result:', r.choices[0].message.content))
  .catch(console.error);
