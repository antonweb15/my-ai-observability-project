import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import * as dotenv from "dotenv";
dotenv.config();

async function checkEmbeddings() {
    console.log("🔍 Checking embeddings...");
    try {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            throw new Error("GOOGLE_API_KEY not found in .env");
        }

        const modelName = "gemini-embedding-001";
        console.log(`📡 Using model: ${modelName}`);

        const embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: apiKey,
            modelName: modelName,
        });

        const text = "Hello world";
        console.log(`🧪 Encoding text: "${text}"`);
        
        const res = await embeddings.embedQuery(text);
        
        console.log("✅ Embeddings work!");
        console.log("📊 Vector size:", res.length);
        
        if (res.length > 0) {
            console.log("🔹 First 5 values:", res.slice(0, 5));
        } else {
            console.warn("⚠️ Vector is empty (0 dimensions)!");
        }

    } catch (e) {
        console.error("❌ Error while checking embeddings:");
        console.error(e.message);
        if (e.stack) {
            // console.error(e.stack);
        }
    }
}

checkEmbeddings();
