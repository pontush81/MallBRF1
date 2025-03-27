const express = require('express');
const router = express.Router();
const { supabase } = require('../utils/supabase');
const nodemailer = require('nodemailer');
const { format } = require('date-fns');
const { sv } = require('date-fns/locale');

// Detaljerad loggning av miljövariabler (utan att visa känslig data)
console.log('Backup route configuration:');
console.log('EMAIL_USER exists:', !!process.env.EMAIL_USER);
console.log('BACKUP_EMAIL exists:', !!process.env.BACKUP_EMAIL);
console.log('EMAIL_APP_PASSWORD exists:', !!process.env.EMAIL_APP_PASSWORD);

if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD || !process.env.BACKUP_EMAIL) {
  console.error('Saknade miljövariabler för e-postkonfiguration!');
}

// Konfigurera e-posttransporter med mer robusta inställningar
const transportConfig = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,  // Använd SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  },
  debug: true,
  logger: true,
  maxConnections: 1,
  maxMessages: 1
};

// Skapa transporter
let transporter;
try {
  transporter = nodemailer.createTransport(transportConfig);
  console.log('SMTP Transporter skapad med följande konfiguration:', {
    ...transportConfig,
    auth: {
      user: transportConfig.auth.user,
      pass: '***'
    }
  });
} catch (error) {
  console.error('Fel vid skapande av SMTP transporter:', error);
}

// Verifiera SMTP-konfigurationen
async function verifyTransporter() {
  if (!transporter) {
    console.error('Ingen SMTP transporter tillgänglig');
    return false;
  }

  try {
    const verified = await transporter.verify();
    console.log('SMTP-verifiering lyckades:', verified);
    return true;
  } catch (error) {
    console.error('SMTP-verifieringsfel:', {
      name: error.name,
      message: error.message,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      response: error.response
    });
    return false;
  }
}

// Hämta alla bokningar och skicka som backup
router.post('/send-backup', async (req, res) => {
  try {
    console.log('Startar backup-processen...');

    // Verifiera SMTP-konfiguration först
    const isSmtpVerified = await verifyTransporter();
    if (!isSmtpVerified) {
      throw new Error('SMTP-konfigurationen kunde inte verifieras');
    }
    
    // Hämta alla bokningar från Supabase
    console.log('Hämtar bokningar från Supabase...');
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .order('createdat', { ascending: false });

    if (error) {
      console.error('Fel vid hämtning av bokningar:', error);
      return res.status(500).json({ error: 'Kunde inte hämta bokningar' });
    }

    console.log(`Hittade ${bookings.length} bokningar`);

    // Skapa en formaterad textversion av bokningarna
    console.log('Formaterar bokningar...');
    const formattedBookings = bookings.map(booking => {
      const startDate = format(new Date(booking.startdate), 'PPP', { locale: sv });
      const endDate = format(new Date(booking.enddate), 'PPP', { locale: sv });
      return `
Bokning #${booking.id}
Namn: ${booking.name}
E-post: ${booking.email}
Telefon: ${booking.phone || 'Saknas'}
Ankomst: ${startDate}
Avresa: ${endDate}
Status: ${booking.status}
Anteckningar: ${booking.notes || 'Inga'}
Skapad: ${format(new Date(booking.createdat), 'PPP', { locale: sv })}
----------------------------------------`;
    }).join('\n');

    // Validera e-postadresser
    if (!process.env.EMAIL_USER || !process.env.BACKUP_EMAIL) {
      throw new Error('E-postadresser saknas i miljövariablerna');
    }

    // Skapa e-postmeddelandet
    console.log('Skapar e-postmeddelande...');
    const mailOptions = {
      from: {
        name: 'Gulmåran BRF Backup',
        address: process.env.EMAIL_USER
      },
      to: process.env.BACKUP_EMAIL,
      subject: `Bokningsbackup - ${format(new Date(), 'PPP', { locale: sv })}`,
      text: `Här är en backup av alla bokningar:\n\n${formattedBookings}`,
      attachments: [
        {
          filename: `bokningar-${format(new Date(), 'yyyy-MM-dd')}.json`,
          content: JSON.stringify(bookings, null, 2)
        }
      ]
    };

    console.log('Skickar e-post...');
    console.log('Från:', mailOptions.from.address);
    console.log('Till:', mailOptions.to);

    // Skicka e-postmeddelandet med timeout
    const emailResult = await Promise.race([
      transporter.sendMail(mailOptions),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('E-post timeout efter 30 sekunder')), 30000)
      )
    ]);

    console.log('E-post skickad framgångsrikt!', emailResult.messageId);

    res.json({ 
      success: true, 
      message: 'Backup skickad via e-post',
      bookingCount: bookings.length,
      messageId: emailResult.messageId
    });
  } catch (error) {
    console.error('Fel vid backup:', {
      name: error.name,
      message: error.message,
      code: error.code,
      command: error.command,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Kunde inte skicka backup', 
      details: error.message,
      code: error.code
    });
  }
});

// Initiera SMTP-verifiering vid uppstart
verifyTransporter().then(isVerified => {
  console.log('Initial SMTP-verifiering:', isVerified ? 'Lyckades' : 'Misslyckades');
});

module.exports = {
  router: router
}; 