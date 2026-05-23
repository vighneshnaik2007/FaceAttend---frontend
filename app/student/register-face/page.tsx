'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, Loader2, RefreshCw, ScanFace } from 'lucide-react';
import { toast } from 'sonner';
import { StudentHeader } from '@/components/student/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { apiFaceStatus, apiRegisterFaceAngles } from '@/lib/api';

const FACE_STEPS = [
  'Look straight at camera',
  'Turn slightly left',
  'Turn slightly right',
  'Tilt head slightly up',
  'Tilt head slightly down',
];

export default function StudentRegisterFacePage() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraRequestRef = useRef(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [reRegistering, setReRegistering] = useState(false);

  const showRegistrationForm = !checkingStatus && (!faceRegistered || reRegistering);
  const currentStep = Math.min(capturedImages.length, FACE_STEPS.length - 1);
  const progress = (capturedImages.length / FACE_STEPS.length) * 100;

  const stopCamera = useCallback(() => {
    cameraRequestRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraReady(false);
    stopCamera();
    const requestId = cameraRequestRef.current + 1;
    cameraRequestRef.current = requestId;

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      if (cameraRequestRef.current !== requestId) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        if (cameraRequestRef.current !== requestId) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        setCameraReady(true);
      }
    } catch (error) {
      if (cameraRequestRef.current === requestId) {
        setCameraError(error instanceof Error ? error.message : 'Could not open camera.');
      }
    }
  }, [stopCamera]);

  useEffect(() => {
    if (showRegistrationForm && capturedImages.length < FACE_STEPS.length) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [showRegistrationForm, capturedImages.length, startCamera, stopCamera]);

  useEffect(() => {
    const usn = user?.usn?.trim().toUpperCase();
    if (!usn) return;

    let cancelled = false;
    setCheckingStatus(true);
    apiFaceStatus(usn)
      .then((res) => {
        if (cancelled) return;
        const registered = Boolean(res.registered ?? res.faceRegistered ?? res.face_registered);
        setFaceRegistered(registered);
        setReRegistering(false);
      })
      .catch(() => {
        if (!cancelled) setFaceRegistered(false);
      })
      .finally(() => {
        if (!cancelled) setCheckingStatus(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.usn]);

  const captureCurrentAngle = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      toast.error('Camera not ready');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      toast.error('Could not capture photo');
      return;
    }

    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImages((prev) => [...prev, dataUrl].slice(0, FACE_STEPS.length));
  };

  const resetCaptures = () => {
    setCapturedImages([]);
    setCameraError(null);
  };

  const handleRegisterFace = async () => {
    const usn = user?.usn?.trim().toUpperCase();
    if (!usn) {
      toast.error('Could not find your student USN. Please log in again.');
      return;
    }
    if (capturedImages.length !== FACE_STEPS.length) {
      toast.error('Capture all 5 face angles first');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRegisterFaceAngles(usn, capturedImages);
      if (res?.success === false) {
        throw new Error(res.message || 'Face registration failed');
      }
      setFaceRegistered(true);
      setReRegistering(false);
      setCapturedImages([]);
      stopCamera();
      localStorage.setItem(
        'faceRegistrationStatus',
        JSON.stringify({ usn, registered: true, registered_at: new Date().toISOString() }),
      );
      window.dispatchEvent(new Event('face-registration-updated'));
      toast.success('Five-angle face registered successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Face registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <StudentHeader title="Register Face" />

      <main className="p-4 sm:p-6 space-y-6">
        <Card className="card-shadow max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanFace className="w-5 h-5 text-[#7C3AED]" />
              Register Face
            </CardTitle>
            <p className="text-sm text-[#64748B]">
              Capture five guided face angles for stronger attendance recognition.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {checkingStatus ? (
              <div className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-sm text-[#64748B]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking face registration status...
              </div>
            ) : !showRegistrationForm ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-600" />
                  <p className="text-lg font-semibold text-emerald-800">Face Already Registered</p>
                </div>
                <Button variant="outline" onClick={() => setReRegistering(true)}>
                  Re-register Face
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>Step {Math.min(capturedImages.length + 1, FACE_STEPS.length)}/5</span>
                    <span className="text-[#64748B]">{capturedImages.length}/5 captured</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[#E2E8F0] dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-[#7C3AED] transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="font-semibold text-[#1E293B] dark:text-slate-100">
                      {capturedImages.length < FACE_STEPS.length
                        ? FACE_STEPS[currentStep]
                        : 'All 5 angles captured'}
                    </p>
                  </div>
                </div>

                <div className="relative aspect-video overflow-hidden rounded-xl bg-black border">
                  {capturedImages.length < FACE_STEPS.length ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="h-full w-full object-cover scale-x-[-1]"
                      />
                      {!cameraReady && !cameraError && (
                        <div className="absolute inset-0 flex items-center justify-center text-white/80 text-sm">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Starting camera...
                        </div>
                      )}
                      {cameraError && (
                        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-red-200 text-sm">
                          {cameraError}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-white/80">
                      All captures complete. Review thumbnails below, then register.
                    </div>
                  )}
                </div>

                {capturedImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {capturedImages.map((image, index) => (
                      <div key={`${image.slice(0, 24)}-${index}`} className="space-y-2">
                        <img
                          src={image}
                          alt={`Face angle ${index + 1}`}
                          className="aspect-square w-full rounded-lg border object-cover"
                        />
                        <p className="text-xs text-[#64748B]">{FACE_STEPS[index]}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  {capturedImages.length < FACE_STEPS.length && (
                    <>
                      <Button onClick={captureCurrentAngle} disabled={!cameraReady || submitting}>
                        <Camera className="w-4 h-4 mr-2" />
                        Capture Step {capturedImages.length + 1}
                      </Button>
                      {cameraError && (
                        <Button variant="outline" onClick={startCamera} disabled={submitting}>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Retry Camera
                        </Button>
                      )}
                    </>
                  )}

                  {capturedImages.length > 0 && (
                    <Button variant="outline" onClick={resetCaptures} disabled={submitting}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset Captures
                    </Button>
                  )}

                  {capturedImages.length === FACE_STEPS.length && (
                    <Button onClick={handleRegisterFace} disabled={submitting}>
                      {submitting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ScanFace className="w-4 h-4 mr-2" />
                      )}
                      {submitting ? 'Registering...' : 'Register Face'}
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
