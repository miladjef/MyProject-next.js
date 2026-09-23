import { hash, compare } from "bcryptjs";
import { sign, verify } from "jsonwebtoken";
export {
  valiadteEmail,
  valiadtePhone,
  valiadtePassword,
} from "./validation";

const getRequiredSecret = (key) => {
  const secret = process.env[key];
  if (!secret) {
    throw new Error(`${key} is not configured`);
  }
  return secret;
};

const hashPassword = async (password) => hash(password, 12);
const verifyPassword = async (password, hashedPassword) =>
  compare(password, hashedPassword);

const generateAccessToken = (data) =>
  sign({ ...data }, getRequiredSecret("AccessTokenSecretKey"), {
    expiresIn: "7d",
  });

const verifyAccessToken = (token) => {
  try {
    return verify(token, getRequiredSecret("AccessTokenSecretKey"));
  } catch {
    return false;
  }
};

const generateRefreshToken = (data) =>
  sign({ ...data }, getRequiredSecret("RefreshTokenSecretKey"), {
    expiresIn: "30d",
  });

export {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
};
