import React, { useState, useEffect } from 'react'
import { useSprings, animated, to as interp } from '@react-spring/web'
import './TangramLoader.css' // Asegúrate de que este archivo exista

type Pose = {
  x: number
  y: number
  rotate: number
  scaleX?: number
  scaleY?: number
}

// --- Helper para oscurecer colores ---
function darkenColor(hex: string, pct: number) {
  const n = (v: number) => Math.min(255, Math.floor(v * (100 - pct) / 100))
  const r = n(parseInt(hex.slice(1, 3), 16))
  const g = n(parseInt(hex.slice(3, 5), 16))
  const b = n(parseInt(hex.slice(5, 7), 16))
  const toHex = (v: number) => v.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

// 1) Definición de piezas en coordenadas locales
const PIECES = [
  { id: 'lt1', points: '0,0 100,0 0,100',    color: '#ff6347' },
  { id: 'lt2', points: '100,0 100,100 0,100', color: '#4682b4' },
  { id: 'mt',  points: '0,0 50,50 0,100',     color: '#32cd32' },
  { id: 'st1', points: '0,0 50,50 0,50',      color: '#ffc0cb' },
  { id: 'st2', points: '50,50 100,50 100,100',color: '#ffd700' },
  { id: 'sq',  points: '0,0 50,0 50,50 0,50',  color: '#ee82ee' },
  { id: 'pa',  points: '0,0 50,0 100,50 50,50', color: '#ffa500' },
]

// 2) Configuración de posiciones para SPREAD y cada figura
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
    pa:  { x: 250, y:  50, rotate:  90 },
  },
  '157': {
    lt1: { x: 250, y: 100, rotate:  90 },
    lt2: { x: 250, y: 100, rotate:  90 },
    mt:  { x: 125, y: 300, rotate: 270 },
    st1: { x: 250, y: 100, rotate:   0 },
    st2: { x: 200, y:  50, rotate:  90 },
    sq:  { x: 175, y: 200, rotate:   0 },
    pa:  { x: 175, y: 250, rotate:   0 },
  },
}

export default function TangramLoader() {
  const [mode, setMode] = useState<'SPREAD'|'44'|'152'|'157'>('SPREAD')

  // Ciclo automático (sin cambios)
  useEffect(() => {
    const FIGURE_KEYS = ['44','152','157'] as const
    const PAUSE = 2000 // ms por figura

    const cycleOnce = () => {
      setMode('SPREAD')
      setTimeout(() => {
        FIGURE_KEYS.forEach((key, idx) => {
          setTimeout(() => setMode(key), (idx + 1) * PAUSE)
        })
      }, 1000) // Pausa antes de empezar el ciclo de figuras
    }

    cycleOnce()
    const iv = setInterval(cycleOnce, (FIGURE_KEYS.length + 2) * PAUSE)
    return () => clearInterval(iv)
  }, [])

  // Spring por pieza (sin cambios)
  const springs = useSprings(
    PIECES.length,
    PIECES.map(p => {
      const { x, y, rotate } = CONFIG[mode][p.id]
      return {
        to: { x, y, rotate, scaleX: 1, scaleY: 1 },
        config: { mass: 1, tension: 170, friction: 26 },
      }
    })
  )

  // Orden de capas (Z-INDEX FALSO)
  const renderablePieces = PIECES.map((piece, i) => ({
    piece,
    spring: springs[i],
  }))
  renderablePieces.sort((a, b) => a.spring.y.get() - b.spring.y.get());

  return (
    <div className="loader-container">
      <svg viewBox="0 0 400 400" className="tangram-svg">
        {/* PASADA 1: Dibujar todas las paredes de extrusión */}
        {renderablePieces.map(({ piece: p, spring: spr }) => {
          const transform = interp(
            [spr.x, spr.y, spr.rotate, spr.scaleX, spr.scaleY],
            (x, y, r, sx, sy) =>
              `translate3d(${x}px,${y}px,0) rotate(${r}deg) scale(${sx},${sy})`
          )
          const pts = p.points.split(' ').map(pt => {
            const [X, Y] = pt.split(',').map(Number)
            return { x: X, y: Y }
          })
          const depth = 8
          const side1 = darkenColor(p.color, 20)
          const side2 = darkenColor(p.color, 40)
          return (
            <animated.g key={`${p.id}-walls`} style={{ transform }}>
              {pts.map((p1, j) => {
                const p2 = pts[(j + 1) % pts.length]
                const wallPts = [
                  `${p1.x},${p1.y}`,
                  `${p2.x},${p2.y}`,
                  `${p2.x + depth},${p2.y + depth}`,
                  `${p1.x + depth},${p1.y + depth}`,
                ].join(' ')
                return (
                  <polygon
                    key={j}
                    points={wallPts}
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
          const transform = interp(
            [spr.x, spr.y, spr.rotate, spr.scaleX, spr.scaleY],
            (x, y, r, sx, sy) =>
              `translate3d(${x}px,${y}px,0) rotate(${r}deg) scale(${sx},${sy})`
          )
          const side2 = darkenColor(p.color, 40)
          return (
            <animated.g key={`${p.id}-top`} style={{ transform }}>
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
