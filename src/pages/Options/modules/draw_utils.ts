// https://github.com/tensorflow/tfjs-models/blob/9b5d3b663638752b692080145cfb123fa324ff11/pose-detection/demos/live_video/src/camera.js
import * as poseDetection from '@tensorflow-models/pose-detection';

/**
 * Renders pose detection visualization on canvas overlay
 *
 * @param {(obj[])} detected poses array
 * @param {(obj)} video element
 * @param {(int)} video width in pixels
 * @param {(int)} video height in pixels
 * @param {(obj)} canvas ref object
 * @param {(number)} reference baseline height
 * @returns void
 */
export const drawCanvas = (
  poses: { keypoints: any }[],
  video: any,
  videoWidth: any,
  videoHeight: any,
  canvas: any,
  referenceBaseline: any
) => {
  if (canvas.current == null) return;
  const ctx = canvas.current.getContext('2d');

  canvas.current.width = videoWidth;
  canvas.current.height = videoHeight;

  if (poses[0].keypoints != null) {
    drawKeypoints(poses[0].keypoints, ctx, referenceBaseline);
    drawReferenceLine(poses[0].keypoints, ctx, referenceBaseline);
    // drawSkeleton(poses[0].keypoints, poses[0].id, ctx);
  }
};

/**
 * Renders keypoint markers on video overlay
 * @param keypoints detected keypoint coordinates
 * @param ctx canvas rendering context
 * @param referenceHeight baseline reference for comparison
 */
export function drawKeypoints(
  keypoints: any,
  ctx: any,
  referenceHeight: any
) {
  const currentHeight = keypoints[2].y;
  const delta = currentHeight - referenceHeight;

  const keypointInd = poseDetection.util.getKeypointIndexBySide(
    poseDetection.SupportedModels.MoveNet
  );
  ctx.fillStyle = 'Red';
  ctx.strokeStyle = 'White';
  ctx.lineWidth = 1;

  ctx.fillStyle ='rgb(0, 0, 255)'; // green if delta is positive
  if (delta > 25 || delta < -25) {
    ctx.fillStyle ='rgb(255, 0, 129)'; // TODO: make this a configurable parameter to match the MAX_DEVIATION val
  }

  for (const i of keypointInd.middle) {
    drawKeypoint(keypoints[i], ctx);
  }

  // ctx.fillStyle = "Green";
  for (const i of keypointInd.left) {
    drawKeypoint(keypoints[i], ctx);
  }

  // ctx.fillStyle = "Orange";
  for (const i of keypointInd.right) {
    drawKeypoint(keypoints[i], ctx);
  }
}

function drawKeypoint(keypoint: any, ctx: any) {
  // If score is null, just show the keypoint.
  const score = keypoint.score != null ? keypoint.score : 1;
  const scoreThreshold = 0.3;

  if (score >= scoreThreshold) {
    const circle = new Path2D();
    circle.arc(keypoint.x, keypoint.y, 4, 0, 2 * Math.PI);

    ctx.fill(circle);
    // ctx.stroke(circle);
  }
}

/**
 * Renders skeleton connections between keypoints (currently unused)
 * @param keypoints detected keypoint coordinates
 * @param poseId unique pose identifier
 * @param ctx canvas rendering context
 */
export function drawSkeleton(keypoints: any, poseId: any, ctx: any) {
  // Each poseId is mapped to a color in the color palette.
  const color = 'White';
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;

  poseDetection.util
    .getAdjacentPairs(poseDetection.SupportedModels.MoveNet)
    .forEach(([i, j]) => {
      const kp1 = keypoints[i];
      const kp2 = keypoints[j];

      // If score is null, just show the keypoint.
      const score1 = kp1.score != null ? kp1.score : 1;
      const score2 = kp2.score != null ? kp2.score : 1;
      const scoreThreshold = 0.3;

      if (score1 >= scoreThreshold && score2 >= scoreThreshold) {
        ctx.beginPath();
        ctx.moveTo(kp1.x, kp1.y);
        ctx.lineTo(kp2.x, kp2.y);
        ctx.stroke();
      }
    });
}

/**
 * Draws the reference alignment line and visual feedback overlay
 * @param keypoints A list of keypoints.
 * @param ctx current context of the canvas.
 * @param referenceHeight baseline reference height for comparison.
 */
export function drawReferenceLine(
  keypoints: any,
  ctx: any,
  referenceHeight: number
) {
  const currentHeight = keypoints[2].y;
  const delta = currentHeight - referenceHeight;

  // draw the reference baseline indicator
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(0, referenceHeight);
  ctx.lineTo(600, referenceHeight);
  ctx.stroke();

  // draw current position indicator
  ctx.beginPath();
  ctx.moveTo(0, currentHeight);
  ctx.lineTo(800, currentHeight);
  ctx.stroke();

  // visual feedback overlay based on deviation
  ctx.fillStyle = 'rgba(0, 0, 255, 0.51)';
  if (delta > 25 || delta < -25) {
    ctx.fillStyle = 'rgba(255, 0, 128, 0.53)';
  }

  ctx.fillRect(0, referenceHeight, 800, delta);
}
