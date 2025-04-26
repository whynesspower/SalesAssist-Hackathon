import { NextResponse } from "next/server";
import { getUserAuth } from "@/lib/auth/utils"; // Import your auth options
import { db } from "@/lib/db"; // Import your database instance

// Pro questions array with 12 customized yes/no questions
const proQuestions = [
  "Do you want to allow commercial use of your code?",
  "Is it important that your code can be modified by others?",
  "Do you want your modified code to remain open source?",
  "Is patent protection an important consideration for your project?",
  "Would you like to enforce the same license on modified versions of your code?",
  "Do you want to permit use of your code in closed-source or proprietary software?",
  "Is it important for you that users disclose their source when they use your code over a network (e.g., SaaS)?",
  "Do you prefer a license that is short and easy to understand?",
  "Would you like your code to be in the public domain?",
  "Is it important that attribution be given to you as the original author?",
  "Do you want the ability to add or change the license in future versions?",
  "Is it important that users can sublicense your code?",
];

export async function GET(request: Request) {
  // Step 1: Check if the user is logged in
  const { session } = await getUserAuth();
  if (!session) {
    // If no session, return 401 Unauthorized
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Step 2: Check if the session is valid (from the database)
  const userId = await session.user.id;
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    // If the user doesn't exist, return 401 Unauthorized
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Step 3: Check if the user is a 'pro' user
  if (!user.isPro) {
    // If not a pro user, return 403 Forbidden
    return NextResponse.json(
      { error: "Forbidden: You need to be a pro user" },
      { status: 403 }
    );
  }

  // Step 4: If all checks pass, return the pro questions
  return NextResponse.json({ questions: proQuestions });
}
