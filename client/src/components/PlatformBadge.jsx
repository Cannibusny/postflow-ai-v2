import React from 'react';
import { Instagram, Facebook, Twitter, Linkedin, Music2 } from 'lucide-react';
import { PLATFORM_MAP } from '../utils/api';

const PLATFORM_ICONS = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  tiktok: Music2,
};

export default function PlatformBadge({ platform, size = 'sm' }) {
  const config = PLATFORM_MAP[platform];
  if (!config) return null;
  const Icon = PLATFORM_ICONS[platform];
  const sizeClass = size === 'sm' ? 'w-5 h-5 text-xs' : 'w-7 h-7 text-sm';

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center shrink-0`}
      style={{ backgroundColor: config.color }}
      title={config.label}
    >
      {Icon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} color="white" />}
    </div>
  );
}

export function PlatformBadgeRow({ platforms = [], size = 'sm' }) {
  return (
    <div className="flex items-center -space-x-1">
      {platforms.map((p) => (
        <PlatformBadge key={p} platform={p} size={size} />
      ))}
    </div>
  );
}
