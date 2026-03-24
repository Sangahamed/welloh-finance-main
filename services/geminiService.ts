import type { StockData, MarketIndex, AnalysisData, NewsArticle, HistoricalPricePoint, PublicTender } from '../types';

const API_BASE = '/api/gemini/generate';

const FAST_MODEL = 'gemini-2.0-flash';
const PRO_MODEL = 'gemini-2.0-flash';

const cleanJsonString = (text: string): string => {
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
        jsonText = jsonText.substring(7, jsonText.length - 3).trim();
    } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.substring(3, jsonText.length - 3).trim();
    }
    return jsonText;
};

const QUOTA_ERROR_MESSAGE =
    "⚠️ Quota API Gemini épuisé. La clé API configurée n'a plus de crédit disponible. " +
    "Rendez-vous sur https://aistudio.google.com pour créer ou vérifier votre clé, " +
    "puis mettez-la à jour dans les secrets du projet Replit (GEMINI_API_KEY).";

async function callGemini(model: string, prompt: string, useSearch = false): Promise<string> {
    const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, useSearch }),
    });
    const data = await res.json().catch(() => ({ error: res.statusText }));
    if (!res.ok) {
        if (res.status === 429) throw new Error(QUOTA_ERROR_MESSAGE);
        throw new Error(data.error || `Erreur serveur: ${res.status}`);
    }
    if (!data.text) throw new Error(data.error || "Réponse vide reçue du serveur.");
    return data.text;
}

const handleApiError = (error: unknown, genericErrorMessage: string): never => {
    console.error(`API Error:`, error);
    const msg = error instanceof Error ? error.message : String(error);
    // Preserve quota / well-known errors as-is so the UI can display them directly
    if (
        msg.includes("Quota API Gemini") ||
        msg.includes("quota") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("aistudio.google.com")
    ) {
        throw new Error(msg);
    }
    throw new Error(`${genericErrorMessage} (${msg})`);
};


export const getFinancialAnalysis = async (
  identifier: string,
  currency: string
): Promise<{ analysis: AnalysisData; news: NewsArticle[] }> => {
  const prompt = `
    En tant qu'analyste financier expert, effectue une analyse approfondie pour l'entreprise identifiée par "${identifier}".
    Ta réponse DOIT être un unique objet JSON valide, sans texte supplémentaire, ni formatage markdown.
    L'objet JSON doit avoir deux clés principales : "analysis" et "news".

    La clé "analysis" doit contenir un objet avec la structure suivante :
    - "companyName": string (Nom complet de l'entreprise)
    - "ticker": string (Le ticker boursier principal)
    - "summary": string (Un résumé concis de l'activité de l'entreprise)
    - "keyMetrics": un tableau d'objets, chacun avec :
        - "label": string (ex: "Capitalisation Boursière")
        - "value": string (ex: "2.5T ${currency}")
        - "change": string | undefined (ex: "+2.5%")
        - "changeType": "positive" | "negative" | "neutral" | undefined
        - "tooltip": string | undefined (explication de la métrique)
    - "projections": un tableau de 3 objets pour les 3 prochaines années, chacun avec :
        - "year": string (ex: "2025")
        - "revenue": number (en millions de ${currency})
        - "profit": number (en millions de ${currency})
    - "strengths": un tableau de 3 à 5 points forts (strings)
    - "weaknesses": un tableau de 3 à 5 points faibles ou risques (strings)
    - "recommendation": "Acheter" | "Conserver" | "Vendre"
    - "confidenceScore": number (de 0 à 100)

    La clé "news" doit contenir un tableau de 3 à 5 articles de presse récents pertinents, chacun avec :
    - "title": string
    - "uri": string (URL de l'article)

    Base ton analyse sur les données publiques les plus récentes. Sois réaliste et crédible. Les données financières doivent être exprimées en ${currency}.
    `;
  
  try {
    const text = await callGemini(PRO_MODEL, prompt, true);
    const parsed = JSON.parse(cleanJsonString(text));
    if (!parsed.analysis || !parsed.news) {
        throw new Error("Réponse JSON invalide de l'API: clés 'analysis' ou 'news' manquantes.");
    }
    return parsed;
  } catch (error) {
    handleApiError(error, "Impossible de générer l'analyse financière.");
  }
};

export const getStockData = async (ticker: string): Promise<StockData> => {
    const prompt = `Agis comme un simulateur de données boursières en temps réel. Pour l'action avec le ticker "${ticker}", fournis des données de marché réalistes mais fictives. Base-toi sur les informations publiques les plus récentes pour que les données soient crédibles. La réponse doit être UNIQUEMENT un objet JSON valide, sans aucun texte ou formatage supplémentaire comme du markdown.
        La structure doit être : { "companyName": string, "ticker": string, "exchange": string, "price": number, "change": number, "percentChange": string, "volume": string, "summary": string (brève description de l'entreprise), "recommendation": "Acheter" | "Conserver" | "Vendre", "confidenceScore": number (0-100) }.
        Le prix doit être un nombre réaliste. Le volume doit être une chaîne de caractères formatée (ex: "1.25M"). Le 'percentChange' doit être une chaîne de caractères avec un signe (+ ou -) et un pourcentage (ex: "+1.25%").`;
    try {
        const text = await callGemini(FAST_MODEL, prompt, true);
        return JSON.parse(cleanJsonString(text));
    } catch (error) {
        handleApiError(error, "Impossible de générer les données de l'action.");
    }
};

export const searchStocks = async (query: string): Promise<StockData[]> => {
    const prompt = `Agis comme une API de données boursières. En te basant sur la requête "${query}", fournis une liste d'actions pertinentes. La réponse doit être UNIQUEMENT un objet JSON valide sous forme de tableau, sans aucun texte ou formatage supplémentaire comme du markdown.
        Chaque objet du tableau doit avoir la structure suivante :
        {
            "companyName": string,
            "ticker": string,
            "exchange": string,
            "price": number,
            "change": number,
            "percentChange": string,
            "volume": string,
            "summary": string,
            "recommendation": "Acheter" | "Conserver" | "Vendre",
            "confidenceScore": number (0-100),
            "marketCap": string (ex: "2.5T", "500B", "10M"),
            "country": string (ex: "USA", "Côte d'Ivoire")
        }
        Fournis des données réalistes mais fictives, basées sur des informations publiques récentes pour la crédibilité. Inclus une bonne variété d'actions, y compris des actions africaines si la requête est générale.`;
    try {
        const text = await callGemini(PRO_MODEL, prompt, true);
        const data = JSON.parse(cleanJsonString(text));
        if (!Array.isArray(data)) {
            throw new Error("Le format des données de recherche d'actions est invalide.");
        }
        return data;
    } catch (error) {
        handleApiError(error, "Impossible de rechercher les actions.");
    }
};

export const getHistoricalStockData = async (ticker: string): Promise<HistoricalPricePoint[]> => {
    const prompt = `Agis comme un simulateur de données boursières historiques. Pour le ticker "${ticker}", génère une série de données de prix de clôture pour les 30 derniers jours (aujourd'hui inclus). La réponse doit être UNIQUEMENT un tableau JSON valide d'objets, sans aucun texte ou formatage supplémentaire. Chaque objet doit représenter un jour et avoir la structure : { "date": "YYYY-MM-DD", "price": number }. Le tableau doit être ordonné du jour le plus ancien au plus récent. Les prix doivent montrer une volatilité réaliste et suivre une tendance crédible basée sur la performance récente de l'entreprise.`;
    try {
        const text = await callGemini(FAST_MODEL, prompt, true);
        const data = JSON.parse(cleanJsonString(text));
        if (!Array.isArray(data) || data.some((item: any) => typeof item.date !== 'string' || typeof item.price !== 'number')) {
            throw new Error("Le format des données historiques est invalide.");
        }
        return data;
    } catch (error) {
        handleApiError(error, "Impossible de générer les données historiques de l'action.");
    }
};

export const getMarketOverview = async (): Promise<MarketIndex[]> => {
    const prompt = `Fournis un aperçu des principaux indices boursiers mondiaux (S&P 500, NASDAQ, CAC 40) et africains (BRVM Composite, JSE All Share, NSE All Share - Nigeria). 
    Pour chaque indice, retourne un objet JSON avec exactement ces champs :
    - "name": string (nom de l'indice)
    - "value": string (valeur actuelle formatée, ex: "4,783.35")
    - "change": string (variation en points avec signe, ex: "+12.5" ou "-8.2")
    - "percentChange": string (variation en pourcentage avec signe, ex: "+0.26%" ou "-0.18%")
    - "changeType": "positive" | "negative" | "neutral"
    La réponse doit être UNIQUEMENT un tableau JSON valide de 5 à 6 objets, sans aucun texte ou formatage markdown supplémentaire.`;

    try {
        const text = await callGemini(FAST_MODEL, prompt, true);
        const data = JSON.parse(cleanJsonString(text));
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error("Format de réponse invalide pour les indices de marché.");
        }
        return data;
    } catch (error) {
        handleApiError(error, "Impossible de récupérer l'aperçu du marché.");
    }
};

export const searchPublicTenders = async (query: string): Promise<PublicTender[]> => {
    const prompt = `Agis comme une API de base de données de marchés publics. En te basant sur la requête "${query}", fournis une liste d'appels d'offres publics pertinents, avec un focus sur les marchés africains si la requête est générale. La réponse doit être UNIQUEMENT un objet JSON valide sous forme de tableau, sans aucun texte ou formatage supplémentaire comme du markdown.
        Chaque objet du tableau doit avoir la structure suivante :
        {
            "id": string (un identifiant unique que tu génères, ex: "tend_12345"),
            "title": string,
            "country": string,
            "sector": string,
            "issuingEntity": string,
            "summary": string,
            "deadline": "YYYY-MM-DD",
            "uri": string (une URL source valide)
        }
        Retourne entre 5 et 10 appels d'offres réalistes mais fictifs. Assure-toi que les données sont crédibles et bien formatées.`;
    try {
        const text = await callGemini(PRO_MODEL, prompt, true);
        const data = JSON.parse(cleanJsonString(text));
        if (!Array.isArray(data)) {
            throw new Error("Le format des données des appels d'offres est invalide.");
        }
        return data;
    } catch (error) {
        handleApiError(error, "Impossible de rechercher les appels d'offres.");
    }
};

export const generateStrategyStream = async (prompt: string): Promise<AsyncIterable<string>> => {
    const fullPrompt = `Agis en tant que conseiller financier expert et mentor. Génère une stratégie d'investissement détaillée ou une réponse instructive basée sur la demande suivante : "${prompt}". La réponse doit être bien structurée, informative, et facile à comprendre. Utilise le format Markdown.`;

    const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: FAST_MODEL, prompt: fullPrompt, stream: true }),
    });

    if (!res.ok || !res.body) {
        throw new Error("Impossible de démarrer le flux de génération de stratégie.");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    async function* generateChunks(): AsyncIterable<string> {
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') return;
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.text) yield parsed.text;
                    } catch {}
                }
            }
        }
    }

    return generateChunks();
};

export const generatePredictionIdeas = async (category: string): Promise<{ title: string; description: string; options: string[]; analysisRationale: string }[]> => {
    const prompt = `Tu es un expert des marchés financiers. Génère 3 idées de prédictions de marché dans la catégorie "${category}" adaptées à la plateforme Welloh (focus marchés africains et mondiaux).
    La réponse doit être UNIQUEMENT un tableau JSON valide sans markdown avec la structure suivante pour chaque prédiction :
    {
        "title": string (question courte et précise, ex: "Le BRVM Composite dépassera 300 points d'ici fin 2025 ?"),
        "description": string (contexte et enjeux, 2-3 phrases),
        "options": string[] (tableau de 2-3 options possibles, ex: ["Oui", "Non"] ou ["Hausser", "Stable", "Baisser"]),
        "analysisRationale": string (brève analyse justifiant la question)
    }
    Assure-toi que les prédictions sont réalistes, d'actualité, et axées sur l'Afrique si la catégorie s'y prête.`;
    try {
        const text = await callGemini(FAST_MODEL, prompt);
        const data = JSON.parse(cleanJsonString(text));
        if (!Array.isArray(data)) throw new Error("Format invalide");
        return data;
    } catch (error) {
        handleApiError(error, "Impossible de générer des idées de prédictions.");
    }
};

export const getPostTradeFeedback = async (
    tradeType: 'buy' | 'sell',
    ticker: string,
    shares: number,
    price: number,
    orderType: string,
    portfolioCash: number,
    portfolioValue: number,
    recommendation: string,
    confidenceScore: number
): Promise<{ grade: string; summary: string; strengths: string[]; improvements: string[]; advice: string }> => {
    const totalCost = shares * price;
    const portfolioAllocation = portfolioValue > 0 ? ((totalCost / portfolioValue) * 100).toFixed(1) : '0';
    const prompt = `Tu es un mentor financier expert. Un utilisateur vient d'effectuer le trade suivant :
- Action : ${ticker}
- Type : ${tradeType === 'buy' ? 'Achat' : 'Vente'}
- Quantité : ${shares} actions
- Prix : $${price.toFixed(2)}
- Type d'ordre : ${orderType}
- Coût total : $${totalCost.toFixed(2)}
- Allocation du portefeuille : ${portfolioAllocation}%
- Cash restant après trade : $${portfolioCash.toFixed(2)}
- Recommandation IA sur ce titre : ${recommendation} (confiance : ${confidenceScore}%)

Analyse cette décision de trading et fournis un feedback pédagogique. Réponds UNIQUEMENT en JSON valide sans markdown :
{
  "grade": "A" | "B" | "C" | "D" | "F",
  "summary": "Résumé court de la décision (1-2 phrases)",
  "strengths": ["point fort 1", "point fort 2"],
  "improvements": ["point à améliorer 1", "point à améliorer 2"],
  "advice": "Conseil concret pour le prochain trade (1 phrase)"
}`;
    try {
        const text = await callGemini(FAST_MODEL, prompt);
        return JSON.parse(cleanJsonString(text));
    } catch (error) {
        handleApiError(error, "Impossible de générer le feedback post-trade.");
    }
};

export const generateQuiz = async (
    topic: string,
    difficulty: string,
    count: number = 5
): Promise<import('../types').QuizQuestion[]> => {
    const prompt = `Tu es un éducateur financier expert. Génère ${count} questions de quiz sur le thème "${topic}" pour un niveau "${difficulty}".
Réponds UNIQUEMENT avec un tableau JSON valide sans texte ni markdown. Chaque objet doit avoir:
- "question": string (la question)
- "options": string[] (exactement 4 options de réponse)
- "correctIndex": number (index 0-3 de la bonne réponse)
- "explanation": string (explication pédagogique de 1-2 phrases)

Les questions doivent être pertinentes pour les marchés africains et mondiaux. Pour débutant: notions de base. Pour intermédiaire: analyse technique/fondamentale. Pour avancé: stratégies complexes, ratios avancés.`;
    try {
        const text = await callGemini(FAST_MODEL, prompt);
        const data = JSON.parse(cleanJsonString(text));
        if (!Array.isArray(data)) throw new Error("Format inattendu");
        return data;
    } catch (error) {
        handleApiError(error, "Impossible de générer le quiz.");
    }
};

export const getEducationalContentStream = async (topic: string): Promise<AsyncIterable<string>> => {
    const prompt = `En tant qu'éducateur financier expert, rédige un article clair et concis sur le sujet suivant : "${topic}".
    L'article doit être bien structuré, facile à comprendre pour un public varié (allant du débutant à l'intermédiaire), et utiliser le format Markdown.
    Inclus des titres, des listes à puces si nécessaire, et mets en gras les termes importants.
    L'objectif est d'être informatif et engageant.`;

    const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: FAST_MODEL, prompt, stream: true }),
    });

    if (!res.ok || !res.body) {
        throw new Error("Impossible de démarrer le flux de contenu éducatif.");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    async function* generateChunks(): AsyncIterable<string> {
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') return;
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.text) yield parsed.text;
                    } catch {}
                }
            }
        }
    }

    return generateChunks();
};
