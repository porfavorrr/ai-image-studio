import "server-only";
import { cookies } from "next/headers";
import { createHmac, randomInt, timingSafeEqual } from "crypto";

const CAPTCHA_COOKIE = "ai_image_captcha";
const CAPTCHA_TTL_SECONDS = 5 * 60;

function secret() {
  return process.env.AUTH_SECRET || "development-secret-change-me";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function encodeCaptcha(answer: number) {
  const payload = Buffer.from(
    JSON.stringify({
      answer: String(answer),
      expiresAt: Date.now() + CAPTCHA_TTL_SECONDS * 1000,
      nonce: randomInt(1_000_000, 9_999_999)
    })
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

function decodeCaptcha(value: string) {
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as {
      answer: string;
      expiresAt: number;
    };
  } catch {
    return null;
  }
}

export function createCaptchaChallenge() {
  const left = randomInt(1, 21);
  const right = randomInt(1, 21);
  const useMinus = left > right && randomInt(0, 2) === 1;
  const answer = useMinus ? left - right : left + right;
  const question = useMinus ? `${left} - ${right} = ?` : `${left} + ${right} = ?`;

  cookies().set(CAPTCHA_COOKIE, encodeCaptcha(answer), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.AUTH_COOKIE_SECURE === "true",
    path: "/",
    maxAge: CAPTCHA_TTL_SECONDS
  });

  return { question };
}

export function clearCaptchaChallenge() {
  cookies().set(CAPTCHA_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.AUTH_COOKIE_SECURE === "true",
    path: "/",
    maxAge: 0
  });
}

export function verifyCaptchaAnswer(answer: unknown) {
  const raw = cookies().get(CAPTCHA_COOKIE)?.value;
  clearCaptchaChallenge();

  const captcha = raw ? decodeCaptcha(raw) : null;
  if (!captcha || captcha.expiresAt <= Date.now()) {
    return false;
  }

  return String(answer ?? "").trim() === captcha.answer;
}
