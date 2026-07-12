import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "cloudlab_secret_key_123456_secure_demo";

export class AuthService {
  /**
   * Hhashes a password using simple SHA256 with a salt
   */
  static hashPassword(password: string): string {
    return crypto.createHash("sha256").update(password).digest("hex");
  }

  /**
   * Generates a stateless JWT token (Header.Payload.Signature)
   */
  static generateToken(payload: any): string {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const data = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 })).toString("base64url"); // 1 day expiry
    const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${data}`).digest("base64url");
    return `${header}.${data}.${signature}`;
  }

  /**
   * Verifies a JWT token signature and expiry
   */
  static verifyToken(token: string): any {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const [header, data, signature] = parts;
      const expectedSignature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${data}`).digest("base64url");
      if (signature !== expectedSignature) return null;

      const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
      if (payload.exp && Date.now() > payload.exp) {
        console.log("[AuthService] Token expired");
        return null;
      }
      return payload;
    } catch (error) {
      console.error("[AuthService] Token verification failed:", error);
      return null;
    }
  }
}
