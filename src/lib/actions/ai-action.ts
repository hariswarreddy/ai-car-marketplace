"use server";

import { aiService } from "../ai";
import { extractJSON } from "../utils";

// export const findCar = () => { };
export const autoGenerateCar = async (carName: string) => {
    const response = await aiService.generateCarAgent(carName);
    const parsed = await extractJSON(response);

    return parsed;
}