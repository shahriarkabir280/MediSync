import arcjet, { tokenBucket, shield, detectBot } from "@arcjet/node";
import "dotenv/config";

export const aj = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ["ip.src"],
  rules: [
    shield({ mode: "DRY_RUN" }), // Changed to DRY_RUN for development
    // detectBot disabled for development
    tokenBucket({
      mode: "DRY_RUN", // Changed to DRY_RUN for development
      capacity: 100, // Increased capacity for development
      refillRate: 50,   // More permissive rate
      interval: 10,    // seconds
    }),
  ],
});
