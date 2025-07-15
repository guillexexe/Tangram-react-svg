import React, { useState, useEffect, useMemo } from 'react'
import { useSprings, animated, to } from '@react-spring/web' // ¡Asegúrate de importar 'to'!
import './TangramLoader.css'

type Pose = {
  x: number
  y: number
  rotate: number
  scaleX?: number
  scaleY?: number
}

function darkenColor(hex: string, pct: number) {
  const n = (v: number) => Math.min(255, Math.floor(v * (100 - pct) / 100))
  const r = n(parseInt(hex.slice(1, 3), 16))
  const g = n(parseInt(hex.slice(3, 5), 16))
  const b = n(parseInt(hex.slice(5, 7), 16))
  const toHex = (v: number) => v.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

const PIECES = [
  { id: 'lt1', points: '0,0 100,0 0,100',     color: '#ff6347' },
  { id: 'lt2', points: '100,0 100,100 0,100', color: '#4682b4' },
  { id: 'mt',  points: '0,0 50,50 0,100',     color: '#32cd32' },
  { id: 'st1', points: '0,0 50,50 0,50',      color: '#ffc0cb' },
  { id: 'st2', points: '50,50 100,50 100,100',color: '#ffd700' },
  { id: 'sq',  points: '0,0 50,0 50,50 0,50',  color: '#ee82ee' },
  { id: 'pa',  points: '0,0 50,0 100,50 50,50', color: '#ffa500' },
]

const CONFIG: Record<'SPREAD'|'44'|'152'|'157', Record<string,Pose>> = {
  SPREAD: {
    lt1: { x:   50, y:   50, rotate:   0 },
    lt2: { x: 350, y:   50, rotate:   0 },
    mt:  { x: 200, y: 200, rotate:   0 },
    st1: { x:   50, y: 350, rotate:   0 },
    st2: { x: 350, y: 350, rotate:   0 },
    sq:  { x: 200, y:   50, rotate:   0 },
    pa:  { x: 200, y: 350, rotate:   0 },
  },
  '44': {
    lt1: { x: 150, y: 200, rotate:  90 },
    lt2: { x: 350, y: 300, rotate: 180 },
    mt:  { x: 150, y: 300, rotate: 270 },
    st1: { x: 200, y: 200, rotate:  90 },
    st2: { x: 150, y: 200, rotate:   0 },
    sq:  { x: 200, y: 200, rotate:   0 },
    pa:  { x: 200, y: 200, rotate:  90 },
  },
  '152': {
    lt1: { x: 150, y: 300, rotate: 180 },
    lt2: { x: 350, y: 200, rotate:  90 },
    mt:  { x: 150, y: 200, rotate: 270 },
    st1: { x: 200, y: 200, rotate:  90 },
    st2: { x: 150, y: 150, rotate:   0 },
    sq:  { x: 200, y: 200, rotate:  45 },
    pa:  { x: 250, y:   50, rotate:  90 },
  },
  '157': {
    lt1: { x: 250, y: 100, rotate:  90 },
    lt2: { x: 250, y: 100, rotate:  90 },
    mt:  { x: 125, y: 300, rotate: 270 },
    st1: { x: 250, y: 100, rotate:   0 },
    st2: { x: 200, y:   50, rotate:  90 },
    sq:  { x: 175, y: 200, rotate:   0 },
    pa:  { x: 175, y: 250, rotate:   0 },
  },
}

const GLOBAL_EXTRUSION_X = 8;
const GLOBAL_EXTRUSION_Y = 8;

export default function TangramLoader() {
  const [mode, setMode] = useState<'SPREAD'|'44'|'152'|'157'>('SPREAD')

  console.log("Modo actual:", mode);

  const springProps = useMemo(() => {
    return PIECES.map(p => {
      const { x, y, rotate } = CONFIG[mode][p.id] || { x: 0, y: 0, rotate: 0 }
      console.log(`Configuración para ${p.id} en modo ${mode}: x=${x}, y=${y}, rotate=${rotate}`);
      return {
        to: { x, y, rotate, scaleX: 1, scaleY: 1 },
        config: { mass: 1, tension: 170, friction: 26 },
      }
    })
  }, [mode])

  const springs = useSprings(PIECES.length, springProps)

  const renderablePieces = PIECES.map((piece, i) => ({
    piece,
    spring: springs[i],
  }))
  // Ordenar piezas por su posición Y para renderizar correctamente la profundidad (de arriba a abajo)
  renderablePieces.sort((a, b) => a.spring.y.get() - b.spring.y.get());

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
      <svg viewBox="0 0 400 400" className="tangram-svg" width="400" height="400">
        {/* PASADA 1: Dibujar todas las paredes de extrusión */}
        {renderablePieces.map(({ piece: p, spring: spr }) => {
          const { x, y, rotate, scaleX, scaleY } = spr;

          // Interpolación de las transformaciones del grupo (x, y, rotate, scale)
          const groupTransform = to(
            [x, y, rotate, scaleX, scaleY],
            (xVal, yVal, rVal, sxVal, syVal) => {
              const transformString = `translate(${xVal},${yVal}) rotate(${rVal}) scale(${sxVal},${syVal})`;
              return transformString;
            }
          );

          const animatedRotateRad = rotate.to(r => r * (Math.PI / 180));

          const pts = p.points.split(' ').map(pt => {
            const [X, Y] = pt.split(',').map(Number)
            return { x: X, y: Y }
          })
          const side1 = darkenColor(p.color, 20)
          const side2 = darkenColor(p.color, 40)

          return (
            // APLICAMOS LA TRANSFORMACIÓN DIRECTAMENTE COMO ATRIBUTO 'transform'
            // en lugar de usar solo 'style'. Esto a veces es más robusto para SVG.
            <animated.g key={`${p.id}-walls`} transform={groupTransform}>
              {pts.map((p1, j) => {
                const p2 = pts[(j + 1) % pts.length]

                // Puntos de la base de la pared, extruidos localmente
                const extrudedP1xLocal = animatedRotateRad.to(r_rad =>
                  p1.x + (GLOBAL_EXTRUSION_X * Math.cos(-r_rad) - GLOBAL_EXTRUSION_Y * Math.sin(-r_rad))
                );
                const extrudedP1yLocal = animatedRotateRad.to(r_rad =>
                  p1.y + (GLOBAL_EXTRUSION_X * Math.sin(-r_rad) + GLOBAL_EXTRUSION_Y * Math.cos(-r_rad))
                );
                const extrudedP2xLocal = animatedRotateRad.to(r_rad =>
                  p2.x + (GLOBAL_EXTRUSION_X * Math.cos(-r_rad) - GLOBAL_EXTRUSION_Y * Math.sin(-r_rad))
                );
                const extrudedP2yLocal = animatedRotateRad.to(r_rad =>
                  p2.y + (GLOBAL_EXTRUSION_X * Math.sin(-r_rad) + GLOBAL_EXTRUSION_Y * Math.cos(-r_rad))
                );

                // CREACIÓN DE LA CADENA DE PUNTOS PARA LA PARED:
                const wallPointsInterpolated = to(
                    [extrudedP1xLocal, extrudedP1yLocal, extrudedP2xLocal, extrudedP2yLocal],
                    (p1x_ext_local, p1y_ext_local, p2x_ext_local, p2y_ext_local) => {
                        return [
                            `${p1.x},${p1.y}`,          // Punto 1 de la cara superior (local)
                            `${p2.x},${p2.y}`,          // Punto 2 de la cara superior (local)
                            `${p2x_ext_local},${p2y_ext_local}`,    // Punto 2 de la base de la pared (local, extruido)
                            `${p1x_ext_local},${p1y_ext_local}`,    // Punto 1 de la base de la pared (local, extruido)
                        ].join(' ');
                    }
                );

                return (
                  <animated.polygon
                    key={j}
                    points={wallPointsInterpolated}
                    fill={j % 2 ? side2 : side1}
                    stroke="none"
                  />
                )
              })}
            </animated.g>
          )
        })}

        {/* PASADA 2: Dibujar todas las caras superiores */}
        {renderablePieces.map(({ piece: p, spring: spr }) => {
          const { x, y, rotate, scaleX, scaleY } = spr;
          const transform = to(
            [x, y, rotate, scaleX, scaleY],
            (xVal, yVal, rVal, sxVal, syVal) =>
              `translate(${xVal},${yVal}) rotate(${rVal}) scale(${sxVal},${syVal})`
          )
          const side2 = darkenColor(p.color, 40)
          return (
            // APLICAMOS LA TRANSFORMACIÓN DIRECTAMENTE COMO ATRIBUTO 'transform'
            <animated.g key={`${p.id}-top`} transform={transform}>
              <polygon
                points={p.points}
                fill={p.color}
                stroke={side2}
                strokeWidth="0.5"
              />
            </animated.g>
          )
        })}
      </svg>
    </div>
  )
}