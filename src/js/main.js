const worker = new Worker(new URL("worker.js", import.meta.url), {
  // Don't forget this or you'll kill yourself later
  type: "module",
});
console.log("Initialized worker!");

// Get DOM elements
const imagesInput = document.getElementById("images-input");
const imagesInputList = document.getElementById("input-image-list");
const imagesOutput = document.getElementById("images-output");
const legalTextCheckbox = document.getElementById("use-legal-text");
if (!imagesInput || !imagesInputList || !imagesOutput || !legalTextCheckbox) {
  alert(
    "Failed to locate input/input file list/output div/legal text checkbox????\nBROKE BROKE BROKE CONTACT CJ",
  );
}

// I think the input event works file here; haven't had any issues
// yet.
imagesInput.addEventListener("input", onAddImages);

// Listener
async function onAddImages() {
  // Make sure we actually received some files.
  // This used to be an issue but...somehow now it isn't lol. I'll leave it.
  const fileList = imagesInput.files;
  if (!fileList.length) {
    console.log("Ghost update");
    return;
  }

  // Hide the image selection while we're sending these off to the worker.
  imagesInput.style.display = "none";

  // Get a copy of the image list and clear the version in the DOM
  console.log("Loading images...");
  const files = Array.from(fileList);
  imagesInput.value = "";

  // Send each file to the web worker as a task
  for (const file of files) {
    // Create a list element for the image in the work queue.
    const fileLiElem = document.createElement("li");
    fileLiElem.textContent = file.name;
    fileLiElem.dataset.referencedFile = file.name;
    imagesInputList.append(fileLiElem);

    // Send the array buffer over to the worker (it should be copied by the
    // browser...idk man)
    console.log(`Sending image ${file.name} to worker`);
    worker.postMessage({
      msgType: "add-image",
      msgData: {
        imageName: file.name,
        imageArrayBuffer: await file.arrayBuffer(),
        useLegalText: legalTextCheckbox.checked,
      },
    });
  }

  // Unhide the image selection input
  imagesInput.style.display = "";
}

// Catch errors
// Fun fact: If you don't declare the worker as a module, Firefox will throw
// an error with no message if the use the import statement within that worker
// script. Lovely!
worker.onerror = (e) => {
  console.error("An error occurred in the web worker!");
  throw e;
};

// Handle a message sent back by the worker.
worker.onmessage = async (e) => {
  const { msgType, msgData } = e.data;
  if (!msgType) {
    console.error("Received malformed message!");
    return;
  }

  switch (msgType) {
    case "working-on": {
      const { imageName } = msgData;
      onMsgRecvWorkingOn(imageName);
      break;
    }
    case "success": {
      const { imageName, imageBlob } = msgData;
      onMsgRecvSuccess(imageName, imageBlob);
      break;
    }
    default:
      console.error("Unhandled message type", msgType);
  }
};

function onMsgRecvWorkingOn(imageName) {
  // Bold the current element being processed
  const fileLiElem = document.querySelector(
    `[data-referenced-file="${CSS.escape(imageName)}"]`,
  );
  if (!fileLiElem) {
    console.warn(`Didn't locate fileLiElem for ${imageName}!`);
  } else {
    fileLiElem.style.fontWeight = "bold";
  }
}

function onMsgRecvSuccess(imageName, imageBlob) {
  // Remove this image from the DOM queue
  const fileLiElem = document.querySelector(
    `[data-referenced-file="${CSS.escape(imageName)}"]`,
  );
  if (fileLiElem) {
    fileLiElem.remove();
  }

  // Now is as good a time as any for a null check lmao...this actually
  // caught shit.
  if (!imageBlob) {
    alert("Failed to create image Blob!! FUCKCK");
  } else {
    // Assign the Blob a URL and create an image element to show it.
    // This is what you get to tap and fucking hold to save to device.
    // No it's not too convenient, and no I don't think I have a way to
    // fix it.
    console.log("Appending output");
    const imgSrcUrl = URL.createObjectURL(imageBlob);
    const imgTag = document.createElement("img");
    imgTag.src = imgSrcUrl;
    imgTag.style.width = "45vw";
    imagesOutput.append(imgTag);
    imagesOutput.append(document.createElement("br"));
  }
}
