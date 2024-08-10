import { Resend } from "resend";
import { Body, Container, Head, Html, Preview, Text } from "@react-email/components";

const EmailTemplate = ({ name, email, message }) => {
    const containerStyle = {
        maxWidth: "800px",
        margin: "0",
        padding: "0 1.25rem",
        marginTop: "1.25rem",
        marginBottom: "3rem",
    };

    const textStyle = {
        headers: {
            fontSize: "0.8rem",
            marginTop: "0",
            marginBottom: "2rem",
        },
        base: {
            fontSize: "16px",
            marginTop: "0",
            marginBottom: "3rem",
            fontFamily: "Georgia, serif",
        },
        small: {
            fontSize: "0.8rem",
            marginTop: "0",
            marginBottom: "0.625rem",
            fontStyle: "italic",
        },
    };

    const paragraphs = message?.split("\n\n");

    return (
        <Html>
            <Head />
            <Preview>Contact form</Preview>
            <Body style={{ fontFamily: "sans-serif", background: "#fff" }}>
                <Container style={containerStyle}>
                    <Text style={textStyle.headers}>
                        Sent by: <strong>{name}</strong>
                        <br />
                        Email: {email}
                    </Text>
                    <div style={textStyle.base}>
                        {paragraphs.map((paragraph, index) => (
                            <Text key={index} style={{ marginBottom: "1rem" }}>
                                {paragraph}
                            </Text>
                        ))}
                    </div>
                    <Text style={textStyle.small}>
                        Sent using the contact form from{""}
                        example.com
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { name, email, message, turnstileToken } = req.body;

    if (!message || !email) {
        return res.status(400).json({ error: "Required fields missing" });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        const verificationResponse = await fetch(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    secret: process.env.TURNSTILE_SECRET_KEY,
                    response: turnstileToken,
                }),
            }
        );

        const verificationResult = await verificationResponse.json();

        if (!verificationResult.success) {
            return res
                .status(400)
                .json({ error: true, message: "Turnstile check failed" });
        }

        const { error } = await resend.emails.send({
            from: `Contact form <contactform@example.com>`,
            to: "contact@example.com",
            subject: `Contact form ${name} - ${email} / example.com`,
            react: EmailTemplate({ name, email, message }),
        });
        if (error) {
            return res.status(400).json({
                message: "Some error occurred, can't send email",
                error,
            });
        }
        return res.status(200).json({ message: "Email was sent successfully" });
    } catch (error) {
        return res.status(500).json({
            message: "Some error occurred, can't send email",
            error: error.message,
        });
    }
}
