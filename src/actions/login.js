"use server";

import connectToDB from "@/configs/db";
import UserModel from "@/models/User";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyPassword,
} from "@/utils/auth";

export const loginAction = async (formData) => {
  try {
    connectToDB();
    const email = formData.get("email");
    const password = formData.get("password");

    const user = await UserModel.findOne({ email });

    if (!user) {
      return console.log("User not found");
      // return {}
    }

    const isCorrectPasswordWithHash = await verifyPassword(
      password,
      user.password
    );

    if (!isCorrectPasswordWithHash) {
      return console.log("Email or password is not correct");
    }

    const accessToken = generateAccessToken({ email });
    const refreshToken = generateRefreshToken({ email });

    await UserModel.findOneAndUpdate(
      { email },
      {
        $set: {
          refreshToken,
        },
      }
    );

    return console.log("User logged in successfully :)) ->", user);
  } catch (err) {
    return Response.json(
      { message: err },
      {
        status: 500,
      }
    );
  }
};
