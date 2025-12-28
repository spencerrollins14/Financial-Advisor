import { GoogleGenAI, Type } from "@google/genai";
import { CategoryEnum } from "../types";

// Initialize Gemini client
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const classifyTransaction = async (merchant: string): Promise<string> => {
  if (!apiKey) return CategoryEnum.Other;

  try {
    const model = "gemini-3-flash-preview";
    const categoriesList = Object.values(CategoryEnum).join(", ");
    
    const prompt = `
      Classify the merchant "${merchant}" into exactly one of the following categories: ${categoriesList}.
      If it is a salary or deposit, use 'Income'.
      If it is unclear, use 'Other'.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              enum: Object.values(CategoryEnum)
            }
          },
          required: ["category"]
        }
      }
    });

    const text = response.text;
    if (!text) return CategoryEnum.Other;
    const data = JSON.parse(text);
    return data.category || CategoryEnum.Other;
  } catch (error) {
    return CategoryEnum.Other;
  }
};

export const parseReceipt = async (base64Data: string, mimeType: string) => {
  if (!apiKey) throw new Error("No API Key");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: "Analyze this receipt. Extract the Merchant Name, Total Amount, and Date. Return JSON." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            date: { type: Type.STRING }
          },
          required: ["merchant", "amount"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Receipt parsing failed", error);
    return null;
  }
};

export const analyzeBankStatement = async (base64Data: string, mimeType: string) => {
  if (!apiKey) throw new Error("No API Key");

  try {
    const prompt = `
      Analyze this bank statement image and extract all transactions into a JSON array.
      
      CRITICAL INSTRUCTIONS FOR ZELLE / P2P TRANSFERS:
      1. Look for keywords like "Zelle", "Venmo", "Transfer".
      2. For the 'merchant' field: Extract the RECIPIENT name (e.g., "Zelle to John Doe" -> Merchant: "John Doe").
      3. For the 'category' and 'type' fields: READ THE MEMO/REASON. 
         - If the memo says "Rent", "Mortgage", "Internet", "Utilities": Set type to 'fixed_bill' and category to 'Housing' or 'Utilities'.
         - If the memo says "Dinner", "Groceries": Set type to 'spending' and category to 'Food & Dining'.
      
      For all other transactions:
      - Identify Date, Merchant, Amount.
      - infer 'type' (income, fixed_bill, flexible_bill, spending).
      - infer 'category'.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Using Pro for complex document reasoning
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "YYYY-MM-DD" },
              merchant: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              type: { type: Type.STRING, enum: ["income", "fixed_bill", "flexible_bill", "spending"] },
              category: { type: Type.STRING }
            },
            required: ["date", "merchant", "amount", "type", "category"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Statement analysis failed", error);
    return [];
  }
};

export const analyzePaystub = async (base64Data: string, mimeType: string) => {
  if (!apiKey) throw new Error("No API Key");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: "Analyze this paystub. Extract the Payer (Employer), Total Net Pay Amount, and Date. Return JSON." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            payer: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            date: { type: Type.STRING, description: "YYYY-MM-DD" }
          },
          required: ["payer", "amount"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Paystub analysis failed", error);
    return null;
  }
};

export const getBankSuggestions = async (query: string): Promise<string[]> => {
  if (!apiKey || query.length < 2) return [];
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `List up to 5 popular banking institutions that match the prefix or name "${query}". Return only the names.`,
      config: { 
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (e) { return []; }
};

export const findNearbyPlaces = async (bankName: string, lat: number, lng: number) => {
  if (!apiKey) throw new Error("No API Key");

  try {
    const prompt = `Find the 5 closest ${bankName} branches relative to latitude ${lat}, longitude ${lng}. 
    
    IMPORTANT: If ${bankName} is primarily an online bank (e.g., Capital One, Ally, Chime, USAA) or has no physical branches nearby, find the 5 closest ATMs that are within their fee-free network (e.g., Allpoint, MoneyPass, or branded ATMs).

    For each location, provide:
    1. Name (e.g., "Capital One Café" or "CVS (Allpoint ATM)")
    2. Distance (e.g. "0.5 miles")
    3. Operating Hours (brief)
    4. Services (brief list, e.g., "ATM, Deposit, Mortgage")
    
    Return the result as a raw JSON object (no markdown) with a property "branches" which is an array of objects.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
        // responseMimeType: "application/json" is NOT supported with Google Maps tool
      }
    });

    const text = response.text || '';
    // Strip markdown code blocks if present
    const cleanedText = text.replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleanedText || '{ "branches": [] }');
    
    return data.branches || [];
  } catch (error) {
    console.error("Maps search failed", error);
    return [];
  }
};