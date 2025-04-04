const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { format } = require('date-fns');
const { sv } = require('date-fns/locale');

console.log('Notification route configuration:');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_APP_PASSWORD length:', process.env.EMAIL_APP_PASSWORD ? process.env.EMAIL_APP_PASSWORD.length : 0);

// Konfigurera e-posttransporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Testa e-postkonfigurationen
transporter.verify((error, success) => {
  if (error) {
    console.error('E-postkonfigurationsfel (notifications):', error);
  } else {
    console.log('E-postkonfiguration för notifikationer är korrekt');
  }
});

// Testa e-postkonfigurationen
router.get('/test', async (req, res) => {
  try {
    const testMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Skicka till samma adress som avsändaren
      subject: 'Test av e-postkonfiguration',
      text: 'Detta är ett testmeddelande för att verifiera e-postkonfigurationen.'
    };

    console.log('Skickar testmail till:', testMailOptions.to);
    await transporter.sendMail(testMailOptions);
    
    res.json({ success: true, message: 'Testmail skickat framgångsrikt' });
  } catch (error) {
    console.error('Fel vid skickande av testmail:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Kunde inte skicka testmail: ' + error.message 
    });
  }
});

// Skicka notifikation om ny användarregistrering
router.post('/new-user', async (req, res) => {
  try {
    const { email, user } = req.body;
    
    // Använd den medföljande email-adressen eller BACKUP_EMAIL som fallback
    const targetEmail = email || process.env.BACKUP_EMAIL;
    
    if (!targetEmail || !user || !user.email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Ogiltiga parametrar. E-postadress och användarinfo krävs.' 
      });
    }
    
    console.log('Använder email:', targetEmail);
    
    // Formatera datum
    const createdDate = user.createdAt 
      ? format(new Date(user.createdAt), 'PPP', { locale: sv })
      : format(new Date(), 'PPP', { locale: sv });
    
    // Skapa e-postmeddelandet
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: targetEmail,
      subject: 'Ny användarregistrering väntar på godkännande',
      text: `
En ny användare har registrerat sig och väntar på godkännande:

Namn: ${user.name || 'Ej angivet'}
E-post: ${user.email}
Registrerad: ${createdDate}

Logga in på adminpanelen för att godkänna eller neka användaren.
      `,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Ny användarregistrering</h2>
        <p>En ny användare har registrerat sig och väntar på godkännande:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f5f5f5;">
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Namn</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${user.name || 'Ej angivet'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">E-post</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${user.email}</td>
          </tr>
          <tr style="background-color: #f5f5f5;">
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Registrerad</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${createdDate}</td>
          </tr>
        </table>
        
        <p style="margin-top: 20px;">Logga in på adminpanelen för att godkänna eller neka användaren.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 12px;">
          <p>Detta är ett automatiskt meddelande, svara inte på detta e-postmeddelande.</p>
        </div>
      </div>
      `
    };

    // Skicka e-postmeddelandet
    console.log('Skickar notifikation om ny användare...');
    console.log('Från:', mailOptions.from);
    console.log('Till:', mailOptions.to);

    await transporter.sendMail(mailOptions);
    
    console.log('Notifikation skickad framgångsrikt');
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Fel vid skickande av notifikation:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Kunde inte skicka notifikation: ' + error.message 
    });
  }
});

// Skicka notifikation om godkännande till användare
router.post('/user-approved', async (req, res) => {
  try {
    const { user } = req.body;
    
    if (!user || !user.email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Ogiltiga parametrar. Användarinfo med e-postadress krävs.' 
      });
    }
    
    console.log('Skickar godkännandenotifikation till:', user.email);
    
    // Formatera datum
    const currentDate = format(new Date(), 'PPP', { locale: sv });
    
    // Skapa e-postmeddelandet
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Ditt konto har godkänts',
      text: `
Hej ${user.name || ''}!

Ditt konto har nu godkänts av administratören och du kan logga in på webbplatsen.

Datum för godkännande: ${currentDate}

Besök webbplatsen och logga in med dina uppgifter för att komma igång.

Med vänliga hälsningar,
Administrationen
      `,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Ditt konto är nu aktiverat</h2>
        <p>Hej ${user.name || ''}!</p>
        
        <p>Ditt konto har nu godkänts av administratören och du kan logga in på webbplatsen.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f5f5f5;">
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">E-post</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${user.email}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Godkänt datum</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${currentDate}</td>
          </tr>
        </table>
        
        <p style="margin-top: 20px;">Besök webbplatsen och logga in med dina uppgifter för att komma igång.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #777;">Med vänliga hälsningar,<br>Administrationen</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 12px;">
          <p>Detta är ett automatiskt meddelande, svara inte på detta e-postmeddelande.</p>
        </div>
      </div>
      `
    };

    // Skicka e-postmeddelandet
    console.log('Skickar godkännandenotifikation...');
    console.log('Från:', mailOptions.from);
    console.log('Till:', mailOptions.to);

    await transporter.sendMail(mailOptions);
    
    console.log('Godkännandenotifikation skickad framgångsrikt');
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Fel vid skickande av godkännandenotifikation:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Kunde inte skicka godkännandenotifikation: ' + error.message 
    });
  }
});

module.exports = {
  router
}; 