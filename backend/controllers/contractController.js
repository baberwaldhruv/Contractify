const Groq = require("groq-sdk");
const PDFParser = require("pdf2json");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function extractTextFromPDF(buffer) {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();

        pdfParser.on("pdfParser_dataError", (err) => {
            reject(err.parserError);
        });

        pdfParser.on("pdfParser_dataReady", (pdfData) => {
            const pages = pdfData.Pages || [];
            let fullText = '';

            pages.forEach(page => {
                page.Texts.forEach(textItem => {
                    textItem.R.forEach(r => {
                        fullText += decodeURIComponent(r.T) + ' ';
                    });
                });
                fullText += '\n';
            });

            resolve({
                text: fullText,
                numpages: pages.length
            });
        });

        pdfParser.parseBuffer(buffer);
    });
}

exports.analyzeContract = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded." });
        }

        const data = await extractTextFromPDF(req.file.buffer);
        const contractText = data.text;

        if (!contractText || contractText.trim().length === 0) {
            return res.status(400).json({ error: "Could not extract text from PDF." });
        }

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "user",
                    content: `
                        You are a professional legal assistant. Analyze the following contract text:
                        
                        1. Provide a "TL;DR" summary in 5 bullet points.
                        2. Identify any "Red Flags" or high-risk clauses (e.g., predatory fees, termination penalties, or unfair liability).
                        3. List key dates or deadlines mentioned.

                        Contract Text:
                        ${contractText.substring(0, 30000)}
                    `
                }
            ]
        });

        const analysisText = completion.choices[0].message.content;

        res.status(200).json({
            success: true,
            analysis: analysisText,
            pageCount: data.numpages
        });

    } catch (error) {
        console.error("Analysis Error:", error);
        res.status(500).json({ error: "Failed to analyze contract." });
    }
};

exports.chatWithContract = async (req, res) => {
    try {
        const { question, fullText } = req.body;

        if (!question || !fullText) {
            return res.status(400).json({ error: "Missing question or contract context." });
        }

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "user",
                    content: `
                        Based ONLY on the contract text provided below, answer this question: "${question}"
                        If the answer is not in the text, say "I cannot find this information in the contract."

                        Contract Text:
                        ${fullText.substring(0, 20000)}
                    `
                }
            ]
        });

        res.status(200).json({
            answer: completion.choices[0].message.content
        });

    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: "Chatbot failed to respond." });
    }
};