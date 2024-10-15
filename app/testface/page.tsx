"use client";

import * as faceapi from "face-api.js";
import { useEffect, useRef, useState } from "react";

export default function FaceDetect() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState<boolean>(false);
  const [faceDirection, setFaceDirection] =
    useState<string>("No face detected");
  const lastCaptureTime = useRef<number>(0);
  const captureDebounceTime = 100; // 2 seconds between captures

  // Load models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = process.env.NEXT_PUBLIC_PUBLIC_URL + "/models";
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
      setIsModelsLoaded(true);
    };
    loadModels();
  }, []);

  const captureAndSaveFrameFromVideo = async (boundingBox: faceapi.Box) => {
    const currentTime = Date.now();
    if (currentTime - lastCaptureTime.current < captureDebounceTime) {
      return; // Skip if not enough time has passed since last capture
    }

    if (videoRef.current) {
      const video = videoRef.current;

      try {
        // Use OffscreenCanvas to capture the face bounding box area
        const offscreenCanvas = new OffscreenCanvas(224, 224);
        const context = offscreenCanvas.getContext("2d");

        // Draw the video frame's face area onto the offscreen canvas
        if (context) {
          context.drawImage(
            video,
            boundingBox.x, // Start X position of the face
            boundingBox.y, // Start Y position of the face
            boundingBox.width - 40, // Width of the face bounding box
            boundingBox.height - 40, // Height of the face bounding box
            0, // Draw on canvas from top left corner
            0,
            boundingBox.width, // Draw to canvas same width
            boundingBox.height // Draw to canvas same height
          );

          // Convert canvas to Blob
          const blob = await offscreenCanvas.convertToBlob({
            type: "image/jpeg",
            quality: 1,
          });

          // Create FormData and append the blob
          const formData = new FormData();
          formData.append("image", blob, `capture-${Date.now()}.jpg`);

          // Send to your API endpoint
          const response = await fetch("/api/save-image", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            console.log("Image saved successfully");
          } else {
            console.error("Failed to save image");
          }
        }

        lastCaptureTime.current = currentTime;
      } catch (error) {
        console.error("Error capturing and saving frame from video:", error);
      }
    }
  };

  // activate cam
  useEffect(() => {
    if (isModelsLoaded && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: {} }).then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    }
  }, [isModelsLoaded]);

  // Calculate face pose angles
  const calculateFacePose = (landmarks: any) => {
    const nose = landmarks.getNose();
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    // Get center points
    const noseTop = nose[3];
    const noseBottom = nose[6];

    // Calculate eye centers
    const leftEyeCenter = {
      x:
        leftEye.reduce((sum: number, point: any) => sum + point.x, 0) /
        leftEye.length,
      y:
        leftEye.reduce((sum: number, point: any) => sum + point.y, 0) /
        leftEye.length,
    };
    const rightEyeCenter = {
      x:
        rightEye.reduce((sum: number, point: any) => sum + point.x, 0) /
        rightEye.length,
      y:
        rightEye.reduce((sum: number, point: any) => sum + point.y, 0) /
        rightEye.length,
    };

    // Calculate yaw (left-right)
    const eyeDistance = rightEyeCenter.x - leftEyeCenter.x;
    const noseCenterX = (noseTop.x + noseBottom.x) / 2;
    const eyesCenterX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
    const yaw = ((noseCenterX - eyesCenterX) / eyeDistance) * 100;

    // Calculate pitch (up-down)
    const eyeLevel = (leftEyeCenter.y + rightEyeCenter.y) / 2;
    const noseHeight = noseBottom.y - noseTop.y;
    const pitch = ((noseBottom.y - eyeLevel) / noseHeight - 1.5) * 50;

    return { yaw, pitch };
  };

  // Determine face direction based on angles
  const getFaceDirection = (pose: { yaw: number; pitch: number }) => {
    const { yaw, pitch } = pose;

    const yawThreshold = 12;
    const pitchThreshold = 10;

    if (Math.abs(pitch) > pitchThreshold) {
      if (pitch < 90 && yaw < 10) return "Up";
      if (pitch > 140 && yaw < 10) return "Down";
    }

    if (Math.abs(yaw) > yawThreshold) {
      if (yaw < 0) return "Right";
      if (yaw > 15) return "Left";
    }

    return "Straight";
  };

  // face detect && landmarks
  const handleVideoPlay = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const displaySize = { width: video.width, height: video.height };
      faceapi.matchDimensions(canvas, displaySize);

      setInterval(async () => {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );
        const context = canvas.getContext("2d");

        if (context) {
          context.clearRect(0, 0, canvas.width, canvas.height);

          if (resizedDetections.length > 0) {
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

            const pose = calculateFacePose(resizedDetections[0].landmarks);
            const direction = getFaceDirection(pose);
            setFaceDirection(`Looking: ${direction}`);

            // Get the bounding box of the detected face
            const boundingBox = resizedDetections[0].detection.box;

            // Capture when looking left
            // if (direction === "Straight") {
            //   captureAndSaveFrameFromVideo(boundingBox);
            // }

            context.fillStyle = "white";
            context.font = "16px Arial";
            context.fillText(
              `Yaw: ${pose.yaw.toFixed(1)} Pitch: ${pose.pitch.toFixed(1)}`,
              10,
              20
            );
          } else {
            setFaceDirection("No face detected");
          }
        }
      }, 100);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        onPlay={handleVideoPlay}
        width="720"
        height="560"
        style={{ position: "absolute", top: 0, left: 0 }}
      />
      <canvas
        ref={canvasRef}
        width="720"
        height="560"
        style={{ position: "absolute", top: 0, left: 0 }}
      />
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: "rgba(0,0,0,0.7)",
          color: "white",
          padding: "20px",
          borderRadius: "5px",
          fontSize: "24px",
          fontWeight: "bold",
        }}
      >
        {faceDirection}
      </div>
    </div>
  );
}
