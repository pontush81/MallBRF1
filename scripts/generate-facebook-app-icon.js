// Detta skript kan användas för att generera en 1024x1024 ikon för Facebook-appen
// Använd: node generate-facebook-app-icon.js

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Skapa mappen scripts om den inte existerar
if (!fs.existsSync(path.join(__dirname))) {
  fs.mkdirSync(path.join(__dirname), { recursive: true });
}

async function generateFacebookAppIcon() {
  try {
    // Skapa en canvas med 1024x1024 pixlar
    const canvas = createCanvas(1024, 1024);
    const context = canvas.getContext('2d');

    // Använd den befintliga logo512.png som bas, om tillgänglig
    try {
      const sourceImage = await loadImage(path.join(__dirname, '../public/logo512.png'));
      
      // Fyll bakgrunden med valfri färg
      context.fillStyle = '#f0f0f0'; // Ljusgrå bakgrund
      context.fillRect(0, 0, 1024, 1024);
      
      // Beräkna position för att centrera bilden
      const x = (1024 - 512) / 2;
      const y = (1024 - 512) / 2;
      
      // Rita den befintliga ikonen i centrum av den nya kanvasen
      context.drawImage(sourceImage, x, y, 512, 512);
    } catch (err) {
      console.error('Kunde inte hitta logo512.png, skapar en enkel ikon istället:', err);
      
      // Om logo512.png inte finns, skapa en enkel ikon med text
      context.fillStyle = '#4267B2'; // Facebook blå
      context.fillRect(0, 0, 1024, 1024);
      
      context.font = 'bold 150px Arial';
      context.fillStyle = 'white';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('MallBRF', 512, 512);
    }
    
    // Spara den nya bilden
    const buffer = canvas.toBuffer('image/png');
    const outputPath = path.join(__dirname, '../public/facebook-app-icon.png');
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`Facebook app-ikon (1024x1024) genererad: ${outputPath}`);
  } catch (error) {
    console.error('Ett fel uppstod vid generering av ikonen:', error);
  }
}

generateFacebookAppIcon();

// För att köra detta skript behöver du först installera canvas:
// npm install canvas 