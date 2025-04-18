import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import classNames from "classnames";

interface Props {
  onClick: () => void;
  alt: string;
  className?: string;
  children: React.ReactNode;
}

export const IconButton: React.FC<Props> = ({ onClick, alt, className, children }) => {
  const { colors } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const backgroundColor =
    isActive || isHovered ? colors.buttonHoverBackground : colors.buttonBackground;

  const buttonClasses = classNames(
    "flex items-center justify-center p-2 cursor-pointer border-none transition-colors duration-200 select-none",
    {
      "w-9 h-9 min-w-9 min-h-9": true,
    },
    className,
  );

  return (
    <button
      onClick={onClick}
      title={alt}
      className={buttonClasses}
      style={{
        backgroundColor,
        color: colors.buttonForeground,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsActive(false);
      }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
    >
      <div className="flex items-center justify-center w-full h-full">{children}</div>
    </button>
  );
};
