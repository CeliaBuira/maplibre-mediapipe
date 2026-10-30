import { Map, setWorkerUrl } from 'maplibre-gl';
import {
  FilesetResolver,
  // HandLandmarkerResult,
  DrawingUtils,
  HandLandmarker
} from '@mediapipe/tasks-vision';

import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

setWorkerUrl(workerUrl);

const map = new Map({
  container: 'map', // container id
  style: 'https://demotiles.maplibre.org/style.json', // style URL
  center: [0, 0], // starting position [lng, lat]
  zoom: 1, // starting zoom
  maplibreLogo: true
});


const video = document.getElementById("video");

const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

ctx.fillStyle = "rgb(200 0 0)";
ctx.fillRect(10, 10, 50, 50);

ctx.fillStyle = "rgb(0 0 200 / 50%)";
ctx.fillRect(30, 30, 50, 50);


console.log("Starting camera...");
// 2. Start the camera.
// async function startCamera() {
//   // startBtn.disabled = true;
//   try {
//     video.srcObject = await navigator.mediaDevices.getUserMedia({
//       video: { width: 640, height: 480 },
//     });
//     video.addEventListener("loadeddata", () => {
//     //   canvas.width = video.videoWidth;
//     //   canvas.height = video.videoHeight;
//     //   startBtn.textContent = "Running";
//     //   requestAnimationFrame(loop);
//     });
//   } catch (err) {
//     console.error(err); 
//     // statusEl.textContent = `Camera error: ${err.message}`;
//     // startBtn.disabled = false;
//   }
// }


async function startCamera() {

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  const handLandmarker = await HandLandmarker.createFromOptions(
    vision,
    {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      },
      runningMode: "VIDEO",
      numHands: 2,
    }
  );

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });

    video.srcObject = stream;
  } catch (error) {
    console.error('Erreur lors de l’accès à la caméra :', error);
  }
  await new Promise<void>((resolve) => {
    video.onloadeddata = () => resolve();
  });

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  console.log("video height:", video.videoHeight);
  const drawingUtils = new DrawingUtils(ctx);

  // Detection loop
  function detect() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgb(200 0 0)";
    ctx.fillRect(10, 10, 50, 50);

    ctx.fillStyle = "rgb(0 0 200 / 50%)";
    ctx.fillRect(30, 30, 50, 50);


    const results = handLandmarker.detectForVideo(
      video,
      performance.now()
    );

    // Draw detected hands
    for (const landmarks of results.landmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        HandLandmarker.HAND_CONNECTIONS,
        {
          color: "#00FF00",
          lineWidth: 3,
        }
      );

      drawingUtils.drawLandmarks(landmarks, {
        color: "#FF0000",
        lineWidth: 1,
        radius: 4,
      });
    }

    requestAnimationFrame(detect);
  }

  detect();
}

startCamera();


/*

// Create task for image file processing:
const vision = await FilesetResolver.forVisionTasks(
  // path/to/wasm/root
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm "
);


const gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
  baseOptions: {
    modelAssetPath: "https://storage.googleapis.com/mediapipe-tasks/gesture_recognizer/gesture_recognizer.task"
  },
  numHands: 2
});

await gestureRecognizer.setOptions({ runningMode: "video" });

let lastVideoTime = -1;
function renderLoop() {
  const video = document.getElementById("video");

  if (video.currentTime !== lastVideoTime) {
    const gestureRecognitionResult = gestureRecognizer.recognizeForVideo(video);
    processResult(gestureRecognitionResult);
    lastVideoTime = video.currentTime;
  }

  requestAnimationFrame(() => {
    renderLoop();
  });
}

renderLoop();
*/