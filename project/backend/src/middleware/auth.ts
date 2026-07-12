import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/AuthService";

// Extend Request type to include user information
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    fullName: string;
    role: "student" | "instructor" | "admin";
    studentCode?: string | null;
    email?: string | null;
  };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    // FALLBACK CHẾ ĐỘ DEMO / BACKWARD COMPATIBILITY
    // Tự động gán quyền 'student' demo nếu không có token để không phá vỡ các CLI scripts kiểm thử cũ.
    req.user = {
      id: "u1",
      username: "student",
      fullName: "Sinh viên Demo",
      role: "student",
      studentCode: "B21DCCN001",
      email: "student@student.ptit.edu.vn"
    };
    return next();
  }

  const user = AuthService.verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: "Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại." });
  }

  req.user = user;
  next();
}

export function requireRole(roles: Array<"student" | "instructor" | "admin">) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Yêu cầu đăng nhập." });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Không có quyền truy cập. Tài khoản của bạn không được phân quyền cho chức năng này." });
    }

    next();
  };
}
