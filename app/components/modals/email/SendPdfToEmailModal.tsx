"use client";

import React, { useEffect, useState } from "react";

// ShadCn
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Components
import { BaseButton } from "@/app/components";

// Helpers
import { isValidEmail } from "@/lib/helpers";

// Variables
// Tofu: EMAIL_NOT_SET_UP is shown instead of the form while the site has no
// email settings.
import { EMAIL_NOT_SET_UP, SEND_PDF_API } from "@/lib/variables";

type SendPdfToEmailModalProps = {
    sendPdfToMail: (email: string) => Promise<void>;
    children: React.ReactNode;
};

const SendPdfToEmailModal = ({
    sendPdfToMail,
    children,
}: SendPdfToEmailModalProps) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    // Tofu: null until the server has said whether sending is set up.
    const [configured, setConfigured] = useState<boolean | null>(null);
    const errorMessage = "Please enter a valid email address";

    useEffect(() => {
        if (!open || configured !== null) return;
        const controller = new AbortController();
        fetch(SEND_PDF_API, { signal: controller.signal, cache: "no-store" })
            .then((res) => (res.ok ? res.json() : null))
            .then((body) => {
                if (body && typeof body.configured === "boolean") {
                    setConfigured(body.configured);
                }
            })
            // Unknown stays unknown: the form is offered, and the send itself
            // reports what went wrong.
            .catch(() => {});
        return () => controller.abort();
    }, [open, configured]);

    const handleSendPdf = () => {
        setLoading(true);

        if (isValidEmail(email)) {
            sendPdfToMail(email).finally(() => {
                setError("");
                setLoading(false);
                setEmail("");
                setOpen(false);
            });
        } else {
            setLoading(false);
            setError(errorMessage);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>

            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Send to email</DialogTitle>
                    <DialogDescription>
                        {configured === false
                            ? EMAIL_NOT_SET_UP
                            : "Please specify the email address for invoice delivery."}
                    </DialogDescription>
                </DialogHeader>
                {configured !== false && (
                    <>
                        <Label>Email</Label>
                        <Input
                            type="email"
                            placeholder="Enter email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        ></Input>

                        {!loading && error && (
                            <small style={{ color: "red" }}>{error}</small>
                        )}

                        <BaseButton
                            tooltipLabel="Send invoice PDF"
                            loading={loading}
                            loadingText="Sending email"
                            onClick={handleSendPdf}
                        >
                            Send PDF
                        </BaseButton>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default SendPdfToEmailModal;
