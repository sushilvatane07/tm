import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-404-html",
      closeBundle() {
        const distDir = path.resolve(__dirname, "dist");
        const indexPath = path.join(distDir, "index.html");
        const fourOhFourPath = path.join(distDir, "404.html");
        if (fs.existsSync(indexPath)) {
          fs.copyFileSync(indexPath, fourOhFourPath);
        }
      },
    },
  ],
  base: process.env.VITE_BASE_PATH || "/trustshare/",
});