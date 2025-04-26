import { NextResponse } from "next/server";

// Pro questions array with optimized questions
const standardQuestions = [
  "Do you want to allow commercial use of your code?",
  "Is it important that modified versions of your code are also open source?",
  "Do you need patent protection in your license?",
  "Do you want to enforce open source for network use (e.g., SaaS)?",
  "Do you prefer a short and simple license?",
  "Do you want your code to be in the public domain?",
];

export async function GET(request: Request) {
  // Return the optimized questions
  return NextResponse.json({ questions: standardQuestions });
}
