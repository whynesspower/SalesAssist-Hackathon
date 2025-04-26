import { NextRequest, NextResponse } from 'next/server';
import crypto from "crypto";
import { db } from "@/lib/db";

interface WebhookBody {
  meta: {
    custom_data: {
      user_id: string;
    };
  };
  data: {
    attributes: {
      status: string;
    };
  };
}

export async function POST(req: NextRequest) {
  try {
    // Catch the event type
    const clonedReq = req.clone();
    const eventType = req.headers.get("X-Event-Name");
    const body: WebhookBody = await req.json();

    // Check signature
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SIGNATURE;
    if (!secret) {
      throw new Error("Webhook signature secret is not set");
    }
    const hmac = crypto.createHmac("sha256", secret);
    const digest = Buffer.from(
      hmac.update(await clonedReq.text()).digest("hex"),
      "utf8"
    );
    const signature = Buffer.from(req.headers.get("X-Signature") || "", "utf8");

    if (!crypto.timingSafeEqual(digest, signature)) {
      throw new Error("Invalid signature.");
    }

    // console.log(body);
    // Logic according to event
    if (eventType === "order_created") {
      const userId = body.meta.custom_data.user_id;
      const isSuccessful = body.data.attributes.status === "paid";
      
      if (isSuccessful) {
        // Update user's isPro status in the database
        await db.user.update({
          where: { id: userId },
          data: { isPro: true },
        });
        
        console.log(`User ${userId} has been upgraded to Pro status.`);
      }
    }
    return NextResponse.json({ message: "Webhook received" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}