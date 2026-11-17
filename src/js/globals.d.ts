interface SheetBloom { x: number; y: number; r: number }

interface SheetGround { soilH: number; grassH: number; top: number }

interface SheetBounds {
  left: number;
  right: number;
  bottom: number;
  padB: number;
  W: number;
  H: number;
  ground: SheetGround | null;
}

interface SheetFloraPayload { blooms: SheetBloom[]; bounds: SheetBounds }

interface Window {
  garden?: Garden;
  sheetFlora?: SheetFloraPayload;
}

interface HTMLCanvasElement {
  stillFrame?: boolean;
}
