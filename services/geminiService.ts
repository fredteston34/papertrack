import { GoogleGenAI } from "@google/genai";
import { PaperRoll, StockStatus } from '../types';

const getAiClient = () => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY is not defined");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeStock = async (query: string, inventory: PaperRoll[]): Promise<string> => {
    try {
        const ai = getAiClient();
        
        // Filter inventory to relevant data to save context, focus on In Stock for most queries
        const stockSummary = inventory.map(item => ({
            roll: item.rollNumber,
            product: item.eanProductCode,
            details: item.details,
            order: item.customerOrderNumber,
            status: item.status,
            dateIn: item.dateIn.split('T')[0]
        }));

        const prompt = `
        Tu es un assistant logistique expert pour une usine de papier.
        Voici les données actuelles du stock (format JSON simplifié) :
        ${JSON.stringify(stockSummary.slice(0, 100))} ${(stockSummary.length > 100) ? '... (données tronquées)' : ''}
        
        L'utilisateur demande : "${query}"
        
        Réponds de manière concise et professionnelle en français. Si tu fais des calculs, sois précis.
        Base ta réponse uniquement sur les données fournies ci-dessus.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });

        return response.text || "Désolé, je n'ai pas pu générer de réponse.";
    } catch (error) {
        console.error("Gemini Error:", error);
        return "Une erreur est survenue lors de l'analyse du stock. Vérifiez votre clé API.";
    }
};

export const suggestCategory = async (details: string): Promise<string> => {
    try {
        const ai = getAiClient();
        const prompt = `Classifie ce type de papier en 2-3 mots clés standards (ex: "Kraft 80g", "Couché Brillant") basé sur cette description: "${details}". Réponds seulement avec la catégorie.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        
        return response.text?.trim() || "Non catégorisé";
    } catch (e) {
        return "Non catégorisé";
    }
}