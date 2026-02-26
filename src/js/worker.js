// Load ImageMagick
import {
  CompositeOperator,
  Gravity,
  initializeImageMagick,
  ImageMagick,
  Magick,
  MagickFormat,
  Point,
} from "./magick.js";

console.log("Loading ImageMagick wasm...");
await initializeImageMagick(new URL("magick.wasm", import.meta.url));
console.log("ImageMagick ready!");
await Magick.ready;
console.log("ImageMagick readier!!");

console.log("Loading watermark.png");
const WATERMARK_IMG_BYTES = await getWatermarkImageBytes(
  new URL("../img/watermark.png", import.meta.url),
);
const FINAL_IMAGE_WIDTH = 1920.0;
const WATERMARK_WIDTH = 1100.0;
const WATERMARK_WIDTH_RATIO = 1100.0 / 1920.0;
const WATERMARK_TEXT =
  "All Rights Reserved. Unauthorized reproduction, distribution, or posting on social media is strictly prohibited without express written consent. Violators may be subject to legal action.";

async function getWatermarkImageBytes(imageUrl) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    alert("Failed to access watermark.png!");
  }
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

onmessage = async (e) => {
  const { msgType, msgData } = e.data;

  if (!msgType) {
    console.error("Received malformed message!");
    return;
  }

  switch (msgType) {
    case "add-image": {
      const { imageName, imageArrayBuffer, useLegalText } = msgData;
      await onMsgRecvAddImage(imageName, imageArrayBuffer, useLegalText);
      break;
    }

    default:
      console.error("Unhandled message type", msgType);
  }
};

async function onMsgRecvAddImage(imageName, imageArrayBuffer, useLegalText) {
  postMessage({
    msgType: "working-on",
    msgData: { imageName: imageName },
  });

  const processedImage = await doProcessImage(
    imageName,
    imageArrayBuffer,
    useLegalText,
  );
  if (!processedImage) {
    console.error("Uh-oh! The image came out null/undefined??", processedImage);
  }

  postMessage({
    msgType: "success",
    msgData: { imageName: imageName, imageBlob: processedImage },
  });
}

function doProcessImage(imageName, imageArrayBuffer, useLegalText) {
  return ImageMagick.read(WATERMARK_IMG_BYTES, (watermarkImg) => {
    const imageBytes = new Uint8Array(imageArrayBuffer);

    // Load image into ImageMagick
    console.log(`Reading ${imageName} into ImageMagick`);
    return ImageMagick.read(imageBytes, (baseImg) => {
      return watermarkImage(watermarkImg, baseImg, useLegalText);
    });
  });
}

function watermarkImage(watermarkImg, baseImg, useLegalText) {
  console.log("Reorienting?");
  baseImg.autoOrient();

  console.log("Scaling base image");
  const imageScale = 1920.0 / baseImg.width;
  baseImg.resize(baseImg.width * imageScale, baseImg.height * imageScale);

  // Resize watermark clone
  console.log("Scaling watermark");
  const watermarkScale = WATERMARK_WIDTH / watermarkImg.width;
  watermarkImg.resize(
    watermarkImg.width * watermarkScale,
    watermarkImg.height * watermarkScale,
  );

  console.log("Compositing");
  // #L1031
  baseImg.compositeGravity(
    watermarkImg,
    Gravity.Center,
    CompositeOperator.Dissolve,
    new Point(0, 100),
    "40",
  );

  // Retrieve composited image bytes from ImageMagick and
  // put the received byte array into a Blob.
  console.log("Writing output");
  return baseImg.write(MagickFormat.Png, (imgBytes) => {
    console.log("Copying output to blob");
    return new Blob([imgBytes], {
      type: "image/png",
    });
  });
}
