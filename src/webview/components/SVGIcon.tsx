import React from "react";
import { useTheme } from "../context/ThemeContext";

interface SVGIconProps {
  url: string;
  tintColor?: string;
  className?: string;
  size?: number;
}

export const SVGIcon: React.FC<SVGIconProps> = ({ url, tintColor, className = "", size = 24 }) => {
  const { assetUrl } = useTheme();
  const fullUrl = `${assetUrl}/${url}`;
  const filterId = React.useMemo(
    () => `colorMatrix-${Math.random().toString(36).substring(2, 9)}`,
    [],
  );

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        display: "inline-block",
        position: "relative",
      }}
    >
      {tintColor ? (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <filter id={filterId}>
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 1
                         0 0 0 0 1
                         0 0 0 0 1
                         0 0 0 1 0"
                result="white"
              />
              <feColorMatrix
                type="matrix"
                values={`0 0 0 0 ${parseInt(tintColor.slice(1, 3), 16) / 255}
                         0 0 0 0 ${parseInt(tintColor.slice(3, 5), 16) / 255}
                         0 0 0 0 ${parseInt(tintColor.slice(5, 7), 16) / 255}
                         0 0 0 1 0`}
                in="white"
              />
            </filter>
          </defs>
          <image href={fullUrl} width={size} height={size} filter={`url(#${filterId})`} />
        </svg>
      ) : (
        <img
          src={fullUrl}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      )}
    </div>
  );
};
