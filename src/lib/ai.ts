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

  searchAgent = async (carDescription: string) => {
    const cars = await getAllCars();

    const carsLists = cars.map((car) => ({
      id: car.id,
      name: car.name,
      year: car.year,
      mileage: car.mileage,
      price: car.price,
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

    return text;
  };
}

export const aiService = new AIService();