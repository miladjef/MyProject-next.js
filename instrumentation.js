export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.info("Application instrumentation registered", { service: process.env.SITE_NAME || "next416" });
  }
}
