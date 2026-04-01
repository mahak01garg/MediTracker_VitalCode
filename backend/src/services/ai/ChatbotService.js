const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../../utils/logger");
const Dose = require("../../models/Dose");
const Medication = require("../../models/Medication");

let genAI = null;
let isAIConfigured = false;

try {
    const apiKey = process.env.GOOGLE_API_KEY;

    if (apiKey && apiKey.trim() && apiKey.startsWith("AIza")) {
        genAI = new GoogleGenerativeAI(apiKey.trim());
        isAIConfigured = true;
        logger.info("Gemini AI service initialized.");
    } else {
        logger.warn("Gemini API key missing. AI features disabled.");
    }
} catch (error) {
    logger.error("Gemini initialization error:", error.message);
}

class ChatbotService {
    constructor() {
        this.availableModels = [
            "gemini-2.0-flash-lite",
            "gemini-flash-lite-latest",
            "gemini-flash-latest",
        ];
        this.requestTimeoutMs = 12000;
    }

    buildPrompt(query) {
        return [
            "You are MediTracker AI, a medication assistant inside a medication tracking app.",
            "Answer in a calm, practical tone.",
            "Use short paragraphs or bullet points when helpful.",
            "Keep the answer concise and readable, usually under 160 words.",
            "Do not use markdown tables or decorative symbols.",
            "If the question could affect safety, briefly remind the user to consult a healthcare professional.",
            `User question: "${query}"`,
        ].join("\n");
    }

    isTodayDoseQuery(query) {
        const lowerQuery = String(query || "").toLowerCase();
        const asksForToday = /\btoday\b/.test(lowerQuery);
        const asksForMedicationData =
            /(dose|doses|doese|medicine|medicines|medication|medications|schedule|scheduled|reminder|pill|pills|tablet|tablets|med|meds)/.test(
                lowerQuery
            );

        return (
            asksForToday &&
            asksForMedicationData
        );
    }

    async getTodayDoseData(userId) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const doses = await Dose.find({
            userId,
            scheduledTime: { $gte: startOfDay, $lt: endOfDay },
        })
            .populate("medicationId", "name dosage")
            .sort({ scheduledTime: 1 });

        const activeMedications = await Medication.find({
            userId,
            isActive: true,
        }).select("name dosage schedule");

        return { doses, activeMedications, startOfDay };
    }

    formatTime(date) {
        return new Date(date).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    buildTodayDoseResponse(data) {
        const { doses, activeMedications } = data;

        if (!activeMedications.length) {
            return [
                "You do not have any active medications right now.",
                "Add a medication first, then I can show your doses for today.",
            ].join("\n\n");
        }

        if (!doses.length) {
            return [
                "I could not find any generated doses for today in your account.",
                `You currently have ${activeMedications.length} active medication${activeMedications.length === 1 ? "" : "s"}.`,
                "If you already set schedules, use Generate Today's Doses and then ask me again.",
            ].join("\n\n");
        }

        const pending = doses.filter((dose) => dose.status === "pending" || dose.status === "snoozed");
        const taken = doses.filter((dose) => dose.status === "taken");
        const missed = doses.filter((dose) => dose.status === "missed");

        const lines = [];
        lines.push(`You have ${doses.length} dose${doses.length === 1 ? "" : "s"} scheduled for today.`);

        if (pending.length) {
            lines.push("");
            lines.push(`Upcoming or pending (${pending.length}):`);
            pending.forEach((dose) => {
                const name = dose.medicationId?.name || "Medication";
                const dosage = dose.medicationId?.dosage || dose.dosage || "";
                lines.push(`- ${name}${dosage ? ` ${dosage}` : ""} at ${this.formatTime(dose.scheduledTime)}`);
            });
        }

        if (taken.length) {
            lines.push("");
            lines.push(`Taken (${taken.length}):`);
            taken.forEach((dose) => {
                const name = dose.medicationId?.name || "Medication";
                const dosage = dose.medicationId?.dosage || dose.dosage || "";
                lines.push(`- ${name}${dosage ? ` ${dosage}` : ""} at ${this.formatTime(dose.scheduledTime)}`);
            });
        }

        if (missed.length) {
            lines.push("");
            lines.push(`Missed (${missed.length}):`);
            missed.forEach((dose) => {
                const name = dose.medicationId?.name || "Medication";
                const dosage = dose.medicationId?.dosage || dose.dosage || "";
                lines.push(`- ${name}${dosage ? ` ${dosage}` : ""} at ${this.formatTime(dose.scheduledTime)}`);
            });
        }

        return lines.join("\n");
    }

    async buildUserContext(userId, query) {
        if (!userId) {
            return "";
        }

        if (this.isTodayDoseQuery(query)) {
            const todayData = await this.getTodayDoseData(userId);
            return `User medication data for today:\n${this.buildTodayDoseResponse(todayData)}`;
        }

        return "";
    }

    async generateWithTimeout(model, prompt) {
        const generationPromise = model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }],
                },
            ],
            generationConfig: {
                temperature: 0.5,
                topK: 20,
                topP: 0.9,
                maxOutputTokens: 220,
            },
        });

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("AI request timeout")), this.requestTimeoutMs);
        });

        const result = await Promise.race([generationPromise, timeoutPromise]);
        const response = await result.response;
        return response.text();
    }

    async processQuery(userId, query) {
        const userContext = await this.buildUserContext(userId, query);

        if (userContext && this.isTodayDoseQuery(query)) {
            return userContext.replace(/^User medication data for today:\n/, "");
        }

        if (!isAIConfigured || !genAI) {
            return this.getFallbackResponse(query, userContext);
        }

        const prompt = [this.buildPrompt(query), userContext].filter(Boolean).join("\n\n");

        for (const modelName of this.availableModels) {
            try {
                logger.info(`Trying Gemini model: ${modelName}`);

                const model = genAI.getGenerativeModel({ model: modelName });
                const aiResponse = await this.generateWithTimeout(model, prompt);

                logger.info(`AI response generated with model: ${modelName}`);

                return {
                    success: true,
                    response: aiResponse,
                    model: modelName,
                };
            } catch (error) {
                logger.warn(`Model ${modelName} failed: ${error.message}`);

                const message = error.message.toLowerCase();
                const isRetryable =
                    message.includes("quota") ||
                    message.includes("billing") ||
                    message.includes("not found") ||
                    message.includes("timeout") ||
                    message.includes("unavailable");

                if (!isRetryable) {
                    break;
                }
            }
        }

        logger.warn("All Gemini models failed. Using fallback response.");
        return this.getFallbackResponse(query, userContext);
    }

    getFallbackResponse(query, userContext = "") {
        const lowerQuery = String(query || "").toLowerCase();

        if (userContext) {
            return userContext.replace(/^User medication data for today:\n/, "");
        }

        if (/(hi|hello|hey)/.test(lowerQuery)) {
            return "Hello! I'm your MediTracker AI Assistant. How can I help with your medications today?";
        }

        if (/(schedule|time|when|reminder)/.test(lowerQuery)) {
            return [
                "Medication scheduling tips:",
                "- Take medicines at the same time each day.",
                "- Turn on reminders in MediTracker.",
                "- Keep medicines in a visible, safe place.",
                "- Ask your doctor before changing timing.",
                "",
                "If you are unsure about your schedule, check with your healthcare professional.",
            ].join("\n");
        }

        if (/(side effect|side-effects|effect|symptom)/.test(lowerQuery)) {
            return [
                "Side effect guidance:",
                "- Track when the symptom started and how strong it feels.",
                "- Contact your doctor for severe or unusual symptoms.",
                "- Do not stop a prescribed medicine suddenly unless a clinician tells you to.",
                "",
                "For urgent symptoms, seek medical care right away.",
            ].join("\n");
        }

        if (/(forgot|missed|skip)/.test(lowerQuery)) {
            return [
                "Missed dose guidance:",
                "1. Take it when you remember if it is still safe to do so.",
                "2. If it is almost time for the next dose, skip the missed one.",
                "3. Do not double the next dose unless your doctor told you to.",
                "4. Mark the dose in MediTracker so your schedule stays accurate.",
                "",
                "Check the medication instructions or ask a healthcare professional if you are unsure.",
            ].join("\n");
        }

        return [
            "I can help with:",
            "- Medication timing and reminders",
            "- Missed dose questions",
            "- Side effect guidance",
            "- Adherence tips",
            "",
            "Ask me a medication question, and I will keep the answer simple and practical.",
        ].join("\n");
    }

    async answerGeneralQuestion(query, userId) {
        return this.processQuery(userId, query);
    }

    async healthCheck() {
        if (!isAIConfigured || !genAI) {
            return {
                service: "Google Gemini AI",
                configured: false,
                status: "DISABLED",
                error: "API key not configured",
            };
        }

        for (const modelName of this.availableModels.slice(0, 2)) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const text = await this.generateWithTimeout(model, "Reply with OK");

                return {
                    service: "Google Gemini AI",
                    configured: true,
                    status: "ACTIVE",
                    workingModel: modelName,
                    testResponse: text,
                    availableModels: this.availableModels,
                };
            } catch (error) {
                logger.warn(`Health check failed for ${modelName}: ${error.message}`);
            }
        }

        return {
            service: "Google Gemini AI",
            configured: true,
            status: "ERROR",
            error: "All models failed",
            fallback: "Using local fallback responses",
            availableModels: this.availableModels,
        };
    }
}

module.exports = new ChatbotService();
