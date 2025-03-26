const sgMail = require('@sendgrid/mail');
const fs = require('fs');
require('dotenv').config();

// Konfigurera SendGrid med API-nyckel
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Funktion för att skicka e-post med bifogad fil
const sendEmailWithAttachment = async (to, subject, text, attachmentPath) => {
    try {
        console.log('Preparing to send email...', { to, subject, attachmentPath });
        
        // Validera e-postkonfiguration
        if (!process.env.SENDGRID_API_KEY) {
            console.warn('SendGrid API-nyckel saknas. Kontrollera SENDGRID_API_KEY i .env-filen.');
            return { 
                success: false, 
                error: 'E-postkonfiguration saknas. Kontakta administratören.'
            };
        }

        // Validera e-postadress
        if (!to || !to.includes('@')) {
            console.warn('Invalid email address:', to);
            return { 
                success: false, 
                error: 'Ogiltig e-postadress'
            };
        }

        // Kontrollera att filen finns
        if (!fs.existsSync(attachmentPath)) {
            console.error('Backup file not found:', attachmentPath);
            return { 
                success: false, 
                error: 'Backup-filen kunde inte hittas'
            };
        }

        // Läs filen som base64
        const attachment = fs.readFileSync(attachmentPath, { encoding: 'base64' });
        const fileName = attachmentPath.split('/').pop();

        console.log('Creating email options...');
        const msg = {
            to: to,
            from: process.env.EMAIL_FROM || 'noreply@mallbrf.se', // Använd konfigurerad avsändaradress eller standard
            subject: subject,
            text: text,
            html: text.replace(/\n/g, '<br>'), // Konvertera radbrytningar till HTML
            attachments: [{
                content: attachment,
                filename: fileName,
                type: 'application/json',
                disposition: 'attachment'
            }]
        };

        console.log('Sending email via SendGrid...');
        const response = await sgMail.send(msg);
        console.log('Email sent successfully:', response[0].statusCode);
        
        return { 
            success: true, 
            messageId: response[0].headers['x-message-id']
        };
    } catch (error) {
        console.error('Error sending email:', error);
        // Returnera ett mer användarvänligt felmeddelande
        return { 
            success: false, 
            error: error.message || 'Ett oväntat fel uppstod vid skickande av e-post'
        };
    }
};

module.exports = {
    sendEmailWithAttachment
}; 