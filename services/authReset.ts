
/**
 * Requests a password reset via the backend server.
 * This function calls the local Node.js server which handles the secure link generation and sending.
 */
export async function requestPasswordReset(email: string, channel: 'email' | 'whatsapp', whatsappNumber?: string): Promise<any> {
    console.log(`Requesting password reset for ${email} via ${channel}...`);

    try {
        const response = await fetch('http://localhost:3000/request-reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                channel,
                whatsappNumber,
                redirectTo: window.location.origin + '/redefinir-senha', // Where the user returns after clicking link
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to request reset');
        }

        return data;

    } catch (error) {
        console.error('Error requesting password reset:', error);
        throw error;
    }
}
