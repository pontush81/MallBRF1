const express = require('express');
const router = express.Router();
const { supabase } = require('../utils/supabase');
const nodemailer = require('nodemailer');
const { format } = require('date-fns');
const { sv } = require('date-fns/locale');

console.log('Backup route configuration:');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('BACKUP_EMAIL:', process.env.BACKUP_EMAIL);
console.log('EMAIL_PASSWORD length:', process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 0);

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
    console.error('E-postkonfigurationsfel:', error);
  } else {
    console.log('E-postkonfiguration är korrekt');
  }
});

// Hämta alla bokningar och skicka som backup
router.post('/send-backup', async (req, res) => {
  try {
    console.log('Startar backup-processen...');
    
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

    // Skapa e-postmeddelandet
    console.log('Skapar e-postmeddelande...');
    const mailOptions = {
      from: process.env.EMAIL_USER,
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
    console.log('Från:', mailOptions.from);
    console.log('Till:', mailOptions.to);

    // Skicka e-postmeddelandet
    await transporter.sendMail(mailOptions);
    console.log('E-post skickad framgångsrikt!');

    res.json({ 
      success: true, 
      message: 'Backup skickad via e-post',
      bookingCount: bookings.length
    });
  } catch (error) {
    console.error('Fel vid backup:', error);
    res.status(500).json({ error: 'Kunde inte skicka backup', details: error.message });
  }
});

module.exports = {
  router: router
}; 