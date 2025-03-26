require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { supabase } = require('./supabase');
const { sendEmailWithAttachment } = require('./email');

// Skapa backup-mapp om den inte finns
const backupDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupDir)) {
    try {
        fs.mkdirSync(backupDir, { recursive: true });
        console.log(`Skapade backup-mapp: ${backupDir}`);
    } catch (error) {
        console.error('Fel vid skapande av backup-mapp:', error);
    }
}

// Lista över tabeller att backa upp
const TABLES_TO_BACKUP = [
    'pages',
    'bookings'
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
const createBackup = async (tables, name) => {
    try {
        console.log('Starting backup process...', { tables, name });
        
        // Validera tabeller
        if (!tables || tables.length === 0) {
            console.warn('No tables specified for backup');
            return { 
                success: false, 
                error: 'Inga tabeller valda för backup'
            };
        }

        // Validera namn
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return {
                success: false,
                error: 'Ogiltigt backup-namn'
            };
        }

        // Skapa backup-filnamn med datum och anpassat namn
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const sanitizedName = name.trim()
            .replace(/[^a-zA-Z0-9\s-_]/g, '') // Ta bort alla specialtecken förutom mellanslag, bindestreck och understreck
            .replace(/\s+/g, '_') // Ersätt mellanslag med understreck
            .substring(0, 50); // Begränsa längden

        if (sanitizedName.length === 0) {
            return {
                success: false,
                error: 'Backup-namnet innehåller bara ogiltiga tecken'
            };
        }

        const backupFileName = `${sanitizedName}_${timestamp}.json`;
        const backupPath = path.join(backupDir, backupFileName);

        // Skapa backup-innehåll
        const backupData = {};
        const errors = {};
        let hasSuccessfulBackups = false;

        for (const table of tables) {
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
            return { 
                success: false, 
                error: `Kunde inte backa upp några tabeller: ${Object.entries(errors).map(([table, error]) => `${table}: ${error}`).join(', ')}`,
                fileName: null
            };
        }

        // Add metadata to backup
        const metadata = {
            createdAt: new Date().toISOString(),
            tables: tables,
            errors: errors
        };
        backupData._metadata = metadata;

        // Spara backup-fil
        try {
            await fs.promises.writeFile(backupPath, JSON.stringify(backupData, null, 2));
            console.log('Backup file saved successfully:', backupPath);
        } catch (error) {
            console.error('Error saving backup file:', error);
            return {
                success: false,
                error: `Fel vid sparande av backup-fil: ${error.message}`
            };
        }

        return { 
            success: true, 
            fileName: backupFileName,
            partialSuccess: Object.keys(errors).length > 0,
            errors: Object.keys(errors).length > 0 ? errors : null
        };
    } catch (error) {
        console.error('Unexpected error in createBackup:', error);
        return { 
            success: false, 
            error: `Oväntat fel vid backup: ${error.message}`
        };
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

// Funktion för att lista backuper
const listBackups = async () => {
    try {
        console.log('Listing backups from directory:', backupDir);
        
        // Kontrollera om backup-mappen finns
        if (!fs.existsSync(backupDir)) {
            console.log('Backup directory does not exist, creating it...');
            try {
                fs.mkdirSync(backupDir, { recursive: true });
                console.log('Created backup directory');
            } catch (error) {
                console.error('Error creating backup directory:', error);
                return { 
                    success: false, 
                    error: 'Kunde inte skapa backup-mapp',
                    details: error.message
                };
            }
        }

        // Lista filer i backup-mappen
        const files = fs.readdirSync(backupDir)
            .filter(file => file.endsWith('.json'))
            .map(fileName => {
                const filePath = path.join(backupDir, fileName);
                const stats = fs.statSync(filePath);
                return {
                    fileName,
                    createdAt: stats.mtime.toISOString(),
                    size: stats.size
                };
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        console.log(`Found ${files.length} backup files`);
        return { 
            success: true, 
            files 
        };
    } catch (error) {
        console.error('Error listing backups:', error);
        return { 
            success: false, 
            error: 'Kunde inte lista backuper',
            details: error.message
        };
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