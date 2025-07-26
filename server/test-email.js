require('dotenv').config();
const nodemailer = require('nodemailer');

// Skapa en transporter för e-post med OAuth2
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

// Verifiera transporter
transporter.verify((error, success) => {
  if (error) {
    console.error('E-postkonfigurationsfel:', error);
  } else {
    console.log('E-postkonfiguration är korrekt');
    
    // Skapa e-postmeddelandet
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.BACKUP_EMAIL,
      subject: 'Test e-post från MallBRF',
      text: 'Detta är en test-e-post för att verifiera att e-postkonfigurationen fungerar.'
    };

    // Skicka e-postmeddelandet
    console.log('Skickar test-e-post...');
    console.log('Från:', mailOptions.from);
    console.log('Till:', mailOptions.to);

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Fel vid skickande av e-post:', error);
      } else {
        console.log('E-post skickad framgångsrikt!');
        console.log('Info:', info);
      }
    });
  }
}); 