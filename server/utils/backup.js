require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { supabase } = require('./supabase');

// Skapa backup-mapp om den inte finns
const backupDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`Skapade backup-mapp: ${backupDir}`);
}

// Lista över tabeller att backa upp
const TABLES_TO_BACKUP = [
    'pages',
    'bookings',
    'users'
];

// Funktion för att generera filnamn med datum
const getBackupFileName = () => {
    const date = new Date();
    return `backup-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.json`;
};

// Funktion för att ta backup av en tabell
const backupTable = async (tableName) => {
    const { data, error } = await supabase
        .from(tableName)
        .select('*');

    if (error) {
        console.log(`Hoppar över tabell ${tableName}: ${error.message}`);
        return { tableName, data: [] };
    }
    return { tableName, data };
};

// Funktion för att ta backup
const createBackup = async () => {
    try {
        console.log('Startar backup-process...');
        
        const fileName = getBackupFileName();
        const filePath = path.join(backupDir, fileName);

        // Backup data för varje tabell
        console.log('Skapar backup för varje tabell...');
        const backupData = {};
        for (const table of TABLES_TO_BACKUP) {
            console.log(`Backup av tabell: ${table}`);
            const tableData = await backupTable(table);
            backupData[table] = tableData.data;
        }

        // Spara backup till fil
        console.log(`Sparar backup till fil: ${fileName}`);
        fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
        console.log(`Backup slutförd: ${fileName}`);
        
        // Ta bort backuper äldre än 7 dagar
        cleanOldBackups();

        return { success: true, fileName };
    } catch (error) {
        console.error('Backup error:', error);
        return { success: false, error: error.message };
    }
};

// Funktion för att återställa från backup
const restoreFromBackup = async (fileName) => {
    try {
        console.log(`Startar återställning från ${fileName}...`);
        const filePath = path.join(backupDir, fileName);
        
        if (!fs.existsSync(filePath)) {
            throw new Error('Backup-filen finns inte');
        }

        const backupData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // Återställ varje tabell
        for (const tableName of TABLES_TO_BACKUP) {
            if (backupData[tableName]) {
                console.log(`Återställer tabell: ${tableName}`);
                
                // Radera existerande data
                const { error: deleteError } = await supabase
                    .from(tableName)
                    .delete()
                    .neq('id', 0); // Delete all rows

                if (deleteError) {
                    throw new Error(`Fel vid rensning av tabell ${tableName}: ${deleteError.message}`);
                }

                // Lägg till data från backup
                if (backupData[tableName].length > 0) {
                    const { error: insertError } = await supabase
                        .from(tableName)
                        .insert(backupData[tableName]);

                    if (insertError) {
                        throw new Error(`Fel vid återställning av tabell ${tableName}: ${insertError.message}`);
                    }
                }
            }
        }

        console.log('Återställning slutförd');
        return { success: true };
    } catch (error) {
        console.error('Restore error:', error);
        return { success: false, error: error.message };
    }
};

// Funktion för att lista tillgängliga backuper
const listBackups = () => {
    try {
        const files = fs.readdirSync(backupDir)
            .filter(file => file.endsWith('.json'))
            .map(file => {
                const filePath = path.join(backupDir, file);
                const stats = fs.statSync(filePath);
                return {
                    fileName: file,
                    createdAt: stats.mtime,
                    size: stats.size
                };
            })
            .sort((a, b) => b.createdAt - a.createdAt); // Sortera nyast först

        return { success: true, files };
    } catch (error) {
        console.error('Error listing backups:', error);
        return { success: false, error: error.message };
    }
};

// Funktion för att rensa gamla backuper
const cleanOldBackups = () => {
    console.log('Kontrollerar gamla backuper...');
    
    const files = fs.readdirSync(backupDir);
    const now = new Date();
    
    files.forEach(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        const daysOld = (now - stats.mtime) / (1000 * 60 * 60 * 24);
        
        if (daysOld > 7) {
            fs.unlinkSync(filePath);
            console.log(`Gammal backup borttagen: ${file}`);
        }
    });
};

// Om scriptet körs direkt (inte importerat som modul)
if (require.main === module) {
    createBackup().catch(error => {
        console.error('Oväntat fel:', error);
        process.exit(1);
    });
}

// Exportera funktioner
module.exports = {
    createBackup,
    restoreFromBackup,
    listBackups,
    cleanOldBackups
}; 