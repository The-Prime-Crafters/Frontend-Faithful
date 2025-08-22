// utils/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyBW55O1a9QNBFwM2SawfxVtpNBpDRl786c'); // Replace with your actual API key

export async function queryGemini(prompt: string) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error querying Gemini:', error);
    return "I'm having trouble answering that right now. Please try again later.";
  }
}