# slouch

a chrome extension that monitors your posture in real-time using computer vision, providing visual feedback when you slouch. it uses **tensorflow.js** and **movenet** pose detection to track your alignment and blurs web pages when poor posture is detected.

## 🚀 key features

*   **real-time pose detection**: using tensorflow.js movenet model.
*   **visual feedback**: page blurring when poor alignment is detected.
*   **customizable baseline**: set your reference posture position.
*   **cross-tab monitoring**: works across all browser tabs.
*   **privacy-first**: all processing happens locally, no data is sent to servers.

## 🛠️ technologies

*   **react 17**
*   **typescript**
*   **tensorflow.js**
*   **movenet**
*   **webpack 5**
*   **chrome extension apis**

## 🔒 privacy

all processing happens locally on your device. no data is collected, stored, or transmitted. the extension only uses your webcam for real-time pose detection and does not save any images or video.

## 📄 license

MIT