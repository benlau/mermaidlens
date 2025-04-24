import React, { useEffect, useState, useRef, useCallback } from "react";
import mermaid from "mermaid";
import {
  WebviewWindow,
  WebviewMessage,
  MermaidBlockInfo,
  accessMermaidBlockInfo,
} from "../../types/message";
import { OverlayToolbar, OVERLAY_TOOLBAR_WIDTH } from "./OverlayToolbar";
import { useTheme } from "../context/ThemeContext";
import { Debouncer } from "../../utils/Debouncer";
import "../index.css";
import cn from "classnames";
import {
  accessImageFrameCoords,
  DEFAULT_VIEWER_STATE,
  ImageFrameCoords,
} from "../../types/ImageFrameCoords";

export const BOTTOM_MARGIN = 56;
export const MAX_SCALE = 5;
export const MIN_SCALE = 0.2;

interface Props {
  initialBlockInfo: MermaidBlockInfo;
  pngResolution: number;
}

export const MermaidViewer: React.FC<Props> = ({ initialBlockInfo, pngResolution }) => {
  const { colors, mermaidTheme, exportMermaidTheme } = useTheme();
  const [blockInfo, setBlockInfo] = useState(initialBlockInfo);
  const lastRenderedBlockInfo = useRef<MermaidBlockInfo | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [viewerState, setViewerState] = useState<ImageFrameCoords>(DEFAULT_VIEWER_STATE);
  const [isInitialized, setIsInitialized] = useState(false);

  const boundaryRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const isDragging = useRef<boolean>(false);
  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const refreshDebouncer = useRef(new Debouncer(200));

  const showNotification = useCallback((message: string, type: "info" | "error" | "warning") => {
    const vscode = (window as unknown as WebviewWindow).vscode;
    if (vscode) {
      vscode.postMessage({
        type: "showNotification",
        message,
        notificationType: type,
      });
    }
  }, []);

  const getSvgElementSize = useCallback(async (container: HTMLDivElement) => {
    const svg = container.querySelector("svg");
    if (!svg) return { width: 0, height: 0 };

    return new Promise<{ width: number; height: number }>((resolve) => {
      requestAnimationFrame(() => {
        const bbox = svg.getBBox();
        resolve({ width: bbox.width, height: bbox.height });
      });
    });
  }, []);

  const getFileName = useCallback(() => {
    // No need to remove special characters, as the file name is generated from the document URI
    return blockInfo.documentUri.path.split("/").pop()?.split(".")[0] || "mermaid-diagram";
  }, [blockInfo.documentUri]);

  const renderMermaidToSVG = useCallback(async () => {
    if (!blockInfo.content) return;

    const theme = exportMermaidTheme === "auto" ? mermaidTheme : exportMermaidTheme;

    mermaid.initialize({
      startOnLoad: false,
      theme,
      securityLevel: "loose",
    });

    const uniqueId = `${blockInfo.documentUri}-${Date.now()}`.replace(/[^a-zA-Z0-9]/g, "-");
    const { svg } = await mermaid.render(`mermaid-${uniqueId}`, blockInfo.content);

    return svg;
  }, [blockInfo, exportMermaidTheme, mermaidTheme]);

  const renderMermaidToPNG = useCallback(async () => {
    const svg = await renderMermaidToSVG();

    if (!svg) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    return new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.src = "data:image/svg+xml," + encodeURIComponent(svg);

      img.onload = () => {
        const resolution = pngResolution;
        const aspectRatio = img.width / img.height;

        let width = resolution;
        let height = resolution;

        if (aspectRatio > 1) {
          height = Math.round(resolution / aspectRatio);
        } else {
          width = Math.round(resolution * aspectRatio);
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        const png = canvas.toDataURL("image/png");
        resolve(png);
      };

      img.onerror = () => {
        reject(new Error("Failed to load SVG image"));
      };
    });
  }, [renderMermaidToSVG, pngResolution]);

  const updateMermaidGraph = useCallback(async () => {
    if (!blockInfo.content || !imageRef.current) return;

    const isSameBlock = accessMermaidBlockInfo(blockInfo).isSameBlock(
      lastRenderedBlockInfo.current,
    );

    const isContentChanged = accessMermaidBlockInfo(blockInfo).isContentChanged(
      lastRenderedBlockInfo.current,
    );

    if (!isContentChanged) {
      return;
    }

    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: mermaidTheme,
        securityLevel: "loose",
      });

      const { svg } = await mermaid.render(
        `mermaid-${Math.random().toString(36).slice(2)}`,
        blockInfo.content,
      );

      imageRef.current.innerHTML = svg;

      const size = await getSvgElementSize(imageRef.current);

      setError(null);
      lastRenderedBlockInfo.current = blockInfo;

      setViewerState((prev) => {
        const accessor = accessImageFrameCoords(prev).setImageRect({
          x: 0,
          y: 0,
          width: size.width,
          height: size.height,
        });

        if (!isSameBlock) {
          return accessor.reset().data;
        } else {
          return accessor.preventExceedBoundary().data;
        }
      });
      setIsInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to render diagram");
      if (!isSameBlock) {
        //Load an invalid block clear the previous diagram
        imageRef.current.innerHTML = "";
      }
      lastRenderedBlockInfo.current = blockInfo;
    }
  }, [blockInfo, mermaidTheme, getSvgElementSize]);

  useEffect(() => {
    refreshDebouncer.current.debounce(updateMermaidGraph);
  }, [updateMermaidGraph]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data as WebviewMessage;
      if (message.type === "updateMermaidGraph") {
        setBlockInfo(message.blockInfo);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const handleZoomIn = useCallback(() => {
    setViewerState(
      (prev) =>
        accessImageFrameCoords(prev)
          .setScale(Math.min(prev.scale * 1.2, MAX_SCALE))
          .preventExceedBoundary().data,
    );
  }, []);

  const handleZoomOut = useCallback(() => {
    setViewerState(
      (prev) =>
        accessImageFrameCoords(prev)
          .setScale(Math.max(prev.scale / 1.2, MIN_SCALE))
          .preventExceedBoundary().data,
    );
  }, []);

  const handleResetZoom = useCallback(() => {
    setViewerState((prev) => accessImageFrameCoords(prev).reset().preventExceedBoundary().data);
  }, []);

  const handleFitToScreen = useCallback(() => {
    if (!imageRef.current) return;
    setViewerState(
      (prev) => accessImageFrameCoords(prev).scaleToFit().preventExceedBoundary().data,
    );
  }, []);

  const updateSvgTransform = useCallback(() => {
    if (imageRef.current && viewerState.imageRect) {
      const centerX = viewerState.imageRect.width / 2;
      const centerY = viewerState.imageRect.height / 2;
      imageRef.current.style.width = `${viewerState.imageRect.width}px`;
      imageRef.current.style.height = `${viewerState.imageRect.height}px`;
      imageRef.current.style.transformOrigin = `${centerX}px ${centerY}px`;
      imageRef.current.style.transform = `translate(${viewerState.offsetX - centerX}px, ${viewerState.offsetY - centerY}px) scale(${viewerState.scale})`;
    }
  }, [viewerState]);

  useEffect(() => {
    updateSvgTransform();
  }, [viewerState, updateSvgTransform]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;

    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;

    setViewerState(
      (prev) =>
        accessImageFrameCoords(prev)
          .setOffsetX(prev.offsetX + dx)
          .setOffsetY(prev.offsetY + dy)
          .preventExceedBoundary().data,
    );
    startPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      if (!imageRef.current) return;

      const containerRect = boundaryRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      const containerCenterX = containerRect.width / 2;
      const containerCenterY = containerRect.height / 2;

      const currentCenterX = (containerCenterX - viewerState.offsetX) / viewerState.scale;
      const currentCenterY = (containerCenterY - viewerState.offsetY) / viewerState.scale;

      const MAX_DELTA = 1.1;
      const MIN_DELTA = 0.9;
      const delta = e.deltaY > 0 ? MIN_DELTA : MAX_DELTA;
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, viewerState.scale * delta));

      const newOffsetX = containerCenterX - currentCenterX * newScale;
      const newOffsetY = containerCenterY - currentCenterY * newScale;

      setViewerState(
        (prev) =>
          accessImageFrameCoords(prev)
            .setScale(newScale)
            .setOffsetX(newOffsetX)
            .setOffsetY(newOffsetY)
            .preventExceedBoundary().data,
      );
    },
    [viewerState],
  );

  useEffect(() => {
    const viewport = boundaryRef.current;
    if (viewport) {
      viewport.addEventListener("wheel", handleWheel, { passive: false });
      return () => {
        viewport.removeEventListener("wheel", handleWheel);
      };
    }
  }, [handleWheel]);

  const exportAsPNG = useCallback(async () => {
    try {
      const png = await renderMermaidToPNG();
      if (!png) return;

      const link = document.createElement("a");
      link.download = `${getFileName()}.png`;
      link.href = png;
      link.click();
      link.remove();
    } catch (err) {
      showNotification(
        "Failed to export PNG: " + (err instanceof Error ? err.message : "Unknown error"),
        "error",
      );
    }
  }, [renderMermaidToPNG, showNotification, getFileName]);

  const exportAsSVG = useCallback(async () => {
    try {
      const svg = await renderMermaidToSVG();
      if (!svg) return;

      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.download = `${getFileName()}.svg`;
      link.href = url;
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export SVG:", err);
      showNotification(
        "Failed to export SVG: " + (err instanceof Error ? err.message : "Unknown error"),
        "error",
      );
    }
  }, [showNotification, renderMermaidToSVG, getFileName]);

  const copyPNGToClipboard = useCallback(async () => {
    try {
      const png = await renderMermaidToPNG();
      if (!png) return;
      const response = await fetch(png);
      const blob = await response.blob();

      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ]);

      showNotification("Diagram copied to clipboard", "info");
    } catch (err) {
      showNotification(
        "Failed to copy PNG: " + (err instanceof Error ? err.message : "Unknown error"),
        "error",
      );
    }
  }, [renderMermaidToPNG, showNotification]);

  const updateContainerSize = useCallback(() => {
    if (!boundaryRef.current) return;
    const { width, height } = boundaryRef.current.getBoundingClientRect();
    setViewerState((prev) => {
      const innerFrameHeight = height - BOTTOM_MARGIN < 0 ? height : height - BOTTOM_MARGIN;

      return accessImageFrameCoords(prev)
        .setBoundaryRegion({
          x: 0,
          y: 0,
          width,
          height,
        })
        .setInnerFrameRect({
          x: 0,
          y: 0,
          width,
          height: innerFrameHeight,
        })
        .preventExceedBoundary().data;
    });
  }, []);

  useEffect(() => {
    updateContainerSize();
  }, [updateContainerSize]);

  useEffect(() => {
    if (!boundaryRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      updateContainerSize();
    });

    resizeObserver.observe(boundaryRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateContainerSize]);

  return (
    <div
      className="overflow-hidden fixed left-[0px] top-[0px] right-[0px] bottom-[0px]"
      ref={boundaryRef}
      style={{
        backgroundColor: colors.background,
        color: colors.foreground,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <OverlayToolbar
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onFitToScreen={handleFitToScreen}
        onExportPNG={exportAsPNG}
        onExportSVG={exportAsSVG}
        onCopyPNG={copyPNGToClipboard}
        isCentered={(boundaryRef.current?.clientWidth ?? 0) >= OVERLAY_TOOLBAR_WIDTH}
      />

      {error && (
        <div
          className={cn(
            "fixed top-0 left-0 w-full h-full z-10 m-2",
            "break-words bg-transparent font-mono whitespace-pre-line whitespace-pre-wrap",
          )}
          style={{
            color: colors.foreground,
          }}
        >
          {error}
        </div>
      )}

      <div
        ref={imageRef}
        className="z-1"
        style={{
          opacity: isInitialized ? 1 : 0,
        }}
      ></div>
    </div>
  );
};
