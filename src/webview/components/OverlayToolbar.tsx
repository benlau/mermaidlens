import React from "react";
import { useTheme } from "../context/ThemeContext";
import { IconButton } from "./IconButton";
import { SVGIcon } from "./SVGIcon";

const BUTTON_COUNT = 7;
const BUTTON_WIDTH = 36;
const GAP_WIDTH = 4;
export const OVERLAY_TOOLBAR_WIDTH = BUTTON_COUNT * BUTTON_WIDTH + (BUTTON_COUNT - 1) * GAP_WIDTH;

interface Props {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitToScreen: () => void;
  onExportPNG: () => void;
  onExportSVG: () => void;
  onCopyPNG: () => void;
  isCentered: boolean;
}

export const OverlayToolbar: React.FC<Props> = ({
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToScreen,
  onExportPNG,
  onExportSVG,
  onCopyPNG,
  isCentered,
}) => {
  const { colors } = useTheme();

  return (
    <div
      className={`fixed bottom-[20px] z-20 ${isCentered ? "left-1/2 transform -translate-x-1/2" : "left-4"}`}
    >
      <div
        className="zoom-controls flex gap-1 p-2 rounded-lg shadow-lg"
        style={{
          backgroundColor: colors.background,
        }}
      >
        <IconButton onClick={onZoomIn} alt="Zoom In">
          <SVGIcon url="plus.svg" tintColor={colors.buttonForeground} />
        </IconButton>
        <IconButton onClick={onZoomOut} alt="Zoom Out">
          <SVGIcon url="minus.svg" tintColor={colors.buttonForeground} />
        </IconButton>
        <IconButton onClick={onResetZoom} alt="Reset Zoom">
          <SVGIcon url="reset.svg" tintColor={colors.buttonForeground} />
        </IconButton>
        <IconButton onClick={onFitToScreen} alt="Fit to Screen">
          <SVGIcon url="fullscreen.svg" tintColor={colors.buttonForeground} />
        </IconButton>
        <IconButton onClick={onCopyPNG} alt="Copy to Clipboard">
          <SVGIcon url="copy.svg" tintColor={colors.buttonForeground} />
        </IconButton>
        <IconButton onClick={onExportPNG} alt="Export as PNG">
          <SVGIcon url="png.svg" tintColor={colors.buttonForeground} />
        </IconButton>
        <IconButton onClick={onExportSVG} alt="Export as SVG">
          <SVGIcon url="svg.svg" tintColor={colors.buttonForeground} />
        </IconButton>
      </div>
    </div>
  );
};
