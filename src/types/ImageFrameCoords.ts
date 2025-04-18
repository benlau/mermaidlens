export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ImageFrameCoords = {
  scale: number;
  offsetX: number;
  offsetY: number;
  imageRect: Rect | undefined;
  boundaryRect: Rect | undefined;
  innerFrameRect: Rect | undefined;
};

export const DEFAULT_VIEWER_STATE: ImageFrameCoords = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  imageRect: undefined,
  boundaryRect: undefined,
  innerFrameRect: undefined,
};

export class ImageFrameCoordsAccessor {
  data: ImageFrameCoords;

  constructor(data: ImageFrameCoords) {
    this.data = data;
  }

  setScale(scale: number) {
    this.data = {
      ...this.data,
      scale: scale,
    };
    return this;
  }

  setOffsetX(offsetX: number) {
    this.data = {
      ...this.data,
      offsetX: offsetX,
    };
    return this;
  }

  setOffsetY(offsetY: number) {
    this.data = {
      ...this.data,
      offsetY: offsetY,
    };
    return this;
  }

  setImageRect(imageRect?: Rect) {
    this.data = {
      ...this.data,
      imageRect: imageRect,
    };
    return this;
  }

  setBoundaryRegion(boundaryRegion: Rect) {
    this.data = {
      ...this.data,
      boundaryRect: boundaryRegion,
    };
    return this;
  }

  setInnerFrameRect(innerFrameRect: Rect) {
    this.data = {
      ...this.data,
      innerFrameRect: innerFrameRect,
    };
    return this;
  }

  center() {
    if (!this.data.boundaryRect) {
      this.data = {
        ...this.data,
        offsetX: 0,
        offsetY: 0,
      };
    } else {
      const boundaryRegion = this.data.boundaryRect;
      const centerX = boundaryRegion.x + boundaryRegion.width / 2;
      const centerY = boundaryRegion.y + boundaryRegion.height / 2;
      this.data = {
        ...this.data,
        offsetX: centerX,
        offsetY: centerY,
      };
    }
    return this;
  }

  centerAtInnerFrame() {
    if (!this.data.imageRect || !this.data.innerFrameRect) return this;

    const innerFrameRect = this.data.innerFrameRect;

    const centerX = innerFrameRect.x + innerFrameRect.width / 2;
    const centerY = innerFrameRect.y + innerFrameRect.height / 2;

    this.data = {
      ...this.data,
      offsetX: centerX,
      offsetY: centerY,
    };

    return this;
  }

  preventExceedBoundary() {
    if (!this.data.imageRect || !this.data.boundaryRect) return this;

    const scaledImageWidth = this.data.imageRect.width * this.data.scale;
    const scaledImageHeight = this.data.imageRect.height * this.data.scale;
    const boundaryWidth = this.data.boundaryRect.width;
    const boundaryHeight = this.data.boundaryRect.height;

    let newOffsetX = this.data.offsetX;
    let newOffsetY = this.data.offsetY;

    if (scaledImageWidth > boundaryWidth) {
      newOffsetX = Math.min(newOffsetX, scaledImageWidth / 2);
      newOffsetX = Math.max(newOffsetX, boundaryWidth - scaledImageWidth / 2);
    } else {
      newOffsetX = Math.max(newOffsetX, scaledImageWidth / 2);
      newOffsetX = Math.min(newOffsetX, boundaryWidth - scaledImageWidth / 2);
    }

    if (scaledImageHeight > boundaryHeight) {
      newOffsetY = Math.min(newOffsetY, scaledImageHeight / 2);
      newOffsetY = Math.max(newOffsetY, boundaryHeight - scaledImageHeight / 2);
    } else {
      newOffsetY = Math.max(newOffsetY, scaledImageHeight / 2);
      newOffsetY = Math.min(newOffsetY, boundaryHeight - scaledImageHeight / 2);
    }

    this.data = {
      ...this.data,
      offsetX: newOffsetX,
      offsetY: newOffsetY,
    };

    return this;
  }

  scaleToFit() {
    if (!this.data.imageRect || !this.data.boundaryRect) return this;

    const imageWidth = this.data.imageRect.width;
    const imageHeight = this.data.imageRect.height;
    const boundaryWidth = this.data.boundaryRect.width;
    const boundaryHeight = this.data.boundaryRect.height;

    const scaleX = boundaryWidth / imageWidth;
    const scaleY = boundaryHeight / imageHeight;
    const newScale = Math.min(scaleX, scaleY);

    this.data = {
      ...this.data,
      scale: newScale,
    };

    return this.center();
  }

  reset() {
    if (!this.data.imageRect || !this.data.innerFrameRect) return this;

    const imageWidth = this.data.imageRect.width;
    const imageHeight = this.data.imageRect.height;
    const frameWidth = this.data.innerFrameRect.width;
    const frameHeight = this.data.innerFrameRect.height;

    if (imageWidth <= frameWidth && imageHeight <= frameHeight) {
      return this.setScale(1).centerAtInnerFrame();
    }

    return this.scaleToFit().center();
  }
}

export function accessImageFrameCoords(viewerState?: ImageFrameCoords): ImageFrameCoordsAccessor {
  return new ImageFrameCoordsAccessor(viewerState || DEFAULT_VIEWER_STATE);
}
