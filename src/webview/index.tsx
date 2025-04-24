import React from "react";
import { createRoot } from "react-dom/client";
import { MermaidViewer } from "./components/MermaidViewer";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";

const root = createRoot(document.getElementById("root")!);
root.render(
  <ThemeProvider>
    <MermaidViewer
      initialBlockInfo={window.initialBlockInfo}
      pngResolution={window.exportPngResolution}
    />
  </ThemeProvider>,
);
