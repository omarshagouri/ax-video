import React from "react";
import { Footer, lfTheme, Title } from "./CoreVisuals";

export const BatteryDiagram: React.FC<{
  title: string;
  footer: string;
  children: React.ReactNode;
}> = ({ title, footer, children }) => (
  <>
    <Title title={title} singleLine />
    <svg
      width={1680}
      height={780}
      viewBox="0 0 1680 780"
      style={{ position: "absolute", top: 182, left: 120 }}
      fontFamily={lfTheme.font}
      fontSize={28}
      fontWeight={600}
      fill={lfTheme.white}
    >
      {children}
    </svg>
    <Footer text={footer} />
  </>
);

export const DiagramPanel: React.FC<{
  x?: number;
  y?: number;
  width: number;
  height: number;
  children: React.ReactNode;
}> = ({ x = 0, y = 0, width, height, children }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={1} y={1} width={width - 2} height={height - 2} rx={26} fill={lfTheme.navy} fillOpacity={0.94} stroke={lfTheme.navyLine} strokeWidth={2} />
    {children}
  </g>
);

type Point = readonly [number, number];

export const DiagramArrow: React.FC<{
  from: Point;
  to: Point;
  color: string;
  width?: number;
}> = ({ from, to, color, width = 5 }) => {
  const [x, y] = to;
  const angle = Math.atan2(y - from[1], x - from[0]);
  const length = Math.max(13, 3.2 * width);
  const tailX = x - Math.cos(angle) * length;
  const tailY = y - Math.sin(angle) * length;
  const halfX = Math.sin(angle) * length * 0.48;
  const halfY = Math.cos(angle) * length * 0.48;
  return (
    <g fill={color}>
      <line x1={from[0]} y1={from[1]} x2={tailX} y2={tailY} stroke={color} strokeWidth={width} strokeLinecap="round" />
      <polygon points={`${x},${y} ${tailX + halfX},${tailY - halfY} ${tailX - halfX},${tailY + halfY}`} />
    </g>
  );
};

/** Project the pack's plan coordinates onto the common three-quarter view. */
export const packPoint = (x: number, depth: number): Point => [x + depth * 0.65, -depth * 0.43];

export const PackSlab: React.FC<{
  x?: number;
  depth?: number;
  width: number;
  length: number;
  height?: number;
  color: string;
}> = ({ x = 0, depth = 0, width, length, height = 16, color }) => {
  const [originX, originY] = packPoint(x, depth);
  const [backX, backY] = packPoint(0, length);
  const top = `0,0 ${width},0 ${width + backX},${backY} ${backX},${backY}`;
  return (
    <g transform={`translate(${originX} ${originY})`} stroke={color} strokeWidth={2} strokeLinejoin="round">
      <polygon points={`${width},0 ${width + backX},${backY} ${width + backX},${backY + height} ${width},${height}`} fill={lfTheme.navy} />
      <rect width={width} height={height} fill={lfTheme.navySurface} />
      <polygon points={top} fill={lfTheme.navySurface} />
      <polygon points={top} fill={color} fillOpacity={0.18} stroke="none" />
    </g>
  );
};
