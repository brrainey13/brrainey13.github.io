// random celeb list
const celebs = [
  "Jennifer Aniston",
  "Taylor Swift",
  "Keanu Reeves",
  "Rihanna",
  "Tom Hanks",
  "Kim Kardashian",
  // ... add as many as you want
];

const replicateApiToken = "r8_1V2IIijS6YWwX1pY4EbvtuByWo9a8nc4AhANc";
const generateBtn = document.getElementById("generate-btn");
const copyBtn = document.getElementById("copy-btn");
const imgEl = document.getElementById("generated-img");
const captionEl = document.getElementById("caption");

// track how many consecutive gens have occurred
let generationCount = 0;
let lastImageUrl = "";

function getRandomCeleb() {
  const index = Math.floor(Math.random() * celebs.length);
  return celebs[index];
}

async function generateImage() {
  const celeb = getRandomCeleb();
  const prompt = `Barack Obama and ${celeb} holding hands, realistic photograph, trending on artstation, 4k`;

  captionEl.textContent = `obama + ${celeb}`;
  
  try {
    // call replicate stable-diffusion
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${replicateApiToken}`,
      },
      body: JSON.stringify({
        version: "a9758cb0b6d6d5c18d0005013aa5622e056416fa987dab2f80cae3f9172e7a74", 
        // stable-diffusion 1.5 version on replicate
        input: {
          prompt: prompt,
          // keep image size small-ish to get results faster
          width: 512,
          height: 512,
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error("replicate request failed");
    }
    
    const prediction = await response.json();
    
    // poll until done
    let result = await waitForPrediction(prediction.id);
    if (result) {
      imgEl.src = result;
      lastImageUrl = result;
      copyBtn.style.display = "inline-block";
      generationCount++;
      console.log("generations in a row:", generationCount);
    }
  } catch (err) {
    console.error(err);
  }
}

// poll replicate until the prediction is complete
async function waitForPrediction(predictionId) {
  while (true) {
    const pollRes = await fetch(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${replicateApiToken}`,
        },
      }
    );
    const pollData = await pollRes.json();
    if (pollData.status === "succeeded") {
      return pollData.output[pollData.output.length - 1]; // image url
    } else if (pollData.status === "failed") {
      throw new Error("prediction failed");
    }
    // wait a bit before re-polling
    await new Promise((r) => setTimeout(r, 2000));
  }
}

// copy the image to clipboard as a blob
async function copyImageToClipboard(url) {
  try {
    const data = await fetch(url);
    const blob = await data.blob();
    const item = new ClipboardItem({ [blob.type]: blob });
    await navigator.clipboard.write([item]);
    alert("image copied to clipboard!");
  } catch (err) {
    console.error("failed to copy: ", err);
    alert("copy failed :(");
  }
}

// hook up events
generateBtn.addEventListener("click", generateImage);
copyBtn.addEventListener("click", () => {
  if (lastImageUrl) {
    copyImageToClipboard(lastImageUrl);
  }
});

