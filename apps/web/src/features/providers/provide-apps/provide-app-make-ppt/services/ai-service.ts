import { GoogleGenAI, Type } from "@google/genai";
import { GenerationParams, PresentationData, SlideLayout } from '../types';

const getAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  console.log("[AIService] API Key check:", apiKey ? "Found" : "Missing");
  if (!apiKey) {
    throw new Error("AI API Key not configured. Please set VITE_GEMINI_API_KEY environment variable.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generatePresentation = async (params: GenerationParams): Promise<PresentationData> => {
  console.log("[AIService] generatePresentation called");
  const ai = getAI();

  const prompt = `
    You are an expert presentation designer. Convert the following markdown text into a structured presentation.
    
    Configuration:
    - Target Audience: ${params.audience}
    - Tone: ${params.tone}
    - Length: ${params.length}
    
    Markdown Content:
    ${params.markdown}
    
    Instructions:
    1. Language Consistency: The output MUST be in the same language as the Markdown Content (e.g., if input is Chinese, output Chinese).
    2. Slide Separation: 
       - If the markdown uses horizontal rules ('---'), use them as strict slide boundaries.
       - If explicit slide numbers or delimiters are used, respect them.
       - Otherwise, segment the content logically based on the 'Length' parameter.
    3. Content Processing:
       - Keep the original meaning and key points.
       - Summarize long paragraphs into bullet points.
    4. Design:
       - Choose the most appropriate 'layout' for each slide (e.g., TITLE for headers, BULLET_LIST for lists, TWO_COLUMN for comparisons).
       - Create helpful speaker notes.
  `;

  console.log("[AIService] Calling AI API with model: gemini-2.5-flash");
  
  const timeoutMs = 60000;
  
  try {
    const apiCall = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            slides: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  layout: { 
                    type: Type.STRING, 
                    enum: [
                      SlideLayout.TITLE, 
                      SlideLayout.BULLET_LIST, 
                      SlideLayout.TWO_COLUMN, 
                      SlideLayout.QUOTE, 
                      SlideLayout.BIG_NUMBER
                    ] 
                  },
                  title: { type: Type.STRING },
                  subtitle: { type: Type.STRING },
                  content: { 
                    type: Type.ARRAY,
                    items: { type: Type.STRING } 
                  },
                  contentRight: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Only used for TWO_COLUMN layout"
                  },
                  footer: { type: Type.STRING },
                  speakerNotes: { type: Type.STRING }
                },
                required: ["id", "layout", "title", "content"]
              }
            }
          },
          required: ["title", "slides"]
        }
      }
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`API request timeout after ${timeoutMs / 1000} seconds`));
      }, timeoutMs);
    });

    const response = await Promise.race([apiCall, timeoutPromise]);
    console.log("[AIService] API response received:", response);

    if (!response.text) {
      console.error("[AIService] No text in response:", response);
      throw new Error("No response from AI");
    }

    let jsonString = response.text.trim();
    if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```(json)?\n/, '').replace(/\n```$/, '');
    }

    console.log("[AIService] Parsing JSON response, length:", jsonString.length);
    const parsed = JSON.parse(jsonString) as PresentationData;
    console.log("[AIService] Successfully parsed presentation with", parsed.slides?.length || 0, "slides");
    
    return parsed;
  } catch (error) {
    console.error("[AIService] Error in generatePresentation:", error);
    if (error instanceof Error) {
      const errorMessage = error.message;
      if (errorMessage.includes('timeout')) {
        throw new Error(`请求超时：API 调用超过 ${timeoutMs / 1000} 秒未响应`);
      }
      if (errorMessage.includes('API_KEY') || errorMessage.includes('apiKey')) {
        throw new Error(`API Key 错误：请检查 AI API Key 环境变量是否正确配置`);
      }
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        throw new Error(`网络错误：无法连接到 AI API，请检查网络连接`);
      }
      throw new Error(`AI API 错误：${errorMessage}`);
    }
    throw error;
  }
};

export const streamChat = async function* (history: {role: 'user'|'model', text: string}[], message: string) {
  const ai = getAI();
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    history: history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    })),
    config: {
        systemInstruction: "You are a helpful creative assistant for a presentation tool. Help the user brainstorm ideas, improve their markdown content, or suggest design tips. Keep answers concise."
    }
  });

  const result = await chat.sendMessageStream({ message });
  
  for await (const chunk of result) {
    yield chunk.text;
  }
};

