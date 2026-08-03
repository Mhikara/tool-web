declare module "gif.js" {
  export interface GIFOptions {
    workers?: number;
    quality?: number;
    width?: number;
    height?: number;
    workerScript?: string;
  }
  export interface AddFrameOptions {
    copy?: boolean;
    delay?: number;
  }
  export default class GIF {
    constructor(options: GIFOptions);
    addFrame(
      element: CanvasRenderingContext2D | HTMLCanvasElement,
      options?: AddFrameOptions
    ): void;
    on(event: "finished", callback: (blob: Blob) => void): void;
    on(event: "abort", callback: () => void): void;
    render(): void;
  }
}
