import { GoogleGenAI, Type } from "@google/genai";
import { MathProblem, QuestionBatch, Difficulty } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getSystemInstruction = (difficulty: Difficulty) => {
  const base = `You are a math teacher for 8-year-olds. Generate math problems with positive integer answers.
  CRITICAL: The 'questionText' field MUST contain the full mathematical expression including numbers and operators (e.g., "4 × 3", "12 ÷ 4").
  Do NOT format it as "4" or just the answer.
  Use '×' for multiplication and '÷' for division.
  No negative results.`;
  
  switch (difficulty) {
    case 'easy':
      return `${base}
      Difficulty Level: Beginner (Age 7-8).
      Focus:
      1. Single digit multiplication (e.g., 3 × 4).
      2. Simple addition within 20 (e.g., 8 + 7).
      3. Simple subtraction within 20 (e.g., 15 - 6).
      Keep numbers small and friendly.`;
    
    case 'medium':
      return `${base}
      Difficulty Level: Intermediate (Age 8-9).
      Focus:
      1. Addition/Subtraction within 100 (e.g., 45 + 23, 88 - 12).
      2. Single digit multiplication (e.g., 6 × 7).
      3. Simple Division: 2-digit divided by 1-digit, integer result (e.g., 24 ÷ 4).`;

    case 'hard':
      return `${base}
      Difficulty Level: Advanced (Age 8-10).
      Focus:
      1. Division: 2-digit divided by 1-digit (e.g., 72 ÷ 8).
      2. Mixed Operations: Small numbers (e.g., 5 + 3 × 2, (10-4) ÷ 2).
      3. Complex Addition/Subtraction (e.g., 100 - 45).
      Ensure order of operations is clear.`;
    
    default:
      return base;
  }
};

const sanitizeQuestionText = (text: string): string => {
  return text
    .replace(/\*/g, '×')
    .replace(/\//g, '÷')
    .replace(/x/g, '×'); // Replace letter x if used as multiply
};

export const generateQuestions = async (count: number, difficulty: Difficulty): Promise<MathProblem[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate ${count} varied math problems suitable for difficulty level: ${difficulty}.`,
      config: {
        systemInstruction: getSystemInstruction(difficulty),
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            problems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  questionText: { 
                    type: Type.STRING, 
                    description: "The FULL math expression to solve, excluding the equals sign. MUST include the operator. Example: '7 × 8' or '81 ÷ 9'." 
                  },
                  answer: { type: Type.INTEGER },
                  type: { type: Type.STRING, enum: ["multiplication", "division", "mixed", "addition", "subtraction"] },
                  difficulty: { type: Type.INTEGER },
                },
                required: ["id", "questionText", "answer", "type", "difficulty"],
              },
            },
          },
          required: ["problems"],
        },
      },
    });

    if (!response.text) {
      throw new Error("No data received from Gemini");
    }

    const data = JSON.parse(response.text) as QuestionBatch;
    
    // Sanitize and slice
    return data.problems.slice(0, count).map(p => ({
      ...p,
      questionText: sanitizeQuestionText(p.questionText)
    }));

  } catch (error) {
    console.error("Failed to generate questions:", error);
    // Fallback based on difficulty
    const fallback: MathProblem[] = [
      { id: 'f1', questionText: "5 × 6", answer: 30, type: 'multiplication', difficulty: 1 },
      { id: 'f2', questionText: "20 ÷ 4", answer: 5, type: 'division', difficulty: 1 },
      { id: 'f3', questionText: "8 + 2", answer: 10, type: 'addition', difficulty: 1 },
      { id: 'f4', questionText: "9 × 9", answer: 81, type: 'multiplication', difficulty: 1 },
      { id: 'f5', questionText: "15 - 7", answer: 8, type: 'subtraction', difficulty: 1 },
    ];
    return Array(count).fill(null).map((_, i) => ({
      ...fallback[i % fallback.length],
      id: `fallback-${i}`
    }));
  }
};