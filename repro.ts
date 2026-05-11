
import { AiService } from "./src/ai/ai.service";
import * as dotenv from "dotenv";

dotenv.config();

async function test() {
    const aiService = new AiService();
    // We need to mock or provide environment variables because NestJS injects them usually
    // But AiService constructor uses process.env directly, which is fine since we called dotenv.config()
    
    console.log("Starting test...");
    await aiService.onModuleInit();
    console.log("Test finished.");
}

test().catch(console.error);
