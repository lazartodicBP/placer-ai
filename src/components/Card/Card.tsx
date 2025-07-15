import React, { FC, PropsWithChildren } from "react";

interface CardProps extends PropsWithChildren {
  disabled?: boolean;
  className?: string;
}

const Card: FC<CardProps> = ({ children, disabled, className }) => {
  return (
    <div className={`card-container ${disabled ? "disabled-card" : ""} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
