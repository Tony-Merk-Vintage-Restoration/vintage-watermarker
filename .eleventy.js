export default function (eleventyConfig) {
  eleventyConfig.setInputDirectory("src");

  // Copy ImageMagick to assets directory
  eleventyConfig.addPassthroughCopy({
    "./node_modules/@imagemagick/magick-wasm/dist/index.js":
      "/assets/js/magick.js",
  });
  eleventyConfig.addPassthroughCopy({
    "./node_modules/@imagemagick/magick-wasm/dist/magick.wasm":
      "/assets/js/magick.wasm",
  });
  eleventyConfig.addPassthroughCopy({
    "./src/js": "/assets/js",
  });
  // Copy watermark
  eleventyConfig.addPassthroughCopy({
    "./src/img/watermark.png": "/assets/img/watermark.png",
  });
}
