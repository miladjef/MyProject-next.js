import { hash, compare } from "bcryptjs";
import { sign, verify } from "jsonwebtoken";
export {
  valiadteEmail,
  valiadtePhone,
  valiadtePassword,
} from "./validation";

const getRequiredSecret = (key) => {
  const secret = process.env[key];
  if (!secret || secret.length < 32) throw new Error(`${key} must be configured with at least 32 characters`);
  return secret;
};

const hashPassword = async (password) => hash(password, 12);
const verifyPassword = async (password, hashedPassword) =>
  compare(password, hashedPassword);

const generateAccessToken = (data) =>
  sign({ ...data }, getRequiredSecret("AccessTokenSecretKey"), {
    expiresIn: "2h",
  });

const verifyAccessToken = (token) => {
  try {
    return verify(token, getRequiredSecret("AccessTokenSecretKey"));
  } catch {
    return false;
  }
};

export {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  verifyAccessToken,
};
