import Database from "better-sqlite3";
import * as path from "path";
import { SubmissionRecord } from "../models/types";

export class DatabaseService {
  private db: Database.Database;

  constructor() {
    const dbPath = path.resolve(process.cwd(), "lab_platform.db");
    this.db = new Database(dbPath);
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        problem_id TEXT NOT NULL,
        profile_id TEXT NOT NULL,
        mode TEXT NOT NULL,
        code TEXT NOT NULL,
        language TEXT NOT NULL,
        status TEXT NOT NULL,
        score INTEGER,
        result_json TEXT,
        created_at TEXT NOT NULL
      )
    `);
  }

  saveSubmission(record: SubmissionRecord): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO submissions 
      (id, problem_id, profile_id, mode, code, language, status, score, result_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      record.id,
      (record as any).problemId || "", // We might need to ensure problemId is in the record
      record.profileId,
      record.mode,
      record.code,
      record.language,
      record.status,
      record.result?.score || 0,
      JSON.stringify(record.result || {}),
      record.createdAt
    );
  }

  getSubmission(id: string): SubmissionRecord | null {
    const row = this.db.prepare("SELECT * FROM submissions WHERE id = ?").get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      mode: row.mode,
      code: row.code,
      language: row.language,
      profileId: row.profile_id,
      createdAt: row.created_at,
      status: row.status,
      result: JSON.parse(row.result_json)
    } as SubmissionRecord;
  }

  getAllSubmissions(): SubmissionRecord[] {
    const rows = this.db.prepare("SELECT * FROM submissions ORDER BY created_at DESC").all() as any[];
    return rows.map(row => ({
      id: row.id,
      mode: row.mode,
      code: row.code,
      language: row.language,
      profileId: row.profile_id,
      createdAt: row.created_at,
      status: row.status,
      result: JSON.parse(row.result_json)
    } as SubmissionRecord));
  }
}

export const dbService = new DatabaseService();
