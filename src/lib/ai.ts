import "server-only";

import { generateText, LanguageModel, zodSchema } from "ai";
import { google } from "@ai-sdk/google";
import { addCarSchema } from "./zod";
import { generateCarPrompt, searchCarPrompt } from "./prompts";
import { getAllCars } from "./actions/cars-action";

class AIService {
  private model: LanguageModel;
  public searchModel: LanguageModel;
  constructor() {
    this.model = google("gemini-2.5-flash");
    this.searchModel = google("gemini-2.5-flash");
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

  searchAgent = async (carDescription: string) => {
    // 1. Get the real data from DB
    const cars = await getAllCars();

    // 2. Prepare the list for AI (Same as before)
    const carsLists = cars.map((car) => ({
      id: car.id,
      name: car.name,
      year: car.year,
      mileage: car.mileage,
      price: car.price,
      // You can actually REMOVE image here to save tokens,
      // since we will patch it back in later anyway.
      image: car.images[0],
      description: car.description,
      brand: car.brand,
      fuel: car.fuelType,
      transmission: car.transmission,
      availbleColors: car.colors,
      location: car.location,
      features: car.features,
      carType: car.type,
    }));

    // 3. Generate the response (Same as before)
    const { text } = await generateText({
      model: this.searchModel,
      messages: [
        {
          role: "assistant",
          content: searchCarPrompt,
        },
        {
          role: "assistant",
          content: "The car list is: " + JSON.stringify(carsLists),
        },
        {
          role: "user",
          content: carDescription,
        },
      ],
    });

    // --- NEW LOGIC STARTS HERE ---

    try {
      // 4. Parse the AI's response into a Javascript Object
      // (The AI returns a string, so we turn it back into code)
      const aiResults = JSON.parse(text);

      // 5. THE FIX: Loop through AI results and put the REAL image back
      // We assume aiResults is an array of cars (or a single car object)
      const patchedResults = Array.isArray(aiResults)
        ? aiResults.map((aiCar: any) => {
            // Find the ORIGINAL car from your database using the ID
            const originalCar = cars.find((c) => c.id === aiCar.id);

            // If we found it, force the image to be the real one
            if (originalCar) {
              return {
                ...aiCar,
                image: originalCar.images[0], // <--- The Source of Truth
              };
            }
            return aiCar;
          })
        : aiResults; // Handle case where it might not be an array

      // 6. Turn it back into text to match your original return type
      return JSON.stringify(patchedResults);
    } catch (error) {
      console.error("Failed to patch images:", error);
      // Fallback: If parsing fails, just return what the AI gave us
      return text;
    }
  };
}

export const aiService = new AIService();
