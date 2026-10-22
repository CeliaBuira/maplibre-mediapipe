import {Map, setWorkerUrl} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

setWorkerUrl(workerUrl);

// const map = new Map({
//     container: 'map', // container id
//     style: 'https://demotiles.maplibre.org/style.json', // style URL
//     center: [0, 0], // starting position [lng, lat]
//     zoom: 1, // starting zoom
//     maplibreLogo: true
// });


const video = document.getElementById("video");

// 2. Start the camera.
async function startCamera() {
  // startBtn.disabled = true;
  try {
    video.srcObject = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
    });
    video.addEventListener("loadeddata", () => {
    //   canvas.width = video.videoWidth;
    //   canvas.height = video.videoHeight;
    //   startBtn.textContent = "Running";
    //   requestAnimationFrame(loop);
    });
  } catch (err) {
    console.error(err); 
    // statusEl.textContent = `Camera error: ${err.message}`;
    // startBtn.disabled = false;
  }
}
