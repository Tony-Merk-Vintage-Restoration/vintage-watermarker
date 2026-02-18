export default function (eleventyConfig) {
  // Copy ImageMagick to assets directory
  eleventyConfig.addPassthroughCopy({
    "./node_modules/@imagemagick/magick-wasm/dist/index.js":
      "/assets/js/magick.js",
  });
  eleventyConfig.addPassthroughCopy({
    "./node_modules/@imagemagick/magick-wasm/dist/magick.wasm":
      "/assets/js/magick.wasm",
  });
  // Copy watermark
  eleventyConfig.addPassthroughCopy({
    "./watermark.png": "/assets/img/watermark.png",
  });
}
