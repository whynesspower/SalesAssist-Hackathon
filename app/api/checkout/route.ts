export const dynamic = "force-dynamic"; // This replaces the old config
import { NextRequest, NextResponse } from "next/server";

import { getUserAuth } from "@/lib/auth/utils"; // Import your auth options
import { db } from "@/lib/db"; // Import your database instance

const LEMON_SQUEEZY_ENDPOINT = "https://api.lemonsqueezy.com/v1/";

async function lemonSqueezyApiInstance(
  endpoint: string,
  method: string,
  body?: any
) {
  const response = await fetch(`${LEMON_SQUEEZY_ENDPOINT}${endpoint}`, {
    method,
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return response.json();
}

export async function POST() {
  try {
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
    const response = await lemonSqueezyApiInstance("checkouts", "POST", {
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            custom: {
              user_id: userId,
            },
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: process.env.LEMON_SQUEEZY_STORE_ID,
            },
          },
          variant: {
            data: {
              type: "variants",
              id: process.env.LEMON_SQUEEZY_VARIANT_ID,
            },
          },
        },
      },
    });

    const checkoutUrl = response.data.attributes.url;

    console.log(response.data);
    console.log("checkut URL is ", checkoutUrl);
    return NextResponse.json({ checkoutUrl }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}
