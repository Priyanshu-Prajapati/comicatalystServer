const generateForm = document.querySelector(".generate-form");
const styleSelector = document.querySelector("#style-selector");

async function fetchHuggingFaceApiKey() {
  try {
      const response = await fetch('https://comicatalystserver-production.up.railway.app/get-huggingface-api-key');
      
      if (!response.ok) {
          throw new Error('Failed to fetch API key');
      }

      const data = await response.json();
      console.log('Hugging Face API Key Fetched');
      return data.api_key;
  } catch (error) {
      console.error('Error:', error.message);
  }
}

const modelMap = {
  Folklore: "fffiloni/cozy-book-800",
  Cute: "fffiloni/cute-comic-800",
  Cartoon: "AIGCDuckBoss/fluxlora_cute-cartoon",
  BNW: "glif-loradex-trainer/djmenorobl_Creepy_Black_And_White_Saturated_Images",
  ThreeD: "goofyai/3D_Render_for_Flux",
  Realistic: "stabilityai/stable-diffusion-3.5-large",
};

const styleAppendText = {
  Folklore: ".in the style of TOK",
  Cute: ".in the style of TOK",
  Cartoon: ",Brush painting style,Cartoon Style",
  BNW: "dark image, saturated",
  ThreeD: "3D render",
  Realistic: "",
};
// Connect to the WebSocket server
const socket = new WebSocket("wss://comicatalystserver-production.up.railway.app");

socket.onopen = () => {
  console.log("WebSocket connection established");
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "image") {
    // Update the image for all users
    const { imageUrl, index} = data;
    updateImageCardForAllUsers(imageUrl, index );
  }
};

socket.onclose = () => {
  console.log("WebSocket connection closed");
};

socket.onerror = (error) => {
  console.error("WebSocket error:", error);
};

// Function to update images for all users
function updateImageCardForAllUsers(imageUrl, index) {
  const containers = document.querySelectorAll(".container1, .container2, .container3");
  const pageIndex = Math.floor(index / 4);
  const container = containers[pageIndex];

  if (container) {
    const imageBoxes = container.querySelectorAll(".boxx");
    if (index % 4 < imageBoxes.length) {
      const imgCard = imageBoxes[index % 4].querySelector(".img-card img");
      if (imgCard) {
        imgCard.src = imageUrl;
        imgCard.onload = () => {
          imageBoxes[index % 4].classList.remove("loading");
          imgCard.style.width = "100%";
          imgCard.style.height = "100%";
          imgCard.style.objectFit = "cover";
          imgCard.style.objectPosition = "center";
        };
      }
    }
  }
}

const getActiveContainers = () => {
  // Get all containers (pages)
  return document.querySelectorAll(".container1, .container2, .container3");
};

const updateImageCard = (imageBlob, index) => {
  const containers = getActiveContainers(); // Get all visible containers
  const pageIndex = Math.floor(index / 4); // Determine which page to display the image on (0 for page 1, 1 for page 2, etc.)

  const container = containers[pageIndex];
  if (container) {
    const imageBoxes = container.querySelectorAll(".boxx"); // Select all boxes inside the container
    if (index % 4 < imageBoxes.length) {
      // Ensure we only update valid boxes on the page
      const imgCard = imageBoxes[index % 4].querySelector(".img-card img"); // Find image inside the box

      if (imgCard) {
        imgCard.src = URL.createObjectURL(imageBlob); // Update image source
        imgCard.onload = () => {
          imageBoxes[index % 4].classList.remove("loading"); // Remove loading state
          imgCard.style.width = "100%"; // Ensure the image fills the container width
          imgCard.style.height = "100%"; // Ensure the image fills the container height
          imgCard.style.objectFit = "cover"; // Ensures the image covers the whole area without distortion
          imgCard.style.objectPosition = "center"; // Center the image
        };
      }
    }
  }
};

const generateAiImages = async (userPrompt) => {
  const styleSelectElement = document.querySelector("#style-selector");
  const selectedStyle = styleSelectElement.value;
  const modelName = modelMap[selectedStyle] || modelMap["Folklore"];

  // ✅ Wait for the token to resolve before making the API request
  const token = await fetchHuggingFaceApiKey(); 

  try {
    const response = await fetch(
      `https://router.huggingface.co/hf-inference/models/${modelName}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ inputs: userPrompt }),
      }
    );
    return await response.blob(); // Convert response to image blob
  } catch (error) {
    alert(error.message);
  }
};

const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const handleFormSubmission = async (e) => {
  e.preventDefault();

  const userPrompt = e.target[0].value; // Get user input
  if (!userPrompt) return;

  const styleSelectElement = document.querySelector("#style-selector");
  const selectedStyle = styleSelectElement.value;
  const appendText = styleAppendText[selectedStyle];

  const sentences = userPrompt
    .split(".")
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0)
    .map((sentence) => {
      if (selectedStyle === "ThreeD") {
        return `${appendText} + ${sentence}`;
      } else {
        return `${sentence} + ${appendText}`;
      }
    });

  // Ensure to show 4 images on each page (containers)
  if (sentences.length < 4) {
    alert("Please give at least a 4-sentence story.");
    return;
  }
  if (sentences.length > 12) {
    alert("Please limit to a 12-sentence story.");
    return;
  }

  // Get all boxes in the containers
  const containers = getActiveContainers();
  const totalImages = sentences.length;

  // Show loading state in each box
  containers.forEach((container) => {
    const imageBoxes = container.querySelectorAll(".boxx");
    imageBoxes.forEach((box, index) => {
      const imgElement = box.querySelector(".img-card img");
      if (index < totalImages) {
        if (imgElement) {
          imgElement.src = "images/loader.svg"; // Show loader
          imgElement.style.width = "30px"; // Set width to 30px
          imgElement.style.height = "30px"; // Set height to 30px
        }
      }
    });
  });

  // Generate images for each sentence
  for (let index = 0; index < sentences.length; index++) {
    const sentence = sentences[index];
    const imageBlob = await generateAiImages(sentence);

    // Convert the imageBlob to a Base64 string
    const base64Image = await blobToBase64(imageBlob);
    console.log("Base64 Image:", base64Image);

    // Send the Base64 image to the WebSocket server
    socket.send(
      JSON.stringify({
        type: "image",
        index: index,
        imageUrl: base64Image,
      })
    );

    // Update the image locally
    updateImageCard(imageBlob, index);
  }
};

generateForm.addEventListener("submit", handleFormSubmission);