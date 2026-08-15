import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
}

export function VideoPlayer({ src, poster, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(e => {
        console.error("Playback failed:", e);
        setError("Playback failed. Please try again.");
      });
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    setIsLoading(false);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    let clientX: number;
    
    if ('clientX' in e) {
      clientX = e.clientX;
    } else {
      clientX = e.touches[0]?.clientX || 0;
    }
    
    const pos = (clientX - rect.left) / rect.width;
    videoRef.current.currentTime = Math.max(0, Math.min(pos * videoRef.current.duration, videoRef.current.duration));
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  const handleError = useCallback(() => {
    const el = videoRef.current;
    const mediaError = el?.error ?? null;
    const codeMap: Record<number, string> = {
      1: "MEDIA_ERR_ABORTED",
      2: "MEDIA_ERR_NETWORK",
      3: "MEDIA_ERR_DECODE",
      4: "MEDIA_ERR_SRC_NOT_SUPPORTED",
    };
    const detail = mediaError ? (codeMap[mediaError.code] ?? `Unknown code ${mediaError.code}`) : "No MediaError reported";

    console.error("[VideoPlayer] Video load/playback failed", {
      detail,
      code: mediaError?.code ?? null,
      message: mediaError?.message || null,
      src,
      networkState: el?.networkState ?? null,
      readyState: el?.readyState ?? null,
      currentSrc: el?.currentSrc ?? null,
    });

    setIsLoading(false);
    setError("Video playback failed. Please check your connection or file format.");
  }, [src]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className={cn("flex flex-col w-full bg-black rounded-3xl overflow-hidden border border-white/10 relative", className)}
    >
      {/* Media Area */}
      <div 
        className="relative w-full aspect-video bg-zinc-900 flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={togglePlay}
      >
        {src && (
          <video
            ref={videoRef}
            key={src} // Add key back for the detail player to ensure clean state on source change
            className="w-full h-full object-contain bg-zinc-900"
            onPlay={() => {
              setIsPlaying(true);
              setIsLoading(false);
            }}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onWaiting={() => setIsLoading(true)}
            onCanPlay={() => setIsLoading(false)}
            onError={handleError}
            playsInline
            preload="auto" // Change back to auto for the actual player to encourage buffering
            crossOrigin="anonymous"
          >
            <source src={src} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}

        {isLoading && !error && !isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-10 pointer-events-none">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-10 p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-destructive font-bold mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RotateCcw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </div>
        )}
      </div>

      {/* External Control Bar */}
      <div className="w-full bg-zinc-950 p-4 border-t border-white/5 space-y-4">
        {/* Progress Slider */}
        <div 
          className="relative w-full h-2 bg-white/10 rounded-full cursor-pointer group"
          onClick={(e) => {
            e.stopPropagation();
            handleSeek(e);
          }}
        >
          <div 
            className="absolute top-0 left-0 h-full bg-primary rounded-full pointer-events-none" 
            style={{ width: `${progress}%` }}
          />
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ left: `calc(${progress}% - 8px)` }}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="text-white hover:bg-white/10 rounded-xl touch-manipulation"
              disabled={!!error}
            >
              {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
            </Button>

            <div className="text-[10px] font-bold text-white/70 uppercase tracking-widest tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 group/volume">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                className="text-white hover:bg-white/10 rounded-xl touch-manipulation"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                onClick={(e) => e.stopPropagation()}
                className="w-20 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
 
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="text-white hover:bg-white/10 rounded-xl touch-manipulation"
            >
              <Maximize className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
