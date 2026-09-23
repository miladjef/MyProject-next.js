import {
  generateAccessToken,
  generateRefreshToken,
  verifyPassword,
} from "@/utils/auth";
import {
  normalizeEmail,
  normalizePhone,
  valiadteEmail,
  valiadtePhone,
} from "@/utils/validation";
import UserModel from "@/models/User";
import BanModel from "@/models/Ban";
import connectToDB from "@/configs/db";

const cookie = (token) =>
  `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${
    process.env.NODE_ENV === "production" ? "; Secure" : ""
  }`;

export async function POST(req) {
  try {
    await connectToDB();
    const { email, identifier, password } = await req.json();
    const rawIdentifier = String(identifier || email || "").trim();
    if (!rawIdentifier || typeof password !== "string" || !password) {
      return Response.json({ message: "Invalid credentials" }, { status: 400 });
    }

    let query;
    if (valiadteEmail(rawIdentifier)) {
      query = { email: normalizeEmail(rawIdentifier) };
    } else if (valiadtePhone(rawIdentifier)) {
      query = { phone: normalizePhone(rawIdentifier) };
    } else {
      return Response.json({ message: "Invalid credentials" }, { status: 400 });
    }

    const user = await UserModel.findOne(query);
    if (!user?.password) {
      return Response.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const banned = await BanModel.findOne({
      $or: [
        ...(user.email ? [{ email: user.email }] : []),
        { phone: user.phone },
      ],
    });
    if (banned) {
      return Response.json({ message: "Account is blocked" }, { status: 403 });
    }

    const isCorrect = await verifyPassword(password, user.password);
    if (!isCorrect) {
      return Response.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const payload = {
      userId: String(user._id),
      email: user.email,
      role: user.role,
    };
    const accessToken = generateAccessToken(payload);
    user.refreshToken = generateRefreshToken(payload);
    await user.save();

    return Response.json(
      { message: "User logged in successfully" },
      { status: 200, headers: { "Set-Cookie": cookie(accessToken) } }
    );
  } catch (err) {
    return Response.json(
      { message: err.message || "Login failed" },
      { status: 500 }
    );
  }
}
