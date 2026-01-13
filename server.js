
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.server
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.server') });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize Supabase Admin
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.server');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Nodemailer
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

app.post('/request-reset', async (req, res) => {
    const { email, channel, whatsappNumber, redirectTo } = req.body;

    console.log(`Received reset request for ${email} via ${channel}`);

    try {
        // 1. Generate Link
        const { data, error } = await supabase.auth.admin.generateLink({
            type: 'recovery',
            email: email,
            options: {
                redirectTo: redirectTo,
            },
        });

        if (error) throw error;

        const actionLink = data.properties.action_link;
        console.log('Link generated successfully.');

        // 2. Send via Channel
        if (channel === 'email') {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: email,
                subject: 'Redefinição de Senha - Gama Gestão',
                html: `
                    <div style="font-family: sans-serif; padding: 20px;">
                        <h2>Redefinição de Senha</h2>
                        <p>Você solicitou a redefinição de sua senha.</p>
                        <p>Clique no botão abaixo para criar uma nova senha:</p>
                        <a href="${actionLink}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Redefinir Senha</a>
                        <p style="font-size: 12px; color: #666;">Se você não solicitou isso, ignore este e-mail.</p>
                    </div>
                `,
            });
            console.log('Email sent successfully.');
        } else if (channel === 'whatsapp') {
            // Placeholder for WhatsApp API
            console.warn('WhatsApp API not configured. Link:', actionLink);
            // In a real implementation, you would call your WhatsApp provider here
            // await whatsappProvider.sendMessage(whatsappNumber, `Seu link de redefinição: ${actionLink}`);
        }

        res.json({ success: true, message: `Link enviado via ${channel}` });

    } catch (err) {
        console.error('Error processing request:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log('Remember to configure .env.server with your credentials!');
});
