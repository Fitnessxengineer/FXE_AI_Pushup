import DeviceDetector from "https://cdn.skypack.dev/device-detector-js@2.2.10";
// Usage: testSupport({client?: string, os?: string}[])
// Client and os are regular expressions.
// See: https://cdn.jsdelivr.net/npm/device-detector-js@2.2.10/README.md for
// legal values for client and os
testSupport([
    { client: 'Chrome' },
]);
function testSupport(supportedDevices) {
    const deviceDetector = new DeviceDetector();
    const detectedDevice = deviceDetector.parse(navigator.userAgent);
    let isSupported = false;
    for (const device of supportedDevices) {
        if (device.client !== undefined) {
            const re = new RegExp(`^${device.client}$`);
            if (!re.test(detectedDevice.client.name)) {
                continue;
            }
        }
        if (device.os !== undefined) {
            const re = new RegExp(`^${device.os}$`);
            if (!re.test(detectedDevice.os.name)) {
                continue;
            }
        }
        isSupported = true;
        break;
    }
    if (!isSupported) {
        alert(`This demo, running on ${detectedDevice.client.name}/${detectedDevice.os.name}, ` +
            `is not well supported at this time, expect some flakiness while we improve our code.`);
    }
}
const controls = window;
const LandmarkGrid = window.LandmarkGrid;
const drawingUtils = window;
const mpPose = window;
const options = {
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${mpPose.VERSION}/${file}`;
    }
};
// Our input frames will come from here.
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const controlsElement = document.getElementsByClassName('control-panel')[0];
const canvasCtx = canvasElement.getContext('2d');
// We'll add this to our control panel later, but we'll save it here so we can
// call tick() each time the graph runs.
//const fpsControl = new controls.FPS();
// Optimization: Turn off animated spinner after its hiding animation is done.
const spinner = document.querySelector('.loading');
spinner.ontransitionend = () => {
    spinner.style.display = 'none';
};
const landmarkContainer = document.getElementsByClassName('landmark-grid-container')[0];
const grid = new LandmarkGrid(landmarkContainer, {
    connectionColor: 0xCCCCCC,
    definedColors: [{ name: 'LEFT', value: 0xffa500 }, { name: 'RIGHT', value: 0x00ffff }],
    range: 2,
    fitToGrid: true,
    labelSuffix: 'm',
    landmarkSize: 2,
    numCellsPerAxis: 4,
    showHidden: false,
    centered: true,
});
// Recreating Angle Method from Python in JS using ChatGPT **************************************************************
function calculateAngle(a, b, c) {
    const angle = Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(a[1] - b[1], a[0] - b[0]);
    let degrees = Math.abs(angle * 180 / Math.PI);
    if (degrees > 180) {
        degrees = 360 - degrees;
    }
    return degrees;
}
//Constant for logging instant angle *********************************************************
const iangle = document.getElementById("iangle");
const hangle = document.getElementById("hangle");
const repetition = document.getElementById("repetition");
let angle_history = [];
let max_angle = 0; //Highest angle achieved across all reps
let avg_angle = 0; // Let for tracking the current 10 frame average
//For counting Reps
let stage = "action";
let counter = 0;
var maxrep = 0;
let activeEffect = 'mask';
function onResults(results) {
    // Hide the spinner.
    document.body.classList.add('loaded');
    // Update the frame rate.
    //fpsControl.tick();
    // Draw the overlays.
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    if (results.segmentationMask) {
        canvasCtx.drawImage(results.segmentationMask, 0, 0, canvasElement.width, canvasElement.height);
        // Only overwrite existing pixels.
        if (activeEffect === 'mask' || activeEffect === 'both') {
            canvasCtx.globalCompositeOperation = 'source-in';
            // This can be a color or a texture or whatever...
            canvasCtx.fillStyle = '#00FF007F';
            canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
        }
        else {
            canvasCtx.globalCompositeOperation = 'source-out';
            canvasCtx.fillStyle = '#0000FF7F';
            canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
        }
        // Only overwrite missing pixels.
        canvasCtx.globalCompositeOperation = 'destination-atop';
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.globalCompositeOperation = 'source-over';
    }
    else {
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    }
    //Create 3 points for Angle Calculation
    const RIGHT_HIP = 24;
    const LEFT_HIP = 23;
    const RIGHT_KNEE = 26;
    const LEFT_KNEE = 25;
    const RIGHT_SHOULDER = 12;
    const LEFT_SHOULDER = 11;
    const RIGHT_ELBOW = 14;
    const LEFT_ELBOW = 13;
    const RIGHT_WRIST = 16;
    const LEFT_WRIST = 15;
    if (results.poseLandmarks) {
        //Angle Calculation
        const poseLandmarks = results.poseLandmarks;
        //Right Elbow
        const a = [poseLandmarks[RIGHT_WRIST].x, poseLandmarks[RIGHT_WRIST].y];
        const b = [poseLandmarks[RIGHT_ELBOW].x, poseLandmarks[RIGHT_ELBOW].y];
        const c = [poseLandmarks[RIGHT_SHOULDER].x, poseLandmarks[RIGHT_SHOULDER].y];
        const angle_r = calculateAngle(a, b, c);
        //Left Elbow
        const x = [poseLandmarks[LEFT_WRIST].x, poseLandmarks[LEFT_WRIST].y];
        const y = [poseLandmarks[LEFT_ELBOW].x, poseLandmarks[LEFT_ELBOW].y];
        const z = [poseLandmarks[LEFT_SHOULDER].x, poseLandmarks[LEFT_SHOULDER].y];
        const angle_l = calculateAngle(x, y, z);
        const angle = (angle_r < angle_l) ? angle_r : angle_l;
        //Hips Angle Calc
        //Right Hip
        const ah = [poseLandmarks[RIGHT_KNEE].x, poseLandmarks[RIGHT_KNEE].y];
        const bh = [poseLandmarks[RIGHT_HIP].x, poseLandmarks[RIGHT_HIP].y];
        const ch = [poseLandmarks[RIGHT_SHOULDER].x, poseLandmarks[RIGHT_SHOULDER].y];
        const angle_rh = calculateAngle(ah, bh, ch);
        //Left Hip
        const xh = [poseLandmarks[LEFT_KNEE].x, poseLandmarks[LEFT_KNEE].y];
        const yh = [poseLandmarks[LEFT_HIP].x, poseLandmarks[LEFT_HIP].y];
        const zh = [poseLandmarks[LEFT_SHOULDER].x, poseLandmarks[LEFT_SHOULDER].y];
        const angle_lh = calculateAngle(xh, yh, zh);
        const angleh = (angle_rh + angle_lh) / 2;
        //Show Instant Angle on Screen
        iangle.textContent = Math.round(angle).toString();
        hangle.textContent = Math.round(angleh).toString();
        //Calculate Average Angle and Track Max Angle
        angle_history.push(angle);
        if (angle_history.length > 10) {
            angle_history.splice(0, 1);
        }
        if (angle_history.length > 0) {
            avg_angle = angle_history.reduce((a, b) => a + b) / angle_history.length;
        }
        if (avg_angle < 90) {
            stage = "action";
        }
        if (avg_angle > 120 && stage == 'action') {
            stage = "ready";
            counter += 1;
            maxrep += 1;
            repetition.textContent = maxrep.toString();
        }
        // Drawing Utils *************************************************
        drawingUtils.drawConnectors(canvasCtx, results.poseLandmarks, mpPose.POSE_CONNECTIONS.slice(9), { visibilityMin: 0.65, color: 'white' });
        drawingUtils.drawLandmarks(canvasCtx, Object.values(mpPose.POSE_LANDMARKS_LEFT).slice(5)
            .map(index => results.poseLandmarks[index]), { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(255,138,0)' });
        drawingUtils.drawLandmarks(canvasCtx, Object.values(mpPose.POSE_LANDMARKS_RIGHT).slice(5)
            .map(index => results.poseLandmarks[index]), { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(0,217,231)' });
        drawingUtils.drawLandmarks(canvasCtx, Object.values(mpPose.POSE_LANDMARKS_NEUTRAL).slice(1)
            .map(index => results.poseLandmarks[index]), { visibilityMin: 0.65, color: 'white', fillColor: 'white' });
    }
    canvasCtx.restore();
    if (results.poseWorldLandmarks) {
        grid.updateLandmarks(results.poseWorldLandmarks, mpPose.POSE_CONNECTIONS, [
            { list: Object.values(mpPose.POSE_LANDMARKS_LEFT), color: 'LEFT' },
            { list: Object.values(mpPose.POSE_LANDMARKS_RIGHT), color: 'RIGHT' },
        ]);
    }
    else {
        grid.updateLandmarks([]);
    }
}
const pose = new mpPose.Pose(options);
pose.onResults(onResults);
//const pose = new mpPose.Pose(options);
//pose.onResults(onResults);
// Present a control panel through which the user can manipulate the solution
// options.
new controls
    .ControlPanel(controlsElement, {
    selfieMode: true,
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
})
    .add([
    new controls.StaticText({ title: 'Push Up Counter' }),
    new controls.SourcePicker({
        onSourceChanged: () => {
            // Resets because this model gives better results when reset between
            // source changes.
            pose.reset();
        },
        onFrame: async (input, size) => {
            const aspect = size.height / size.width;
            let width, height;
            if (window.innerWidth > window.innerHeight) {
                height = window.innerHeight;
                width = height / aspect;
            }
            else {
                width = window.innerWidth;
                height = width * aspect;
            }
            canvasElement.width = width;
            canvasElement.height = height;
            await pose.send({ image: input });
        },
    }),
])
    .on(x => {
    const options = x;
    videoElement.classList.toggle('selfie', options.selfieMode);
    activeEffect = x['effect'];
    pose.setOptions(options);
});
