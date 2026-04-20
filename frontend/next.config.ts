import type { NextConfig } from "next";

const config: NextConfig = {
  env: {
    BACKEND_URL: process.env.BACKEND_URL ?? "http://127.0.0.1:8001",
  },
};

export default config;
