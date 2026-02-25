import session from "express-session";
import sql from "mssql";

export class AzureSqlSessionStore extends session.Store {
  private pool: sql.ConnectionPool;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(pool: sql.ConnectionPool) {
    super();
    this.pool = pool;
    this.cleanupInterval = setInterval(() => this.cleanup(), 15 * 60 * 1000);
  }

  async get(sid: string, callback: (err?: any, session?: session.SessionData | null) => void) {
    try {
      const result = await this.pool.request()
        .input("sid", sql.NVarChar, sid)
        .query("SELECT sess FROM sessions WHERE sid = @sid AND expire > GETUTCDATE()");
      if (result.recordset.length === 0) return callback(null, null);
      const sess = JSON.parse(result.recordset[0].sess);
      callback(null, sess);
    } catch (err) {
      callback(err);
    }
  }

  async set(sid: string, sessionData: session.SessionData, callback?: (err?: any) => void) {
    try {
      const sess = JSON.stringify(sessionData);
      const maxAge = (sessionData.cookie?.maxAge) || 7 * 24 * 60 * 60 * 1000;
      const expire = new Date(Date.now() + maxAge);
      await this.pool.request()
        .input("sid", sql.NVarChar, sid)
        .input("sess", sql.NVarChar, sess)
        .input("expire", sql.DateTime2, expire)
        .query(`
          MERGE sessions AS target
          USING (SELECT @sid AS sid) AS source
          ON target.sid = source.sid
          WHEN MATCHED THEN UPDATE SET sess = @sess, expire = @expire
          WHEN NOT MATCHED THEN INSERT (sid, sess, expire) VALUES (@sid, @sess, @expire);
        `);
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  async destroy(sid: string, callback?: (err?: any) => void) {
    try {
      await this.pool.request()
        .input("sid", sql.NVarChar, sid)
        .query("DELETE FROM sessions WHERE sid = @sid");
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  async touch(sid: string, sessionData: session.SessionData, callback?: (err?: any) => void) {
    try {
      const maxAge = (sessionData.cookie?.maxAge) || 7 * 24 * 60 * 60 * 1000;
      const expire = new Date(Date.now() + maxAge);
      await this.pool.request()
        .input("sid", sql.NVarChar, sid)
        .input("expire", sql.DateTime2, expire)
        .query("UPDATE sessions SET expire = @expire WHERE sid = @sid");
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  private async cleanup() {
    try {
      await this.pool.request().query("DELETE FROM sessions WHERE expire < GETUTCDATE()");
    } catch {
    }
  }

  close() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
