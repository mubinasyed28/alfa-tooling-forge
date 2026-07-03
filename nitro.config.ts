export default defineNitroConfig({
  // Tell Nitro to build for Vercel
  preset: "vercel",
  externals: {
    inline: ["mongodb", "bson"],
  },
  // Required for some database drivers in serverless
  experimental: {
    asyncContext: true,
  },
});
