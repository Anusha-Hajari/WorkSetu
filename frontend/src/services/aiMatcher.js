import { GoogleGenAI } from "@google/genai";

// Initialize Gemini with your VITE_ prefix API key
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

/**
 * AI Scoring Engine: Matches real candidates from your DB against job details.
 * Evaluates Skill, Rating, History, Pricing, and Logistics.
 */
export async function matchCandidates(job, candidates) {
  const prompt = `
    You are the WorkSetu AI Scoring Engine. Your task is to rank the best matches from the candidate pool.
    
    EVALUATION FACTORS:
    1. SKILL MATCH: Relevance of candidate expertise to the job title and description.
    2. RATING: Prioritize workers with high stars/feedback.
    3. HISTORY: Value candidates with high job completion counts.
    4. PRICING: Match candidate rates to the budget: ₹${job.rate || 'Negotiable'}.
    5. LOGISTICS: Factor in distance to ${job.location || 'Remote'}.

    ---
    JOB DETAILS: 
    ${JSON.stringify(job)}

    CANDIDATE POOL: 
    ${JSON.stringify(candidates)}
    ---

    OUTPUT FORMAT:
    Return a JSON object with a single key 'matches' containing an array of the top 3 candidates.
    Each object in the array must have:
    - id: The original candidate ID string.
    - score: An integer from 0 to 100.
    - breakdown: { skill: (%), rating: (%), logistics: (%) }
    - matchReason: A one-sentence explanation of the match win.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { 
        responseMimeType: "application/json" 
      }
    });

    // Parse the AI response
    const result = JSON.parse(response.text || "{}");
    return result; 
  } catch (error) {
    console.error("Multi-factor matchmaking failed:", error);
    // Return empty results so the frontend doesn't crash
    return { matches: [] };
  }
}