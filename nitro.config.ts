export default defineNitroConfig({
  externals: {
    inline: ["mongodb", "bson"],
  },
  // Ensure we are using the Node runtime which supports these libraries
  node: true,
});
