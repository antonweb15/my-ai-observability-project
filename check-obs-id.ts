import { AiService } from "./src/ai/ai.service";
import * as dotenv from "dotenv";
dotenv.config();
async function check() {
    const aiService = new AiService();
    const handler = (aiService as any).langfuseHandler;
    await aiService.generateSeoWithRag("Test", "tools");
    console.log("TraceId:", handler.traceId);
    console.log("ObservationId:", handler.observationId);
}
check().catch(console.error);