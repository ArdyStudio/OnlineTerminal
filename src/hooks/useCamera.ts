import { useState, useCallback, useRef } from 'react';

export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = useCallback(async () => {
    try {
      // If we already have a stream, just make sure it's active and connected
      if (stream) {
        if (videoRef.current && videoRef.current.srcObject !== stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }
        return;
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          aspectRatio: 3/4,
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 1706 }
        },
        audio: false
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(console.error);
      }
      setError(null);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please check permissions.');
    }
  }, [stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        stream.removeTrack(track);
      });
      setStream(null);
    }
  }, [stream]);

  const capture = useCallback((filter: string): string | null => {
    if (!videoRef.current) return null;

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    const canvas = document.createElement('canvas');
    const targetAspect = 3 / 4;
    const videoAspect = video.videoWidth / video.videoHeight;
    
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = video.videoWidth;
    let sourceHeight = video.videoHeight;

    if (videoAspect > targetAspect) {
      // Too wide (landscape/4:3/16:9), crop sides
      sourceWidth = video.videoHeight * targetAspect;
      sourceX = (video.videoWidth - sourceWidth) / 2;
    } else if (videoAspect < targetAspect) {
      // Too tall, crop top/bottom
      sourceHeight = video.videoWidth / targetAspect;
      sourceY = (video.videoHeight - sourceHeight) / 2;
    }

    // Set consistent resolution for photostrip processing (higher res for quality)
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Mirror the capture to match the mirrored preview
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      
      // Apply filter to canvas context
      ctx.filter = filter;
      
      // Draw cropped image
      ctx.drawImage(
        video, 
        sourceX, sourceY, sourceWidth, sourceHeight, 
        0, 0, canvas.width, canvas.height
      );
      return canvas.toDataURL('image/jpeg', 0.95);
    }
    return null;
  }, []);

  return {
    videoRef,
    stream,
    error,
    startCamera,
    stopCamera,
    capture
  };
}
