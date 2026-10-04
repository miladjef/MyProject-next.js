import { authUser } from "@/utils/serverHelpers";
import { removeLocalUpload, saveUploadedImage } from "@/utils/upload";

export async function POST(req) {
  try {
    const user = await authUser();
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });
    const form = await req.formData();
    const old = user.avatar;
    user.avatar = await saveUploadedImage(form.get("avatar"), { folder: "avatars", maxBytes: 2 * 1024 * 1024 });
    await user.save();
    await removeLocalUpload(old);
    return Response.json({ message: "Avatar updated", avatar: user.avatar });
  } catch (err) {
    return Response.json({ message: err.message || "Avatar update failed" }, { status: /image/i.test(err.message || "") ? 400 : 500 });
  }
}

export async function DELETE() {
  const user = await authUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });
  const old = user.avatar;
  user.avatar = "";
  await user.save();
  await removeLocalUpload(old);
  return Response.json({ message: "Avatar removed" });
}
