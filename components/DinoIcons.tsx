import React from 'react';

export const TRex = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor">
    <path d="M70,20 C65,15 55,15 50,20 C45,18 40,25 35,30 C30,35 25,35 20,40 C15,45 15,55 20,60 C25,65 30,65 35,60 L35,80 C35,85 40,90 45,85 L50,80 L55,85 C60,90 65,85 65,80 L65,60 C75,55 85,45 80,30 C78,25 75,22 70,20 Z M70,35 A2,2 0 1,1 70,31 A2,2 0 0,1 70,35 Z" />
    <path d="M60,45 L75,45 L70,50 Z" opacity="0.6" /> 
  </svg>
);

export const Triceratops = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor">
    <path d="M20,50 C20,40 30,30 40,30 C45,20 55,20 60,30 C70,30 80,40 80,50 C85,55 85,65 80,70 L80,85 C80,90 70,90 70,85 L70,75 L60,75 L60,85 C60,90 50,90 50,85 L50,75 C40,75 30,65 30,60 C25,60 20,55 20,50 Z M80,45 L95,40 L90,50 Z M30,45 L15,40 L20,50 Z M50,25 L50,10 L55,25 Z" />
  </svg>
);

export const Pterodactyl = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor">
    <path d="M50,40 L20,30 C10,25 10,45 30,50 L50,55 L70,50 C90,45 90,25 80,30 L50,40 Z M50,30 C55,30 60,35 60,40 C60,45 50,60 50,60 C50,60 40,45 40,40 C40,35 45,30 50,30 Z" />
  </svg>
);

export const DinoEgg = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor">
    <path d="M50,10 C30,10 15,40 15,65 C15,85 30,95 50,95 C70,95 85,85 85,65 C85,40 70,10 50,10 Z M30,40 L40,50 L50,40 L60,50 L70,40" stroke="rgba(0,0,0,0.1)" strokeWidth="3" fill="none" />
  </svg>
);

export const Footprint = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor">
    <circle cx="50" cy="65" r="15" />
    <ellipse cx="30" cy="45" rx="8" ry="12" transform="rotate(-20 30 45)" />
    <ellipse cx="50" cy="35" rx="8" ry="15" />
    <ellipse cx="70" cy="45" rx="8" ry="12" transform="rotate(20 70 45)" />
  </svg>
);
