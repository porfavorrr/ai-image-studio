import "server-only";
import { createHmac, randomBytes, randomUUID } from "crypto";
import { getDbSnapshot, withDb } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createUserSession } from "@/lib/session";
import type { PublicUser } from "@/types/user";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESET_TOKEN_MINUTES = 30;

export class AuthError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.status = status;
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toPublicUser(user: {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  createdAt: string;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar ?? null,
    createdAt: user.createdAt
  };
}

export function validateRegisterInput(input: unknown) {
  const data = input as Partial<{ email: string; password: string; confirmPassword: string; name: string }>;
  const email = normalizeEmail(String(data.email || ""));
  const password = String(data.password || "");
  const confirmPassword = String(data.confirmPassword || "");
  const name = String(data.name || "").trim();

  if (!EMAIL_PATTERN.test(email)) {
    throw new AuthError("INVALID_EMAIL", "请输入有效的邮箱地址");
  }

  if (password.length < 8) {
    throw new AuthError("WEAK_PASSWORD", "密码至少需要 8 位");
  }

  if (!confirmPassword || password !== confirmPassword) {
    throw new AuthError("PASSWORD_MISMATCH", "两次输入的密码不一致");
  }

  if (!name) {
    throw new AuthError("NAME_REQUIRED", "请输入昵称");
  }

  return { email, password, name };
}

export function validateLoginInput(input: unknown) {
  const data = input as Partial<{ email: string; password: string }>;
  const email = normalizeEmail(String(data.email || ""));
  const password = String(data.password || "");

  if (!EMAIL_PATTERN.test(email) || !password) {
    throw new AuthError("INVALID_CREDENTIALS", "邮箱或密码错误");
  }

  return { email, password };
}

export async function registerUser(input: unknown) {
  const { email, password, name } = validateRegisterInput(input);
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(password);

  const user = await withDb((db) => {
    if (db.users.some((item) => item.email === email)) {
      throw new AuthError("EMAIL_EXISTS", "该邮箱已注册", 409);
    }

    const created = {
      id: randomUUID(),
      email,
      passwordHash,
      name,
      avatar: null,
      createdAt: now,
      updatedAt: now
    };

    db.users.push(created);
    return created;
  });

  await createUserSession(user.id);
  return toPublicUser(user);
}

export async function loginUser(input: unknown) {
  const { email, password } = validateLoginInput(input);
  const db = await getDbSnapshot();
  const user = db.users.find((item) => item.email === email);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new AuthError("INVALID_CREDENTIALS", "邮箱或密码错误", 401);
  }

  await createUserSession(user.id);
  return toPublicUser(user);
}

function validatePassword(password: string) {
  if (password.length < 8) {
    throw new AuthError("WEAK_PASSWORD", "新密码至少需要 8 位");
  }
}

function resetTokenHash(token: string) {
  const secret = process.env.AUTH_SECRET || "development-secret-change-me";
  return createHmac("sha256", secret).update(token).digest("hex");
}

export async function changePassword(userId: string, input: unknown) {
  const data = input as Partial<{ oldPassword: string; newPassword: string }>;
  const oldPassword = String(data.oldPassword || "");
  const newPassword = String(data.newPassword || "");

  if (!oldPassword) {
    throw new AuthError("OLD_PASSWORD_REQUIRED", "请输入旧密码");
  }
  validatePassword(newPassword);

  const db = await getDbSnapshot();
  const user = db.users.find((item) => item.id === userId);
  if (!user || !(await verifyPassword(oldPassword, user.passwordHash))) {
    throw new AuthError("INVALID_OLD_PASSWORD", "旧密码不正确", 401);
  }

  const passwordHash = await hashPassword(newPassword);
  await withDb((mutableDb) => {
    const mutableUser = mutableDb.users.find((item) => item.id === userId);
    if (!mutableUser) return;
    mutableUser.passwordHash = passwordHash;
    mutableUser.updatedAt = new Date().toISOString();
  });
}

export async function createPasswordResetToken(emailInput: unknown) {
  const email = normalizeEmail(String(emailInput || ""));
  const rawToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  if (!EMAIL_PATTERN.test(email)) {
    return null;
  }

  const db = await getDbSnapshot();
  const user = db.users.find((item) => item.email === email);
  if (!user) {
    return null;
  }

  await withDb((mutableDb) => {
    mutableDb.passwordResetTokens.push({
      id: randomUUID(),
      userId: user.id,
      tokenHash: resetTokenHash(rawToken),
      expiresAt,
      usedAt: null,
      createdAt: now
    });
  });

  return rawToken;
}

export async function resetPassword(input: unknown) {
  const data = input as Partial<{ token: string; newPassword: string }>;
  const token = String(data.token || "");
  const newPassword = String(data.newPassword || "");

  if (!token) {
    throw new AuthError("RESET_TOKEN_REQUIRED", "重置链接无效", 400);
  }
  validatePassword(newPassword);

  const tokenHash = resetTokenHash(token);
  const passwordHash = await hashPassword(newPassword);
  const now = new Date().toISOString();

  await withDb((db) => {
    const resetRecord = db.passwordResetTokens.find((item) => item.tokenHash === tokenHash);
    if (!resetRecord || resetRecord.usedAt || new Date(resetRecord.expiresAt).getTime() <= Date.now()) {
      throw new AuthError("RESET_TOKEN_INVALID", "重置链接无效或已过期", 400);
    }

    const user = db.users.find((item) => item.id === resetRecord.userId);
    if (!user) {
      throw new AuthError("RESET_TOKEN_INVALID", "重置链接无效或已过期", 400);
    }

    user.passwordHash = passwordHash;
    user.updatedAt = now;
    resetRecord.usedAt = now;
    db.sessions = db.sessions.filter((session) => session.userId !== user.id);
  });
}
