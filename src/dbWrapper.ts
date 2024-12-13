import Database, { Statement } from 'better-sqlite3';
import path from 'path';

// Paths to the SQLite database files
const QR_DB_PATH = path.resolve(__dirname, 'qr.db');
const SHEETS_DB_PATH = path.resolve(__dirname, 'sheets.db');

// Type definition for a QR entry
interface QREntry {
    id: string;
    redirect_url: string | null;
}

// Type definition for a Sheet entry
interface SheetEntry {
    id: string;
    qr_ids: string[];
}

export class QRDatabase {
    private db: Database.Database;

    constructor() {
        this.db = new Database(QR_DB_PATH);
        this.initialize();
    }

    /**
     * Initialize the QR database with a 'qr_codes' table.
     */
    private initialize(): void {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS qr_codes (
                id TEXT PRIMARY KEY CHECK(length(id) = 6),
                redirect_url TEXT DEFAULT NULL
            );
        `);
    }

    /**
     * Add a QR entry to the database with a nullable redirect URL.
     * @param id - The 6-character alphanumeric ID.
     * @param redirectUrl - The redirect URL associated with the QR code (optional).
     */
    addQR(id: string, redirectUrl: string | null = null): void {
        const stmt: Statement = this.db.prepare('INSERT INTO qr_codes (id, redirect_url) VALUES (?, ?)');
        stmt.run(id, redirectUrl);
    }

    /**
     * Add multiple QR entries to the database.
     * @param ids - An array of 6-character alphanumeric IDs.
     */
    addMultipleQRs(ids: string[]): void {
        const stmt: Statement = this.db.prepare('INSERT INTO qr_codes (id) VALUES (?)');
        const insertMany = this.db.transaction((qrIds: string[]) => {
            for (const id of qrIds) {
                stmt.run(id);
            }
        });
        insertMany(ids);
    }

    /**
     * Update the redirect URL of an existing QR entry.
     * @param id - The 6-character alphanumeric ID.
     * @param redirectUrl - The new redirect URL to set.
     */
    updateQRRedirect(id: string, redirectUrl: string): void {
        const stmt: Statement = this.db.prepare('UPDATE qr_codes SET redirect_url = ? WHERE id = ?');
        stmt.run(redirectUrl, id);
    }

    /**
     * Get a QR entry by ID.
     * @param id - The 6-character alphanumeric ID.
     * @returns The QR entry or undefined if not found.
     */
    getQR(id: string): QREntry | undefined {
        const stmt: Statement = this.db.prepare('SELECT * FROM qr_codes WHERE id = ?');
        return stmt.get(id) as QREntry | undefined;
    }

    /**
     * List all QR entries.
     * @returns An array of all QR entries.
     */
    listQRs(): QREntry[] {
        const stmt: Statement = this.db.prepare('SELECT * FROM qr_codes');
        return stmt.all() as QREntry[];
    }
}

export class SheetsDatabase {
    private db: Database.Database;

    constructor() {
        this.db = new Database(SHEETS_DB_PATH);
        this.initialize();
    }

    /**
     * Initialize the Sheets database with a 'sheets' table.
     */
    private initialize(): void {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS sheets (
                id TEXT PRIMARY KEY CHECK(length(id) = 6),
                qr_ids TEXT NOT NULL -- Stored as a comma-separated string
            );
        `);
    }

    /**
     * Add a Sheet entry to the database.
     * @param id - The 6-character alphanumeric ID for the sheet.
     * @param qrIds - An array of QR IDs associated with this sheet.
     */
    addSheet(id: string, qrIds: string[]): void {
        const qrIdsString = qrIds.join(',');
        const stmt: Statement = this.db.prepare('INSERT INTO sheets (id, qr_ids) VALUES (?, ?)');
        stmt.run(id, qrIdsString);
    }

    /**
     * Get a Sheet entry by ID.
     * @param id - The 6-character alphanumeric ID.
     * @returns The Sheet entry or undefined if not found.
     */
    getSheet(id: string): SheetEntry | undefined {
        const stmt: Statement = this.db.prepare('SELECT * FROM sheets WHERE id = ?');
        const result = stmt.get(id) as { id: string; qr_ids: string } | undefined;
        if (result) {
            return {
                id: result.id,
                qr_ids: result.qr_ids.split(','),
            };
        }
        return undefined;
    }

    /**
     * List all Sheet entries.
     * @returns An array of all Sheet entries.
     */
    listSheets(): SheetEntry[] {
        const stmt: Statement = this.db.prepare('SELECT * FROM sheets');
        const results = stmt.all() as { id: string; qr_ids: string }[];
        return results.map(row => ({
            id: row.id,
            qr_ids: row.qr_ids.split(','),
        }));
    }
}
