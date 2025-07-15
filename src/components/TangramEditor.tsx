import React, { useState, useEffect } from 'react';
import './TangramEditor.css';

type Pose = { x?: number; y?: number; rotate: number; rotateX?: number; rotateY?: number }; // Hacemos x, y opcionales
interface PieceDef { id: string; type: 'cube' | 'triangular-prism-large' | '2d'; color: string; }

const PIECES: PieceDef[] = [
  { id: 'lt1', type: 'triangular-prism-large', color: '#ff6347' },
  { id: 'lt2', type: 'triangular-prism-large', color: '#4682b4' },
  { id: 'mt',  type: '2d', color: '#32cd32' },
  { id: 'st1', type: '2d', color: '#ffc0cb' },
  { id: 'st2', type: '2d', color: '#ffd700' },
  { id: 'sq',  type: 'cube',           color: '#ee82ee' },
  { id: 'pa',  type: '2d', color: '#ffa500' },
];

// Eliminamos las posiciones x, y de DEFAULT_POSES
const DEFAULT_POSES: Record<string, Pose> = {
  lt1: { rotate: 0, rotateX: 0, rotateY: 0 },
  lt2: { rotate: 0, rotateX: 0, rotateY: 0 },
  mt:  { rotate: 0, rotateX: 0, rotateY: 0 },
  st1: { rotate: 0, rotateX: 0, rotateY: 0 },
  st2: { rotate: 0, rotateX: 0, rotateY: 0 },
  sq:  { rotate: 0, rotateX: 0, rotateY: 0 },
  pa:  { rotate: 0, rotateX: 0, rotateY: 0 },
};

export default function TangramEditor() {
  const [poses, setPoses] = useState<Record<string, Pose>>(DEFAULT_POSES);

  useEffect(() => {
    ;(window as any).poses = poses;
    ;(window as any).updatePose = (id: string, p: Partial<Pose>) => {
      setPoses(prev => ({ ...prev, [id]: { ...prev[id], ...p } }));
    };
  }, [poses]);

  // --- Dimensiones Base de las Piezas del Tangram (en píxeles) ---
  const UNIT_SIDE = 100;
  // const HALF_UNIT_SIDE = UNIT_SIDE / 2; // 50px // No se usa directamente aquí, pero es correcto

  const TRIANGLE_LARGE_CATETUS = UNIT_SIDE; // 100px
  const TRIANGLE_LARGE_HYPOTENUSE = UNIT_SIDE * Math.sqrt(2); // ~141.421356px

  const SQUARE_SIDE = TRIANGLE_LARGE_HYPOTENUSE / 2; // ~70.710678px (Lado del cuadrado)

  const TRIANGLE_MEDIUM_CATETUS = SQUARE_SIDE; // ~70.710678px
  const TRIANGLE_MEDIUM_HYPOTENUSE = TRIANGLE_MEDIUM_CATETUS * Math.sqrt(2); // ~100px

  const TRIANGLE_SMALL_CATETUS = UNIT_SIDE / 2; // 50px
  const TRIANGLE_SMALL_HYPOTENUSE = TRIANGLE_SMALL_CATETUS * Math.sqrt(2); // ~70.710678px

  const PARALLELOGRAM_BASE_SIDE = UNIT_SIDE; // 100px (lado largo)
  const PARALLELOGRAM_HEIGHT = UNIT_SIDE / 2; // 50px (altura perpendicular)

  const CUBE_DEPTH = SQUARE_SIDE; // ~70.71px, para un cubo perfecto
  const EXTRUSION_DEPTH = 20; // Profundidad (grosor) para los prismas triangulares y paralelogramo

  // Función para oscurecer un color
  const darkerColor = (hex: string, factor: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `#${(Math.max(0, r - factor)).toString(16).padStart(2, '0')}${(Math.max(0, g - factor)).toString(16).padStart(2, '0')}${(Math.max(0, b - factor)).toString(16).padStart(2, '0')}`;
  };

  const renderFaces = (piece: PieceDef) => {
    const baseColor = piece.color;
    const darkColor1 = darkerColor(baseColor, 20);
    const darkColor2 = darkerColor(baseColor, 40);
    const darkColor3 = darkerColor(baseColor, 60);
    const depth = EXTRUSION_DEPTH;
    const halfDepth = depth / 2;

    switch (piece.type) {
      case 'cube':
        const cubeFaceSize = SQUARE_SIDE;
        const halfCubeDepth = CUBE_DEPTH / 2;

        return (
          <>
            {/* Cara frontal */}
            <div className="face front" style={{ backgroundColor: baseColor, transform: `translateZ(${halfCubeDepth}px)` }}></div>
            {/* Cara trasera */}
            <div className="face back" style={{ backgroundColor: darkColor3, transform: `rotateY(180deg) translateZ(${halfCubeDepth}px)` }}></div>
            {/* Cara derecha */}
            <div className="face right" style={{ backgroundColor: darkColor1, transform: `rotateY(90deg) translateZ(${halfCubeDepth}px)` }}></div>
            {/* Cara izquierda */}
            <div className="face left" style={{ backgroundColor: darkColor1, transform: `rotateY(-90deg) translateZ(${halfCubeDepth}px)` }}></div>
            {/* Cara superior */}
            <div className="face top" style={{ backgroundColor: darkColor2, transform: `rotateX(90deg) translateZ(${halfCubeDepth}px)` }}></div>
            {/* Cara inferior */}
            <div className="face bottom" style={{ backgroundColor: darkColor2, transform: `rotateX(-90deg) translateZ(${halfCubeDepth}px)` }}></div>
          </>
        );

      case 'triangular-prism-large':
        const tL_c = TRIANGLE_LARGE_CATETUS; // 100px
        const tL_h = TRIANGLE_LARGE_HYPOTENUSE; // ~141.421356px

        return (
          <>
            {/* Base triangular frontal */}
            <div className="face front-base" style={{ backgroundColor: baseColor, transform: `translateZ(${halfDepth}px)` }}></div>
            {/* Base triangular trasera */}
            <div className="face back-base" style={{ backgroundColor: darkColor3, transform: `rotateY(180deg) translateZ(${halfDepth}px)` }}></div>

            {/* Cara lateral 1 (rectángulo: cateto inferior) */}
            <div className="face side-1" style={{
              backgroundColor: darkColor1,
              width: `${tL_c}px`, height: `${depth}px`,
              transform: `
                translateY(${tL_c / 2}px)
                rotateX(90deg)
                translateZ(${halfDepth}px)
              `
            }}></div>

            {/* Cara lateral 2 (rectángulo: cateto izquierdo) */}
            <div className="face side-2" style={{
              backgroundColor: darkColor2,
              width: `${tL_c}px`, height: `${depth}px`,
              transform: `
                translateX(-${tL_c / 2}px)
                rotateY(-90deg)
                translateZ(${halfDepth}px)
              `
            }}></div>

            {/* Cara lateral 3 (rectángulo: hipotenusa) - ¡CORRECCIÓN APLICADA! */}
            <div className="face side-3" style={{
              backgroundColor: darkColor3,
              width: `${tL_h}px`, height: `${depth}px`,
              transform: `
                rotateZ(45deg)
                rotateX(90deg)
                translateZ(${halfDepth}px)
              `
            }}></div>
          </>
        );

      case '2d':
      default:
        return (
          <div className="face front-2d" style={{ backgroundColor: baseColor }}></div>
        );
    }
  };

  return (
    <div className="tangram-container">
      {PIECES.map(p => {
        const { rotate, rotateX, rotateY } = poses[p.id]; // x, y ya no se extraen
        const pieceStyle = {
          // Ya no incluimos translateX y translateY aquí, las piezas se posicionarán por el flujo del documento
          transform: `rotateZ(${rotate}deg) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        };

        let pieceClass = `tangram-piece tangram-${p.type}`;
        let containerSizeStyle = {};

        switch (p.type) {
          case 'cube':
            containerSizeStyle = { width: SQUARE_SIDE, height: SQUARE_SIDE };
            break;
          case 'triangular-prism-large':
            containerSizeStyle = { width: TRIANGLE_LARGE_CATETUS, height: TRIANGLE_LARGE_CATETUS };
            break;
          case '2d':
            if (p.id.startsWith('lt')) {
                containerSizeStyle = { width: TRIANGLE_LARGE_CATETUS, height: TRIANGLE_LARGE_CATETUS };
            } else if (p.id.startsWith('mt')) {
                containerSizeStyle = { width: TRIANGLE_MEDIUM_CATETUS, height: TRIANGLE_MEDIUM_CATETUS };
            } else if (p.id.startsWith('st')) {
                containerSizeStyle = { width: TRIANGLE_SMALL_CATETUS, height: TRIANGLE_SMALL_CATETUS };
            } else if (p.id === 'pa') {
                containerSizeStyle = { width: PARALLELOGRAM_BASE_SIDE, height: PARALLELOGRAM_HEIGHT };
            }
            break;
          default:
            break;
        }

        return (
          <div key={p.id} className={pieceClass} style={{ ...pieceStyle, ...containerSizeStyle }}>
            {renderFaces(p)}
          </div>
        );
      })}
    </div>
  );
}