import crypto from "crypto";

const safeServerError = (error, context = "api") => {
  const requestId = crypto.randomUUID();
  console.error(`[${context}] [${requestId}]`, error);
  return Response.json(
    { message: "Internal server error", requestId },
    { status: 500 }
  );
};

export { safeServerError };
