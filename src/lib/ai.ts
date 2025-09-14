import "server-only";

import { generateText, LanguageModel, zodSchema } from "ai";
import { google } from "@ai-sdk/google";
import { GEMINI_FLASH } from "@/constants/config";
import { addCarSchema } from "./zod";
import { generateCarPrompt } from "./prompts";

class AIService {
  private model: LanguageModel;
  public searchModel: LanguageModel;
  constructor() {
    this.model = google("gemini-2.0-flash");

    this.searchModel = google("gemini-2.0-flash");
  }
  generativeAI = async () => {};
  generateCarAgent = async (carName: string) => {
    const modifiedSchema = zodSchema(addCarSchema).jsonSchema;

    const { text } = await generateText({
      model: this.searchModel,
      messages: [
        {
          role: "assistant",
          content: generateCarPrompt,
        },
        {
          role: "assistant",
          content: "The car Zod schema is: " + JSON.stringify(modifiedSchema),
        },
        {
          role: "user",
          content: `The car name is ${carName} `,
        },
      ],
    });
    return text;
  };
}

export const aiService = new AIService();