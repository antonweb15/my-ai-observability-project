import { AiService } from "./src/ai/ai.service";
import * as dotenv from "dotenv";
dotenv.config();
async function check() {
    const aiService = new AiService();
    const handler = (aiService as any).langfuseHandler;
    console.log("--- Before call ---");
    console.log("TraceId:", handler.traceId);
    await aiService.generateSeoWithRag("Test product", "test");
    console.log("--- After call ---");
    console.log("TraceId after all:", handler.traceId);
    await handler.flushAsync();
    console.log("Finish");
}
check().catch(console.error);