"use client";

import {
  type HTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface FlickeringGridProps extends HTMLAttributes<HTMLDivElement> {
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number;
  color?: string;
  width?: number;
  height?: number;
  maxOpacity?: number;
}

export function FlickeringGrid({
  squareSize = 4,
  gridGap = 6,
  flickerChance = 0.3,
  color = "rgb(0, 0, 0)",
  width,
  height,
  className,
  maxOpacity = 0.3,
  ...props
}: FlickeringGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const rgbaPrefix = useMemo(() => {
    if (typeof window === "undefined") {
      return "rgba(0, 0, 0,";
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d");

    if (!context) {
      return "rgba(0, 0, 0,";
    }

    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    const [red, green, blue] = Array.from(
      context.getImageData(0, 0, 1, 1).data,
    );

    return `rgba(${red}, ${green}, ${blue},`;
  }, [color]);

  const setupCanvas = useCallback(
    (canvas: HTMLCanvasElement, canvasWidth: number, canvasHeight: number) => {
      const devicePixelRatio = window.devicePixelRatio || 1;
      canvas.width = canvasWidth * devicePixelRatio;
      canvas.height = canvasHeight * devicePixelRatio;
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;

      const columns = Math.ceil(canvasWidth / (squareSize + gridGap));
      const rows = Math.ceil(canvasHeight / (squareSize + gridGap));
      const squares = new Float32Array(columns * rows);

      for (let index = 0; index < squares.length; index += 1) {
        squares[index] = Math.random() * maxOpacity;
      }

      return { columns, rows, squares, devicePixelRatio };
    },
    [gridGap, maxOpacity, squareSize],
  );

  const updateSquares = useCallback(
    (squares: Float32Array, deltaTime: number) => {
      for (let index = 0; index < squares.length; index += 1) {
        if (Math.random() < flickerChance * deltaTime) {
          squares[index] = Math.random() * maxOpacity;
        }
      }
    },
    [flickerChance, maxOpacity],
  );

  const drawGrid = useCallback(
    (
      context: CanvasRenderingContext2D,
      canvasWidth: number,
      canvasHeight: number,
      columns: number,
      rows: number,
      squares: Float32Array,
      devicePixelRatio: number,
    ) => {
      context.clearRect(0, 0, canvasWidth, canvasHeight);

      for (let column = 0; column < columns; column += 1) {
        for (let row = 0; row < rows; row += 1) {
          const opacity = squares[column * rows + row];
          context.fillStyle = `${rgbaPrefix}${opacity})`;
          context.fillRect(
            column * (squareSize + gridGap) * devicePixelRatio,
            row * (squareSize + gridGap) * devicePixelRatio,
            squareSize * devicePixelRatio,
            squareSize * devicePixelRatio,
          );
        }
      }
    },
    [gridGap, rgbaPrefix, squareSize],
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);

    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const context = canvas?.getContext("2d") ?? null;

    if (!canvas || !container || !context) {
      return;
    }

    let animationFrameId: number | null = null;
    let grid = setupCanvas(
      canvas,
      width || container.clientWidth,
      height || container.clientHeight,
    );

    const resizeCanvas = () => {
      const nextWidth = width || container.clientWidth;
      const nextHeight = height || container.clientHeight;
      setCanvasSize({ width: nextWidth, height: nextHeight });
      grid = setupCanvas(canvas, nextWidth, nextHeight);
      drawGrid(
        context,
        canvas.width,
        canvas.height,
        grid.columns,
        grid.rows,
        grid.squares,
        grid.devicePixelRatio,
      );
    };

    resizeCanvas();

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0 },
    );
    intersectionObserver.observe(canvas);

    if (isInView && !prefersReducedMotion) {
      let previousTime = performance.now();

      const animate = (time: number) => {
        const deltaTime = (time - previousTime) / 1000;
        previousTime = time;
        updateSquares(grid.squares, deltaTime);
        drawGrid(
          context,
          canvas.width,
          canvas.height,
          grid.columns,
          grid.rows,
          grid.squares,
          grid.devicePixelRatio,
        );
        animationFrameId = requestAnimationFrame(animate);
      };

      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [
    drawGrid,
    height,
    isInView,
    prefersReducedMotion,
    setupCanvas,
    updateSquares,
    width,
  ]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={["flickering-grid", className].filter(Boolean).join(" ")}
      {...props}
    >
      <canvas
        ref={canvasRef}
        className="flickering-grid-canvas"
        style={canvasSize}
      />
    </div>
  );
}
