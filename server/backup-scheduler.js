const { createBackup } = require('./utils/backup');

// Kör backup varje dag kl 03:00
const scheduleBackup = () => {
    const now = new Date();
    const night = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1, // nästa dag
        3, // kl 03:00
        0,
        0
    );
    
    const msUntilNextBackup = night.getTime() - now.getTime();
    
    // Schemalägg första backupen
    setTimeout(() => {
        createBackup();
        // Schemalägg därefter backup var 24:e timme
        setInterval(createBackup, 24 * 60 * 60 * 1000);
    }, msUntilNextBackup);
    
    console.log(`Nästa backup schemalagd till: ${night.toLocaleString()}`);
};

// Starta schemaläggningen
scheduleBackup();

// Hantera process avslutning graciöst
process.on('SIGTERM', () => {
    console.log('Process avslutas...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Process avbryts...');
    process.exit(0);
}); 