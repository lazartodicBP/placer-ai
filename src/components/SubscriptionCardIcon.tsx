import React from 'react';

type SubscriptionIconProps = {
  src: string;
  alt?: string;
  tier: 'silver' | 'gold' | 'platinum';
};

const gradientMap: Record<SubscriptionIconProps['tier'], string> = {
  silver: 'radial-gradient(circle, #C0C0C0, #ffffff)',
  gold: 'radial-gradient(circle, #FFD700, #fff8dc)',
  platinum: 'radial-gradient(circle, #d3d3d3, #ffffff)',
};

export const SubscriptionIcon = ({ src, alt = 'Subscription plan', tier }: SubscriptionIconProps) => {
  return (
    <div
      style={{
        backgroundImage: gradientMap[tier],
        padding: '12px',
        borderRadius: '8px',
        display: 'inline-block',
      }}
    >
      <img
        src={src}
        width={240}
        height={100}
        alt={alt}
        loading="lazy"
      />
    </div>
  );
};
