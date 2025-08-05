import React, { useState, useEffect, useMemo } from 'react';
import { useSprings, animated, to, config } from '@react-spring/web';
import './TangramLoader.css';

type Pose = {
  x: number;
  y: number;
  rotate: number;
  scaleX?: number;
  scaleY?: number;
};

function darkenColor(hex: string, pct: number): string {
  const n = (v: number) => Math.min(255, Math.floor(v * (100 - pct) / 100));
  const r = n(parseInt(hex.slice(1, 3), 16));
  const g = n(parseInt(hex.slice(3, 5), 16));
  const b = n(parseInt(hex.slice(5, 7), 16));
  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const PIECES = [
  { id: 'lt1', points: '0,0 100,0 0,100', color: '#ff6347' },
  { id: 'lt2', points: '100,0 100,100 0,100', color: '#4682b4' },
  { id: 'mt', points: '0,0 50,50 0,100', color: '#32cd32' },
  { id: 'st1', points: '0,0 50,50 0,50', color: '#ffc0cb' },
  { id: 'st2', points: '50,50 100,50 100,100', color: '#ffd700' },
  { id: 'sq', points: '0,0 50,0 50,50 0,50', color: '#ee82ee' },
  { id: 'pa', points: '0,0 50,0 100,50 50,50', color: '#ffa500' },
];

const CONFIG: Record<'SPREAD' | '44' | '152' | '157', Record<string, Pose>> = {
  SPREAD: {
    lt1: { x: 50, y: 50, rotate: 0 },
    lt2: { x: 350, y: 50, rotate: 0 },
    mt: { x: 200, y: 200, rotate: 0 },
    st1: { x: 50, y: 350, rotate: 0 },
    st2: { x: 350, y: 350, rotate: 0 },
    sq: { x: 200, y: 50, rotate: 0 },
    pa: { x: 200, y: 350, rotate: 0 },
  },
  '44': {
    lt1: { x: 150, y: 200, rotate: 90 },
    lt2: { x: 350, y: 300, rotate: 180 },
    mt: { x: 150, y: 300, rotate: 270 },
    st1: { x: 200, y: 200, rotate: 90 },
    st2: { x: 150, y: 200, rotate: 0 },
    sq: { x: 200, y: 200, rotate: 0 },
    pa: { x: 200, y: 200, rotate: 90 },
  },
  '152': {
    lt1: { x: 150, y: 300, rotate: 180 },
    lt2: { x: 350, y: 200, rotate: 90 },
    mt: { x: 150, y: 200, rotate: 270 },
    st1: { x: 200, y: 200, rotate: 90 },
    st2: { x: 150, y: 150, rotate: 0 },
    sq: { x: 200, y: 200, rotate: 45 },
    pa: { x: 250, y: 50, rotate: 90 },
  },
  '157': {
    lt1: { x: 250, y: 100, rotate: 90 },
    lt2: { x: 250, y: 100, rotate: 90 },
    mt: { x: 125, y: 300, rotate: 270 },
    st1: { x: 250, y: 100, rotate: 0 },
    st2: { x: 200, y: 50, rotate: 90 },
    sq: { x: 175, y: 200, rotate: 0 },
    pa: { x: 175, y: 250, rotate: 0 },
  },
};

const GLOBAL_EXTRUSION_X = 8;
const GLOBAL_EXTRUSION_Y = 8;

function calculateFaceDepth(
  points: { x: number; y: number }[],
  pieceX: number,
  pieceY: number,
  pieceRotateDeg: number,
  isExtrudedFace: boolean = false
): number {
  let avgX = 0;
  let avgY = 0;
  for (const p of points) {
    avgX += p.x;
    avgY += p.y;
  }
  avgX /= points.length;
  avgY /= points.length;

  const rotateRad = pieceRotateDeg * Math.PI / 180;
  
  const globalPoints = points.map(p => {
    const rotatedX = p.x * Math.cos(rotateRad) - p.y * Math.sin(rotateRad);
    const rotatedY = p.x * Math.sin(rotateRad) + p.y * Math.cos(rotateRad);
    return { x: rotatedX + pieceX, y: rotatedY + pieceY };
  });

  let globalAvgX = 0;
  let globalAvgY = 0;
  for (const gp of globalPoints) {
    globalAvgX += gp.x;
    globalAvgY += gp.y;
  }
  globalAvgX /= globalPoints.length;
  globalAvgY /= globalPoints.length;

  let extrusionDepthOffset = 0;
  if (isExtrudedFace) {
    extrusionDepthOffset = - (GLOBAL_EXTRUSION_X + GLOBAL_EXTRUSION_Y) * 0.1; // Ajuste heurístico
  }
  return globalAvgY * 1000 + globalAvgX + extrusionDepthOffset;
}


export default function TangramLoader() {
  const [mode, setMode] = useState<'SPREAD' | '44' | '152' | '157'>('SPREAD');
  const autoAnimationSequence: Array<'SPREAD' | '44' | '152' | '157'> = ['44', '152', '157', 'SPREAD'];

  useEffect(() => {
    let currentSequenceIndex = autoAnimationSequence.indexOf(mode);
    if (currentSequenceIndex === -1) {
      currentSequenceIndex = 0; // Si el modo actual no está en la secuencia, empieza desde el primero
    }

    const interval = setInterval(() => {
      const nextIndex = (currentSequenceIndex + 1) % autoAnimationSequence.length;
      setMode(autoAnimationSequence[nextIndex]);
      currentSequenceIndex = nextIndex;
    }, 4500);

    return () => clearInterval(interval);
  }, [mode, autoAnimationSequence]);

  console.log("Modo actual:", mode);

  const springProps = useMemo(() => {
    return PIECES.map(p => {
      const { x, y, rotate } = CONFIG[mode][p.id] || { x: 0, y: 0, rotate: 0 };
      return {
        to: { x, y, rotate, scaleX: 1, scaleY: 1 },
        config: config.gentle,
      };
    });
  }, [mode]);

  const springs = useSprings(PIECES.length, springProps);

  const allRenderableFaces = useMemo(() => {
    const faces: Array<{
      id: string; // ID de la pieza
      type: 'top' | 'bottom' | 'side'; // Tipo de cara
      points: any; // Animated string of points (react-spring animated value)
      fill: string;
      stroke: string;
      strokeWidth: string;
      zValue: number; // Valor de profundidad calculado (para ordenamiento)
      transform: any; // Animated transform string for the group (react-spring animated value)
    }> = [];

    PIECES.forEach((p, i) => {
      const spr = springs[i]; 
      const currentX = spr.x.get();
      const currentY = spr.y.get();
      const currentRotate = spr.rotate.get();
      const groupTransform = to(
        [spr.x, spr.y, spr.rotate, spr.scaleX, spr.scaleY],
        (xVal, yVal, rVal, sxVal, syVal) => `translate(${xVal},${yVal}) rotate(${rVal}) scale(${sxVal},${syVal})`
      );
      const rotateRad = currentRotate * (Math.PI / 180); // Valor numérico de la rotación en radianes
    
      const originalPts = p.points.split(' ').map(pt => {
        const [X, Y] = pt.split(',').map(Number);
        return { x: X, y: Y };
      });

      const bottomFaceColor = darkenColor(p.color, 60);
      const side1Color = darkenColor(p.color, 20);
      const side2Color = darkenColor(p.color, 40);

      // --- Cara Superior ---
      faces.push({
        id: p.id,
        type: 'top',
        points: p.points, // No se extrude, usa los puntos originales
        fill: p.color,
        stroke: darkenColor(p.color, 40),
        strokeWidth: '0.5',
        zValue: calculateFaceDepth(originalPts, currentX, currentY, currentRotate, false),
        transform: groupTransform,
      });

      const extrudedPtsBottom = originalPts.map(pt => {
        const newX = pt.x + (GLOBAL_EXTRUSION_X * Math.cos(rotateRad) - GLOBAL_EXTRUSION_Y * Math.sin(rotateRad));
        const newY = pt.y + (GLOBAL_EXTRUSION_X * Math.sin(rotateRad) + GLOBAL_EXTRUSION_Y * Math.cos(rotateRad));
        return { x: newX, y: newY };
      });

      faces.push({
        id: p.id,
        type: 'bottom',
        points: to(
            [spr.rotate],
            (rVal) => {
                const r_rad = rVal * (Math.PI / 180);
                return originalPts.map(pt => {
                    const newX = pt.x + (GLOBAL_EXTRUSION_X * Math.cos(r_rad) - GLOBAL_EXTRUSION_Y * Math.sin(r_rad));
                    const newY = pt.y + (GLOBAL_EXTRUSION_X * Math.sin(r_rad) + GLOBAL_EXTRUSION_Y * Math.cos(r_rad));
                    return `${newX},${newY}`;
                }).join(' ');
            }
        ),
        fill: bottomFaceColor,
        stroke: 'none',
        strokeWidth: '0',
        zValue: calculateFaceDepth(extrudedPtsBottom, currentX, currentY, currentRotate, true),
        transform: groupTransform,
      });

      // --- Caras Laterales (Paredes) ---
      originalPts.forEach((p1, j) => {
        const p2 = originalPts[(j + 1) % originalPts.length];

        const wallPointsInterpolated = to(
            [spr.rotate],
            (rVal) => {
                const r_rad = rVal * (Math.PI / 180);
                const ex_x = (GLOBAL_EXTRUSION_X * Math.cos(r_rad) - GLOBAL_EXTRUSION_Y * Math.sin(r_rad));
                const ex_y = (GLOBAL_EXTRUSION_X * Math.sin(r_rad) + GLOBAL_EXTRUSION_Y * Math.cos(r_rad));

                const extrudedP1_x = p1.x + ex_x;
                const extrudedP1_y = p1.y + ex_y;
                const extrudedP2_x = p2.x + ex_x;
                const extrudedP2_y = p2.y + ex_y;

                return [
                    `${p1.x},${p1.y}`,
                    `${p2.x},${p2.y}`,
                    `${extrudedP2_x},${extrudedP2_y}`,
                    `${extrudedP1_x},${extrudedP1_y}`,
                ].join(' ');
            }
        );

        const wallCurrentPts = [
            p1,
            p2,
            { x: p2.x + (GLOBAL_EXTRUSION_X * Math.cos(rotateRad) - GLOBAL_EXTRUSION_Y * Math.sin(rotateRad)),
              y: p2.y + (GLOBAL_EXTRUSION_X * Math.sin(rotateRad) + GLOBAL_EXTRUSION_Y * Math.cos(rotateRad)) },
            { x: p1.x + (GLOBAL_EXTRUSION_X * Math.cos(rotateRad) - GLOBAL_EXTRUSION_Y * Math.sin(rotateRad)),
              y: p1.y + (GLOBAL_EXTRUSION_X * Math.sin(rotateRad) + GLOBAL_EXTRUSION_Y * Math.cos(rotateRad)) },
        ];
        
        faces.push({
          id: p.id,
          type: 'side',
          points: wallPointsInterpolated,
          fill: j % 2 ? side2Color : side1Color,
          stroke: 'none',
          strokeWidth: '0',
          zValue: calculateFaceDepth(wallCurrentPts, currentX, currentY, currentRotate, true),
          transform: groupTransform,
        });
      });
    });
    return faces.sort((a, b) => a.zValue - b.zValue);
  }, [springs, mode]); // Depende de las animaciones y el modo

  return (
    <div className="loader-container">
      <div style={{ marginBottom: '10px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button onClick={() => setMode('SPREAD')} style={{ padding: '8px 15px', cursor: 'pointer' }}>
          Spread
        </button>
        <button onClick={() => setMode('44')} style={{ padding: '8px 15px', cursor: 'pointer' }}>
          Figura 44
        </button>
        <button onClick={() => setMode('152')} style={{ padding: '8px 15px', cursor: 'pointer' }}>
          Figura 152
        </button>
        <button onClick={() => setMode('157')} style={{ padding: '8px 15px', cursor: 'pointer' }}>
          Figura 157
        </button>
      </div>

      {/* Ajusta el width y height si es necesario. El viewBox ya define el lienzo interno. */}
      {/* Añade un transform para una perspectiva isométrica general al SVG */}
      <svg viewBox="0 0 400 400" className="tangram-svg" width="400" height="400" style={{ transform: 'rotateX(20deg) rotateZ(0deg)' }}>
        {/* PASADA ÚNICA: Renderizar todas las caras ordenadas por su profundidad simulada */}
        {allRenderableFaces.map((face, index) => (
          <animated.g key={`${face.id}-${face.type}-${index}`} transform={face.transform}>
            <animated.polygon
              points={face.points}
              fill={face.fill}
              stroke={face.stroke}
              strokeWidth={face.strokeWidth}
            />
          </animated.g>
        ))}
      </svg>
    </div>
  );
}