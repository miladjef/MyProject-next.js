export async function POST() {
  return Response.json(
    {
      message:
        "Phone verification is required. Start registration with /api/auth/sms/send using mode=register.",
    },
    { status: 428 }
  );
}
