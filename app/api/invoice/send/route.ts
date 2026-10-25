import { NextRequest, NextResponse } from "next/server";

// Services
import {
    isEmailConfigured,
    SendPdfRequestError,
    sendPdfToEmailService,
} from "@/services/invoice/server/sendPdfToEmailService";

// Tofu: the answer below depends on the deployment's settings, never on a build.
export const dynamic = "force-dynamic";

/**
 * Tofu: whether sending by email is set up, so the dialog can say so before
 * anyone types an address. It answers a yes or no, never the settings.
 */
export async function GET() {
    return NextResponse.json(
        { configured: isEmailConfigured() },
        { headers: { "Cache-Control": "no-store" } }
    );
}

export async function POST(req: NextRequest) {
    try {
        const emailSent = await sendPdfToEmailService(req);

        if (emailSent) {
            return NextResponse.json(
                { message: "Email sent successfully" },
                { status: 200 }
            );
        }

        return NextResponse.json(
            { error: "Failed to send email" },
            { status: 502 }
        );
    } catch (err) {
        // Validation and rate-limit failures carry their own status and a
        // message that is safe to show the user.
        if (err instanceof SendPdfRequestError) {
            return NextResponse.json(
                { error: err.message },
                { status: err.status }
            );
        }

        console.error("Email service error:", err);
        return NextResponse.json(
            { error: "Failed to send email" },
            { status: 500 }
        );
    }
}
