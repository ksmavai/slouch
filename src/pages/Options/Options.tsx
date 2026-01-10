import React, { useEffect, useState, useRef, useCallback } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
// import * as tf from "@tensorflow/tfjs-core";
import '@tensorflow/tfjs-backend-webgl';
import Webcam from 'react-webcam';
import {
  drawKeypoints,
  drawSkeleton,
  drawReferenceLine,
  drawCanvas,
} from './modules/draw_utils';
import './Options.css';

const Options = () => {
  // state management
  const [isWatching, setIsWatching] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  
  // refs for video and canvas
  const camRef = useRef<any>(null);
  const canvasRef = useRef<any>(null);
  let portRef = useRef<any>(null);
  
  // alignment tracking variables
  let REFERENCE_POSITION = useRef<any>(null);
  let currentPosition = useRef<any>(null);
  let MAX_DEVIATION = useRef(25);
  
  // detection configuration
  let detector: any | null = null;
  const DETECTION_RATE = 100;
  const IS_PANEL_OPEN = true;



  /**
   * Initializes the detection model and starts continuous monitoring
   *
   * @returns void
   */
  const loadMoveNet = async () => {
    const detectorConfig = {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
    };
    detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      detectorConfig
    );

    // continuous detection loop
    const detectionInterval = setInterval(() => {
      return detect(detector);
    }, DETECTION_RATE);
  };

  /**
   * Performs pose estimation on video frame and processes results
   *
   * @param {model} detection model instance
   * @returns void
   */
  const detect = async (model: { estimatePoses: (arg0: any) => any }) => {
    if (
      typeof camRef.current !== 'undefined' &&
      camRef.current !== null &&
      camRef.current.video &&
      camRef.current.video.readyState === 4
    ) {
      const video = camRef.current.video;
      const videoWidth = camRef.current.video.videoWidth;
      const videoHeight = camRef.current.video.videoHeight;

      camRef.current.video.width = videoWidth;
      camRef.current.video.height = videoHeight;

      const poses = await model.estimatePoses(video);

      if (
        !poses ||
        !poses[0] ||
        !poses[0].keypoints ||
        poses[0].keypoints.length < 3
      )
        return;

      handlePose(poses);
      drawCanvas(
        poses,
        video,
        videoWidth,
        videoHeight,
        canvasRef,
        REFERENCE_POSITION.current
      );
    }
  };

  /**
   * Processes detected keypoints and evaluates alignment status
   *
   * @param {(obj[])} Array of pose detection results
   * @returns void
   */
  const handlePose = async (poses: { keypoints: { y: number }[] }[]) => {
    try {
      let rightEyePosition = poses[0].keypoints[2].y;
      currentPosition.current = rightEyePosition;

      if (!rightEyePosition) return;
      
      // initialize reference if not set
      if (REFERENCE_POSITION.current == null) {
        handleAlignment({ baseline: currentPosition.current });
      }

      // calculate deviation from reference
      const delta = Math.abs(
        currentPosition.current - REFERENCE_POSITION.current
      );

      // determine alignment status based on threshold
      if (delta > MAX_DEVIATION.current) {
        handleAlignment({ alignment: 'bad' });
      } else {
        handleAlignment({ alignment: 'good' });
      }
    } catch (error) {
      console.error(error);
    }
  };

  // relay alignment status to content script
  function handleAlignment(msg: { baseline?: any; alignment?: any }) {
    if (msg.baseline) REFERENCE_POSITION.current = msg.baseline;
    if (msg.alignment && portRef.current) {
      try {
        const message = { alignment: msg.alignment };
        console.log('[options] sending alignment message:', message);
        portRef.current.postMessage(message);
      } catch (error) {
        console.error('Failed to send alignment message:', error);
      }
    }
  }

  // camera control handlers
  const handleToggleCamera = () => {
    setIsWatching((isCurrentlyWatching: boolean) => {
      const newWatchingState = !isCurrentlyWatching;
      if (newWatchingState) {
        chrome.action.setBadgeText({ text: 'ON' });
        document.title = 'Slouch - Active Monitoring';
      } else {
        chrome.action.setBadgeText({ text: 'OFF' });
        document.title = 'Slouch - Options';
      }

      return newWatchingState;
    });
  };
  const handleResetBaseline = () => {
    REFERENCE_POSITION.current = null;
  };

  // device enumeration and selection
  interface IDevice {
    deviceId: string;
    label: string;
  }
  
  const handleDevices = useCallback(
    (mediaDevices: MediaDeviceInfo[]) => {
      interface IMediaDevice {
        deviceId: string | null;
        groupId: string | null;
        kind: string | null;
        label: string | null;
      }

      const cameras = mediaDevices.filter(
        (device: { kind: string }) => device.kind === 'videoinput'
      );

      if (!cameras.length) return;
      setDevices(cameras);
      setDeviceId(cameras[0].deviceId);
    },
    [setDevices]
  );

  // switch camera device
  async function handleSetDeviceId(e: React.ChangeEvent<HTMLSelectElement>) {
    await setDeviceId(e.target.value);
    await setIsWatching(false);
    await setIsWatching((isWatching: boolean) => !isWatching);
  }

  // port communication setup
  useEffect(() => {
    chrome.runtime.onConnect.addListener(function (port: chrome.runtime.Port) {
      if (port.name === 'set-options') {
        // send 'isWatching' and the panel status to popup script
        port.postMessage({
          action: 'SET_IS_WATCHING',
          payload: { isWatching },
        });
        port.postMessage({
          action: 'SET_IS_PANEL_OPEN',
          payload: { isPanelOpen: IS_PANEL_OPEN },
        });

        // handle messages from popup
        port.onMessage.addListener(async function (msg: any) {
          if (msg.action === 'SET_MAX_DEVIATION') {
            if (!msg.payload.MAX_DEVIATION) return;
            MAX_DEVIATION.current = msg.payload.MAX_DEVIATION;
          }

          if (msg.action === 'RESET_BASELINE') {
            REFERENCE_POSITION.current = null;
          }
          if (msg.action === 'TOGGLE_WATCHING') {
            if (msg.payload.isWatching === null) return;
            setIsWatching(msg.payload.isWatching);
            chrome.action.setBadgeText({
              text: msg.payload.isWatching ? 'ON' : 'OFF',
            });
          }
        });
        port.onDisconnect.addListener((event: any) => {
          // console.log("port disconnected", event)
        });
      }
    });
  }, [isWatching]);

  // initialize detection system
  useEffect(() => {
    loadMoveNet();
    portRef.current = chrome.runtime.connect({ name: 'relay-detection' });
  }, []);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(handleDevices);
  }, [handleDevices]);

  return (
    <>
      <div className="App">
        <div className="container">
          <div className="camera-container">
            {!isWatching && 'Start Camera'}
            {isWatching && (
              <>
                <Webcam
                  audio={false}
                  ref={camRef}
                  videoConstraints={{ deviceId: deviceId }}
                />
                <canvas ref={canvasRef} />
              </>
            )}
          </div>
          <div className="card options-container">
            <h1>Slouch</h1>
            <div className="button-container">
              <button 
                onClick={handleToggleCamera}
                className={isWatching ? 'btn-stop' : 'btn-start'}
                style={{
                  marginBottom: '10px',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                {isWatching ? 'Stop' : 'Start'}
              </button>
              {isWatching && (
                <div>
                  <button onClick={handleResetBaseline}>Reset Baseline</button>
                  <p>Reset the reference alignment position</p>
                </div>
              )}
            </div>
            <div className="select-container">
              <select
                onChange={handleSetDeviceId}
                value={deviceId}
                style={{
                  alignSelf: 'center',
                }}
              >
                {devices.map((device: MediaDeviceInfo, key: number) => (
                  <option value={device.deviceId} key={key}>
                    {device.label || `Device ${key + 1}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Options;
