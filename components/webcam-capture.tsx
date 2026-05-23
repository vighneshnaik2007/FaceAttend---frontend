'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type WebcamCaptureProps = {
  /** When true, starts camera and optional frame capture loop */
  active: boolean;
  /** Called with a JPEG data-URL (for API upload) */
  onFrame?: (dataUrl: string) => void;
  /** Ms between automatic frames while active (default 1500) */
  frameIntervalMs?: number;
  className?: string;
  mirrored?: boolean;
};

export function WebcamCapture({
  active,
  onFrame,
  frameIntervalMs = 1500,
  className,
  mirrored = true,
}: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onFrameRef = useRef(onFrame);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  onFrameRef.current = onFrame;

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return null;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    if (mirrored) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', 0.85);
  }, [mirrored]);

  useEffect(() => {
    if (!active) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setReady(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : 'Camera access denied. Allow camera permission in your browser.',
        );
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [active]);

  useEffect(() => {
    if (!active || !onFrame || !ready) return;

    const tick = () => {
      const dataUrl = captureFrame();
      if (dataUrl) onFrameRef.current?.(dataUrl);
    };

    tick();
    const id = window.setInterval(tick, frameIntervalMs);
    return () => window.clearInterval(id);
  }, [active, ready, frameIntervalMs, captureFrame, onFrame]);

  return (
    <div className={cn('relative aspect-video rounded-xl overflow-hidden bg-black', className)}>
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-red-200 text-sm">
          {error}
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={cn('w-full h-full object-cover', mirrored && 'scale-x-[-1]')}
          />
          {active && ready && (
            <div className="absolute inset-0 border-4 border-emerald-500/80 rounded-xl pointer-events-none animate-pulse" />
          )}
          {active && !ready && !error && (
            <div className="absolute inset-0 flex items-center justify-center text-white/80 text-sm">
              Starting camera…
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Capture a single still from an active video element (for Register page). */
export function captureVideoFrame(video: HTMLVideoElement, mirrored = true): string | null {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return null;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  if (mirrored) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.92);
}
