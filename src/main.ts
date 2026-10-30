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
  if (!ctx) { return; }
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// ersatz of p5.js remap
function remap(value: number, start1: number, stop1: number, start2: number, stop2: number): number {
  return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
}

const map = new Map({
  container: 'map', // container id
  style: 'https://tiles.openfreemap.org/styles/liberty', // style URL
  center: [5.372, 43.296], // starting position [lng, lat]
  zoom: 6.5, // starting zoom
  maplibreLogo: true
});


const video = document.getElementById("video") as HTMLVideoElement;

const canvasUnderlay = document.getElementById("underlay") as HTMLCanvasElement;
const ctxUnderlay = canvasUnderlay.getContext("2d");
if (!ctxUnderlay) {
  throw new Error("Failed to get 2D context for underlay");
}

ctxUnderlay.fillStyle = "white";
ctxUnderlay.fillRect(0, 0, canvasUnderlay.width, canvasUnderlay.height);

ctxUnderlay.fillStyle = "black";
ctxUnderlay.font = "bold 10px";
ctxUnderlay.textAlign = "center";
ctxUnderlay.textBaseline = "middle";

ctxUnderlay.fillText("Enable your camera to continue", canvasUnderlay.width / 2, canvasUnderlay.height / 2)
ctxUnderlay.fillText("Then start waving your hand and fist across the scene", canvasUnderlay.width / 2, canvasUnderlay.height / 2 + 20);


const canvas = document.getElementById("overlay") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("Failed to get 2D context");
}

ctx.fillStyle = "rgb(200 0 0)";
ctx.fillRect(10, 10, 5, 5);

ctx.fillStyle = "rgb(0 0 200 / 50%)";
ctx.fillRect(12, 12, 5, 5);


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

  let accumulatedPanX = 0;
  let accumulatedPanY = 0;

  let isDragging = false;


  console.log("video height:", video.videoHeight);
  if (!ctx) {
    console.error("Canvas context not found");
    return;
  }
  const drawingUtils = new DrawingUtils(ctx);

  // Detection loop
  function detect() {
    if (!ctx) { return; }

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

    const handLandmarks = results.landmarks[0];

    if (!handLandmarks) {
      requestAnimationFrame(detect);
      return;
    }
    // Double check that the name and index are correct when uncommenting
    let WRIST = handLandmarks[0]; // console.log("Wrist coordinates:", WRIST);
    // let THUMB_CMC = handLandmarks[1];
    // let THUMB_MCP = handLandmarks[2];
    // let THUMB_IP = handLandmarks[3];
    // let THUMB_TIP = handLandmarks[4];
    // let INDEX_FINGER_MCP = handLandmarks[5];
    // let INDEX_FINGER_PIP = handLandmarks[6];
    // let INDEX_FINGER_DIP = handLandmarks[7];
    // let INDEX_FINGER_TIP = handLandmarks[8];
    let MIDDLE_FINGER_MCP = handLandmarks[9];
    // let MIDDLE_FINGER_PIP = handLandmarks[10];
    // let MIDDLE_FINGER_DIP = handLandmarks[11];
    // let MIDDLE_FINGER_TIP = handLandmarks[12];
    // let RING_FINGER_MCP = handLandmarks[13];
    // let RING_FINGER_PIP = handLandmarks[14];
    // let RING_FINGER_DIP = handLandmarks[15];
    // let RING_FINGER_TIP = handLandmarks[16];
    // let PINKY_MCP = handLandmarks[17];
    // let PINKY_PIP = handLandmarks[18];
    // let PINKY_DIP = handLandmarks[19];
    // let PINKY_TIP = handLandmarks[20];



    // Friendly reminder to myself (source llm)
    //     MCP: Metacarpophalangeal Joint aka Base knuckle
    //     PIP: Proximal Interphalangeal Joint akaMiddle knuckle
    //     DIP: Distal Interphalangeal Joint aka Last finger joint
    //     TIP: Fingertip

    if (!WRIST || !MIDDLE_FINGER_MCP) {
      requestAnimationFrame(detect);
      return;
    }

    let palmX = lerp(WRIST.x, MIDDLE_FINGER_MCP.x, 0.5);
    let palmY = lerp(WRIST.y, MIDDLE_FINGER_MCP.y, 0.5);
    // console.log("Palm coordinates:", { x: palmX, y: palmY });

    let palm_size = dist(WRIST.x, WRIST.y, MIDDLE_FINGER_MCP.x, MIDDLE_FINGER_MCP.y);





    const dist_from_palm = handLandmarks.map(landmark => {
      return dist(landmark.x, landmark.y, palmX, palmY) / palm_size; // normalize because this change based on the distance from webcam
    });


    let avg = dist_from_palm.reduce((a, b) => a + b, 0) / dist_from_palm.length;
    let isFist: boolean = avg < 0.6;

    // console.log("avg:", avg);
    console.log("Is fist:", isFist);
    console.log("lastIsFist:", lastIsFist);


    if (isFist && !lastIsFist) {
      isDragging = true;
      accumulatedPanX = 0;
      accumulatedPanY = 0;
      console.log("FIST DETECTED!");


    }
    else if (!isFist && lastIsFist) {
      isDragging = false;
      console.log("FIST RELEASED!");
    }

    if (isDragging && !isFist) {
      // in some case e.g you went out of the camera view while dragging you donkey
      // so stop dragging 
      isDragging = false;
    }

    console.log("Is dragging:", isDragging);
    if (isDragging) {
      let panX = palmX - lastPalmX;
      let panY = palmY - lastPalmY;

      accumulatedPanX += panX;
      accumulatedPanY += panY;

      if (Math.abs(accumulatedPanX) > 0.1 || Math.abs(accumulatedPanY) > 0.1) {
        console.log("Accumulated Pan:", { x: accumulatedPanX, y: accumulatedPanY });




        const center = map.getCenter();
        const point = map.project(center);


        const containerRect = map.getContainer().getBoundingClientRect();

        console.log("accumulatedPanX:", accumulatedPanX)
        console.log("accumulatedPanY:", accumulatedPanY);

        let canvasRatio = canvas.width / canvas.height;

        let panPixelX = remap(accumulatedPanX, -1, 1, -containerRect.width, containerRect.width);
        let panPixelY = remap(accumulatedPanY * canvasRatio, -1, 1, -containerRect.height, containerRect.height);

        map.panBy([panPixelX, -panPixelY]);
        // point.y += remap(accumulatedPanY, -1, 1, containerRect.bottom, containerRect.top);

        // const newCenter = map.unproject(point);

        // map.panTo(newCenter);

        accumulatedPanX = 0;
        accumulatedPanY = 0;

        // map.easeTo({
        //   center: newCenter,
        //   duration: 0
        // });

      }




      // let scaleX = 30000
      // let scaleY = 30000
      // map.panBy([panX * scaleX, panY * scaleY]);
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

    if (isDragging) {
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
