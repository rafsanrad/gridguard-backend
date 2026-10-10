import app from "../src/app";
import { initializeServer } from "../src/app/lib/serverInit";

export default async function handler(req: any, res: any) {
  try {
    await initializeServer();
    return app(req, res);
  } catch {
    return res.status(500).json({
      success: false,
      message: "Server initialization failed",
      errors: [],
    });
  }
}