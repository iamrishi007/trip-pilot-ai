"use client";

import { useState } from "react";
import Image from "next/image";

const DESTINATION_IMAGE =
  "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1600&q=80";

export default function HeroVisual() {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="hero-visual" aria-hidden="true">
      {!imageFailed && (
        <Image
          className="hero-photo"
          src={DESTINATION_IMAGE}
          alt=""
          fill
          sizes="(max-width: 839px) 100vw, 50vw"
          priority
          onError={() => setImageFailed(true)}
        />
      )}
      <div className="hero-visual-wash" />
      <div className="sky-stage">
        <div className="orbit-ring" />
        <svg className="route-arc" viewBox="0 0 420 180">
          <path d="M20 140 C 120 20, 300 20, 400 110" />
        </svg>
        <div className="plane-rig">
          <svg className="plane-svg" viewBox="0 0 120 48">
            <defs>
              <linearGradient id="planeMetal" x1="0" x2="1">
                <stop offset="0%" stopColor="#f8fbff" />
                <stop offset="55%" stopColor="#c9d9f2" />
                <stop offset="100%" stopColor="#8eb4e8" />
              </linearGradient>
            </defs>
            <ellipse cx="78" cy="42" rx="28" ry="4" fill="rgba(6,16,32,0.28)" />
            <path
              d="M8 28 L92 18 C108 16 114 22 104 26 L62 34 L54 44 L46 34 L22 38 Z"
              fill="url(#planeMetal)"
            />
            <path d="M52 20 L78 6 L84 10 L64 26 Z" fill="#d7e6f8" />
            <path d="M70 30 L88 38 L82 40 L62 32 Z" fill="#9fb6d6" />
            <circle cx="34" cy="30" r="2.2" fill="#1d4ed8" />
            <path d="M96 21 L112 24 L96 27 Z" fill="#38bdf8" />
          </svg>
        </div>
      </div>
      <div className="destination-chip chip-a">Paris</div>
      <div className="destination-chip chip-b">Dubai</div>
      <div className="destination-chip chip-c">Tokyo</div>
    </div>
  );
}
