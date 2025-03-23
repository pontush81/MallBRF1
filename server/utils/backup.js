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
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*');

        if (error) {
            let errorMessage = error.message;
            if (error.message.includes('permission denied')) {
                errorMessage = `Åtkomst nekad för tabell ${tableName}. Kontrollera dina Supabase-behörigheter.`;
            }
            console.log(`Hoppar över tabell ${tableName}: ${errorMessage}`);
            return { tableName, data: [], error: errorMessage };
        }
        return { tableName, data: data || [] };
    } catch (err) {
        console.error(`Fel vid backup av tabell ${tableName}:`, err);
        return { tableName, data: [], error: err.message };
    }
};

// Funktion för att ta backup
const createBackup = async (tablesToBackup = TABLES_TO_BACKUP) => {
    try {
        console.log('Startar backup-process...', { tablesToBackup });
        
        const fileName = getBackupFileName();
        const filePath = path.join(backupDir, fileName);

        // Validate tables to backup
        const validTables = tablesToBackup.filter(table => TABLES_TO_BACKUP.includes(table));
        if (validTables.length === 0) {
            throw new Error('Inga giltiga tabeller att backa upp');
        }

        // Backup data för varje tabell
        console.log('Skapar backup för valda tabeller...');
        const backupData = {};
        const errors = {};
        let hasSuccessfulBackups = false;

        for (const table of validTables) {
            console.log(`Backup av tabell: ${table}`);
            const tableData = await backupTable(table);
            backupData[table] = tableData.data;
            
            if (tableData.error) {
                errors[table] = tableData.error;
            } else if (tableData.data && tableData.data.length > 0) {
                hasSuccessfulBackups = true;
            }
        }

        // If no successful backups at all, return an error
        if (!hasSuccessfulBackups && Object.keys(errors).length > 0) {
            const errorMessage = Object.entries(errors)
                .map(([table, error]) => `${table}: ${error}`)
                .join(', ');
            throw new Error(`Kunde inte backa upp några tabeller: ${errorMessage}`);
        }

        // Add metadata to backup
        const metadata = {
            createdAt: new Date().toISOString(),
            tables: validTables,
            errors: errors
        };
        backupData._metadata = metadata;

        // Spara backup till fil
        console.log(`Sparar backup till fil: ${fileName}`);
        fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
        console.log(`Backup slutförd: ${fileName}`);
        
        // Ta bort backuper äldre än 7 dagar
        cleanOldBackups();

        // Return both success and any errors that occurred
        return { 
            success: true, 
            fileName,
            partialSuccess: Object.keys(errors).length > 0,
            errors: Object.keys(errors).length > 0 ? errors : null
        };
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
            if (backupData[tableName] && backupData[tableName].length > 0) {
                console.log(`Återställer tabell: ${tableName}`);
                
                try {
                    // Instead of deleting all rows and then inserting,
                    // use upsert to update existing or insert new
                    const { error } = await supabase
                        .from(tableName)
                        .upsert(backupData[tableName], { 
                            onConflict: 'id',
                            ignoreDuplicates: false
                        });

                    if (error) {
                        console.error(`Fel vid återställning av tabell ${tableName}:`, error);
                        console.log('Försöker fallback-metod...');
                        
                        // Try individual inserts if bulk upsert fails
                        for (const row of backupData[tableName]) {
                            try {
                                await supabase
                                    .from(tableName)
                                    .upsert([row], { 
                                        onConflict: 'id',
                                        ignoreDuplicates: false
                                    });
                            } catch (innerError) {
                                console.error(`Kunde inte återställa rad i ${tableName}:`, innerError);
                            }
                        }
                    }
                } catch (tableError) {
                    console.error(`Fel vid återställning av tabell ${tableName}:`, tableError);
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