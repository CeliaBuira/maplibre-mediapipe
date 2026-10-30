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


// ersatz of p5.js lerp
function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

// ersatz of p5.js dist
function dist(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;

  return Math.sqrt(dx * dx + dy * dy);
}

// ersatz of p5.js circle
function circle(x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

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
      numHands: 1,
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

  let lastIsFist: boolean = false;
  let lastPalmX: number;
  let lastPalmY: number;

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

    if (results.landmarks.length > 0) {
      console.log("Detection results:", results);
    }
    else {
      console.log("No hands detected.");
      requestAnimationFrame(detect);
      return;
    }

    // Double check that the name and index are correct when uncommenting
    let WRIST = results.landmarks[0][0]; console.log("Wrist coordinates:", WRIST);
    // let THUMB_CMC = results.landmarks[0][1];
    // let THUMB_MCP = results.landmarks[0][2];
    // let THUMB_IP = results.landmarks[0][3];
    // let THUMB_TIP = results.landmarks[0][4];
    // let INDEX_FINGER_MCP = results.landmarks[0][5];
    // let INDEX_FINGER_PIP = results.landmarks[0][6];
    // let INDEX_FINGER_DIP = results.landmarks[0][7];
    // let INDEX_FINGER_TIP = results.landmarks[0][8];
    let MIDDLE_FINGER_MCP = results.landmarks[0][9];
    // let MIDDLE_FINGER_PIP = results.landmarks[0][10];
    // let MIDDLE_FINGER_DIP = results.landmarks[0][11];
    // let MIDDLE_FINGER_TIP = results.landmarks[0][12];
    // let RING_FINGER_MCP = results.landmarks[0][13];
    // let RING_FINGER_PIP = results.landmarks[0][14];
    // let RING_FINGER_DIP = results.landmarks[0][15];
    // let RING_FINGER_TIP = results.landmarks[0][16];
    // let PINKY_MCP = results.landmarks[0][17];
    // let PINKY_PIP = results.landmarks[0][18];
    // let PINKY_DIP = results.landmarks[0][19];
    // let PINKY_TIP = results.landmarks[0][20];


    // Friendly reminder to myself (source llm)
    //     MCP: Metacarpophalangeal Joint aka Base knuckle
    //     PIP: Proximal Interphalangeal Joint akaMiddle knuckle
    //     DIP: Distal Interphalangeal Joint aka Last finger joint
    //     TIP: Fingertip

    let palmX = lerp(WRIST.x, MIDDLE_FINGER_MCP.x, 0.5);
    let palmY = lerp(WRIST.y, MIDDLE_FINGER_MCP.y, 0.5);
    // console.log("Palm coordinates:", { x: palmX, y: palmY });

    let palm_size = dist(WRIST.x, WRIST.y, MIDDLE_FINGER_MCP.x, MIDDLE_FINGER_MCP.y);





    const dist_from_palm = results.landmarks[0].map(landmark => {
      return dist(landmark.x, landmark.y, palmX, palmY) / palm_size; // normalize because this change based on the distance from webcam
    });


    let avg = dist_from_palm.reduce((a, b) => a + b, 0) / dist_from_palm.length;
    let isFist: boolean = avg < 0.6;

    // console.log("avg:", avg);
    console.log("Is fist:", isFist);

    let isDragging = false;
    if (isFist && !lastIsFist) {
      isDragging = true;
      console.log("FIST DETECTED!");
    }
    if (!isFist && lastIsFist) {
      isDragging = false;
      console.log("FIST RELEASED!");
    }

    console.log("Is dragging:", isDragging);
    if (isFist) {
      let panX = palmX - lastPalmX;
      let panY = palmY - lastPalmY;



      console.log("Pan:", { x: panX, y: panY });
      let scaleX = 30000
      let scaleY = 30000
      map.panBy([panX * scaleX, panY * scaleY]);
    }

    lastIsFist = isFist;
    lastPalmX = palmX;
    lastPalmY = palmY;


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

    if (isFist) {
      ctx.fillStyle = "#FF0000";
    }
    else {
      ctx.fillStyle = "#99339c";
    }

    circle(palmX * canvas.width, palmY * canvas.height, 10);


    ctx.fillText("Hello world", 10, 50, 240);

    requestAnimationFrame(detect);
  }

  detect();
}

startCamera();
