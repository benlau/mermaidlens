import { accessImageFrameCoords, ImageFrameCoords } from "../src/types/ImageFrameCoords";

describe("ViewerState", () => {
  describe("ViewerStateMonad", () => {
    it("should set scale correctly", () => {
      const initialState: ImageFrameCoords = {
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        imageRect: { x: 0, y: 0, width: 0, height: 0 },
        boundaryRect: { x: 0, y: 0, width: 0, height: 0 },
        innerFrameRect: { x: 0, y: 0, width: 0, height: 0 },
      };

      const newState = accessImageFrameCoords(initialState).setScale(2).data;

      expect(newState).not.toBe(initialState);
      expect(newState.scale).toBe(2);
      expect(newState.offsetX).toBe(0);
      expect(newState.offsetY).toBe(0);
      expect(newState.imageRect).toEqual(initialState.imageRect);
      expect(newState.boundaryRect).toEqual(initialState.boundaryRect);
      expect(newState.innerFrameRect).toEqual(initialState.innerFrameRect);
    });

    it("should center correctly when regions are defined", () => {
      const initialState: ImageFrameCoords = {
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        imageRect: { x: 100, y: 100, width: 200, height: 200 },
        boundaryRect: { x: 0, y: 0, width: 800, height: 600 },
        innerFrameRect: { x: 0, y: 0, width: 800, height: 600 },
      };

      const newState = accessImageFrameCoords(initialState).center().data;

      expect(newState).not.toBe(initialState);
      expect(newState.offsetX).toBe(800 / 2);
      expect(newState.offsetY).toBe(600 / 2);
      expect(newState.scale).toBe(1);
      expect(newState.imageRect).toEqual(initialState.imageRect);
      expect(newState.boundaryRect).toEqual(initialState.boundaryRect);
      expect(newState.innerFrameRect).toEqual(initialState.innerFrameRect);
    });

    it("should reset to zero offset when regions are undefined", () => {
      const initialState: ImageFrameCoords = {
        scale: 1,
        offsetX: 100,
        offsetY: 100,
        imageRect: undefined,
        boundaryRect: undefined,
        innerFrameRect: undefined,
      };

      const newState = accessImageFrameCoords(initialState).center().data;

      expect(newState).not.toBe(initialState);
      expect(newState.offsetX).toBe(0);
      expect(newState.offsetY).toBe(0);
      expect(newState.scale).toBe(1);
      expect(newState.imageRect).toBeUndefined();
      expect(newState.boundaryRect).toBeUndefined();
      expect(newState.innerFrameRect).toBeUndefined();
    });

    describe("preventExceedBoundary", () => {
      it("should not modify state when imageRect or boundaryRegion is undefined", () => {
        const initialState: ImageFrameCoords = {
          scale: 1,
          offsetX: 100,
          offsetY: 100,
          imageRect: undefined,
          boundaryRect: undefined,
          innerFrameRect: undefined,
        };

        const newState = accessImageFrameCoords(initialState).preventExceedBoundary().data;

        expect(newState).toEqual(initialState);
      });

      it("should constrain offset when scaled image is smaller than boundary", () => {
        const initialState: ImageFrameCoords = {
          scale: 0.5,
          offsetX: 50,
          offsetY: 250,
          imageRect: { x: 0, y: 0, width: 200, height: 200 },
          boundaryRect: { x: 0, y: 0, width: 300, height: 300 },
          innerFrameRect: { x: 0, y: 0, width: 300, height: 300 },
        };

        const newState = accessImageFrameCoords(initialState).preventExceedBoundary().data;

        expect(newState.offsetX).toBe(50);
        expect(newState.offsetY).toBe(250);
        expect(newState.scale).toBe(0.5);
      });

      it("should constrain offset when scaled image is larger than boundary", () => {
        const initialState: ImageFrameCoords = {
          scale: 2,
          offsetX: 50,
          offsetY: 350,
          imageRect: { x: 0, y: 0, width: 200, height: 200 },
          boundaryRect: { x: 0, y: 0, width: 300, height: 300 },
          innerFrameRect: { x: 0, y: 0, width: 300, height: 300 },
        };

        const newState = accessImageFrameCoords(initialState).preventExceedBoundary().data;

        expect(newState.offsetX).toBe(100);
        expect(newState.offsetY).toBe(200);
        expect(newState.scale).toBe(2);
      });
    });

    describe("scaleToFit", () => {
      it("should not modify state when imageRect or innerFrameRect is undefined", () => {
        const initialState: ImageFrameCoords = {
          scale: 1,
          offsetX: 100,
          offsetY: 100,
          imageRect: undefined,
          boundaryRect: undefined,
          innerFrameRect: undefined,
        };

        const newState = accessImageFrameCoords(initialState).scaleToFit().data;

        expect(newState).toEqual(initialState);
      });

      it("should scale to fit when image is larger than boundary", () => {
        const initialState: ImageFrameCoords = {
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          imageRect: { x: 0, y: 0, width: 400, height: 300 },
          boundaryRect: { x: 0, y: 0, width: 800, height: 600 },
          innerFrameRect: { x: 0, y: 0, width: 200, height: 200 },
        };

        const newState = accessImageFrameCoords(initialState).scaleToFit().data;

        expect(newState.scale).toBe(2);
        expect(newState.offsetX).toBe(400);
        expect(newState.offsetY).toBe(300);
      });

      it("should scale to fit when image is smaller than boundary", () => {
        const initialState: ImageFrameCoords = {
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          imageRect: { x: 0, y: 0, width: 100, height: 100 },
          boundaryRect: { x: 0, y: 0, width: 800, height: 600 },
          innerFrameRect: { x: 0, y: 0, width: 200, height: 200 },
        };

        const newState = accessImageFrameCoords(initialState).scaleToFit().data;

        expect(newState.scale).toBe(6);
        expect(newState.offsetX).toBe(400);
        expect(newState.offsetY).toBe(300);
      });
    });

    describe("reset", () => {
      it("should not modify state when imageRect or innerFrameRect is undefined", () => {
        const initialState: ImageFrameCoords = {
          scale: 1,
          offsetX: 100,
          offsetY: 100,
          imageRect: undefined,
          boundaryRect: undefined,
          innerFrameRect: undefined,
        };

        const newState = accessImageFrameCoords(initialState).reset().data;

        expect(newState).toEqual(initialState);
      });

      it("should center image when it is smaller than frame", () => {
        const initialState: ImageFrameCoords = {
          scale: 2,
          offsetX: 50,
          offsetY: 50,
          imageRect: { x: 0, y: 0, width: 100, height: 100 },
          boundaryRect: { x: 0, y: 0, width: 800, height: 600 },
          innerFrameRect: { x: 0, y: 0, width: 200, height: 200 },
        };

        const newState = accessImageFrameCoords(initialState).reset().data;

        expect(newState.scale).toBe(1);
        expect(newState.offsetX).toBe(100);
        expect(newState.offsetY).toBe(100);
      });

      it("should scale to fit when image is larger than frame", () => {
        const initialState: ImageFrameCoords = {
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          imageRect: { x: 0, y: 0, width: 1600, height: 300 },
          boundaryRect: { x: 0, y: 0, width: 800, height: 600 },
          innerFrameRect: { x: 0, y: 0, width: 200, height: 200 },
        };

        const newState = accessImageFrameCoords(initialState).reset().data;

        expect(newState.scale).toBe(0.5);
        expect(newState.offsetX).toBe(400);
        expect(newState.offsetY).toBe(300);
      });
    });
  });
});
