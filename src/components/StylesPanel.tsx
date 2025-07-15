// src/components/StylesPanel.tsx

import React, { useState, useEffect, useMemo } from 'react'
import Swal from 'sweetalert2'
import { useThemeStore } from '../stores/useThemeStore'
import ProductCarousel from './ProductCarousel'
import styles from './StylesPanel.module.css'
import Banner from './Banner'
import ServiceSection from './ServiceSection'

// IMPORTANTE: Esta interfaz Palette DEBE COINCIDIR con la de useThemeStore.ts
// Considera exportar las interfaces desde useThemeStore.ts y importarlas aquí
// para evitar duplicación y errores.
interface ColorPalette {
  primary: string
  secondary: string
  accent: string
  backgroundPrimary?: string // Asegúrate de que coincida con la de useThemeStore.ts
  backgroundSecondary?: string
  textPrimary?: string
  textSecondary?: string
  border?: string
  success?: string
  warning?: string
  danger?: string
}

interface Typography {
  fontFamily: string
  fontSize: string
  headingFontFamily?: string
  buttonFontSize?: string
  lineHeight?: string
}

interface ImageSize {
  width: number
  height: number
}

interface Palette {
  id: number
  name: string
  colors: ColorPalette
}

export default function StylesPanel() {
  const theme = useThemeStore()
  const {
    init,
    palettes,
    currentId,
    addPalette,
    removePalette,
    applyPalette,
    typography, // <-- Esto ya es el objeto Typography del store
    imageSize, // <-- Esto ya es el objeto ImageSize del store
    colorBlind,
    updateTypography,
    updateImageSize,
    updateColorBlind,
  } = theme

  // Estado local para crear nueva paleta
  const [newPaletteName, setNewPaletteName] = useState('') // Renombrado de newName a newPaletteName para mayor claridad
  const [newColors, setNewColors] = useState<ColorPalette>({ // Añade el tipo
    primary: '#ffffff',
    secondary: '#f0f0f0',
    accent: '#333333',
    backgroundPrimary: '#ffffff', // Valor inicial para el formulario
    backgroundSecondary: '#f0f0f0',
    textPrimary: '#000000',
    textSecondary: '#666666',
    border: '#cccccc',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
  })

  // Estado local de tipografía y tamaño de imagen
  // Estos se inicializan con los valores del store después de la hidratación
  // No necesitas separarlos en states locales si vas a usar directamente el `typography` y `imageSize` del store
  // Sin embargo, si los modificas antes de llamar a updateTypography/updateImageSize, los states locales están bien.
  // Es importante que SINCORNICEN con el store cuando se carga la página o se aplica una paleta.
  // Ya lo tienes en los `useEffect` de abajo, lo cual es correcto.
  const [localTypography, setLocalTypography] = useState<Typography>(typography); // Renombrado a localTypography
  const [localImageSize, setLocalImageSize] = useState<ImageSize>(imageSize); // Renombrado a localImageSize

  // Estado checkbox daltonismo
  const [cbMode, setCbMode] = useState(colorBlind)

  // Inicializar el store y aplicar estilos al montar
  useEffect(() => {
    init()
  }, [init])

  // Sincronizar estados locales con los valores del store cuando el store cambie
  useEffect(() => {
    setLocalTypography(typography);
  }, [typography]);

  useEffect(() => {
    setLocalImageSize(imageSize);
  }, [imageSize]);

  useEffect(() => {
    setCbMode(colorBlind);
  }, [colorBlind]);

  // Variables CSS para la vista previa
  const previewVars = useMemo<React.CSSProperties>(() => ({
    '--color-primary': newColors.primary,
    '--color-secondary': newColors.secondary,
    '--color-accent': newColors.accent,
    // AÑADE TODAS LAS NUEVAS VARIABLES DE COLOR AQUÍ
    '--color-background-primary': newColors.backgroundPrimary,
    '--color-background-secondary': newColors.backgroundSecondary,
    '--color-text-primary': newColors.textPrimary,
    '--color-text-secondary': newColors.textSecondary,
    '--color-border': newColors.border,
    '--color-success': newColors.success,
    '--color-warning': newColors.warning,
    '--color-danger': newColors.danger,

    // AÑADE TODAS LAS NUEVAS VARIABLES DE TIPOGRAFÍA AQUÍ
    '--font-fontFamily': localTypography.fontFamily, // Usar el estado local
    '--font-fontSize': `${parseInt(localTypography.fontSize, 10)}px`, // Usar el estado local
    '--font-heading-fontFamily': localTypography.headingFontFamily,
    '--font-button-fontSize': localTypography.buttonFontSize,
    '--font-lineHeight': localTypography.lineHeight,

    // Variables de imagen
    '--img-width': `${localImageSize.width}px`, // Usar el estado local
    '--img-height': `${localImageSize.height}px`, // Usar el estado local
  }) as React.CSSProperties, [newColors, localTypography, localImageSize]) // Dependencias actualizadas

  // Handlers
  const handleAddPalette = (e: React.FormEvent) => {
    e.preventDefault()
    const id = Date.now()
    addPalette({
      id,
      name: newPaletteName || `Paleta ${id}`,
      colors: { ...newColors }, // <-- ¡Pasa todos los newColors!
    })
    Swal.fire({ icon: 'success', title: 'Paleta guardada' })
    // Reinicia newColors a sus valores por defecto (asegurándose de incluir todos)
    setNewPaletteName('')
    setNewColors({
      primary: '#ffffff',
      secondary: '#f0f0f0',
      accent: '#333333',
      backgroundPrimary: '#ffffff',
      backgroundSecondary: '#f0f0f0',
      textPrimary: '#000000',
      textSecondary: '#666666',
      border: '#cccccc',
      success: '#28a745',
      warning: '#ffc107',
      danger: '#dc3545',
    })
  }

  const handleApplyPalette = (id: number) => {
    applyPalette(id)
    Swal.fire({ icon: 'success', title: 'Paleta aplicada' })
  }

  const handleRemovePalette = (id: number) => {
    removePalette(id)
    Swal.fire({ icon: 'info', title: 'Paleta eliminada' })
  }

  const handleApplyTypography = () => {
    // Pasa todo el objeto localTypography directamente al store
    updateTypography(localTypography)
    Swal.fire({ icon: 'success', title: 'Tipografía aplicada' })
  }

  const handleApplyImageSize = () => {
    // Pasa todo el objeto localImageSize directamente al store
    updateImageSize(localImageSize)
    Swal.fire({ icon: 'success', title: 'Tamaño de imagen aplicado' })
  }

  const handleColorBlind = (checked: boolean) => {
    setCbMode(checked)
    updateColorBlind(checked)
    Swal.fire({
      icon: 'success',
      title: `Modo Daltonismo ${checked ? 'activado' : 'desactivado'}`,
    })
  }

  return (
    <section className={styles.stylesPanel}>
      <div className={styles.configPreviewWrapper}>
        {/* Panel de configuración */}
        <div className={styles.configPanel}>
          <h2>Paletas guardadas</h2>
          <div className={styles.paletteList}>
            {palettes.map((p: Palette) => (
              <div
                key={p.id}
                className={`${styles.paletteCard} ${
                  p.id === currentId ? styles.active : ''
                }`}
              >
                <h3>{p.name}</h3>
                <div className={styles.swatches}>
                  <div
                    className={styles.swatch}
                    style={{ background: p.colors.primary }}
                  />
                  <div
                    className={styles.swatch}
                    style={{ background: p.colors.secondary }}
                  />
                  <div
                    className={styles.swatch}
                    style={{ background: p.colors.accent }}
                  />
                  {/* OPCIONAL: Añadir más swatches si quieres ver todos los colores de la paleta */}
                  {p.colors.backgroundPrimary && <div className={styles.swatch} style={{ background: p.colors.backgroundPrimary }} title="Fondo Primario" />}
                  {p.colors.backgroundSecondary && <div className={styles.swatch} style={{ background: p.colors.backgroundSecondary }} title="Fondo Secundario" />}
                  {p.colors.textPrimary && <div className={styles.swatch} style={{ background: p.colors.textPrimary }} title="Texto Primario" />}
                  {/* ... y así sucesivamente para todos los nuevos colores ... */}
                </div>
                <div className={styles.actions}>
                  <button onClick={() => handleApplyPalette(p.id)}>
                    Aplicar
                  </button>
                  <button onClick={() => handleRemovePalette(p.id)}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          <h3>Crear nueva paleta</h3>
          <form className={styles.newPalette} onSubmit={handleAddPalette}>
            <input
              type="text"
              placeholder="Nombre de la paleta"
              value={newPaletteName}
              onChange={e => setNewPaletteName(e.target.value)}
            />
            <label>Primario:</label>
            <input type="color" value={newColors.primary} onChange={e => setNewColors(c => ({ ...c, primary: e.target.value }))} />
            <label>Secundario:</label>
            <input type="color" value={newColors.secondary} onChange={e => setNewColors(c => ({ ...c, secondary: e.target.value }))} />
            <label>Acento:</label>
            <input type="color" value={newColors.accent} onChange={e => setNewColors(c => ({ ...c, accent: e.target.value }))} />

            {/* NUEVOS INPUTS DE COLOR */}
            <label>Fondo Primario:</label>
            <input type="color" value={newColors.backgroundPrimary} onChange={e => setNewColors(c => ({ ...c, backgroundPrimary: e.target.value }))} />
            <label>Fondo Secundario:</label>
            <input type="color" value={newColors.backgroundSecondary} onChange={e => setNewColors(c => ({ ...c, backgroundSecondary: e.target.value }))} />
            <label>Texto Primario:</label>
            <input type="color" value={newColors.textPrimary} onChange={e => setNewColors(c => ({ ...c, textPrimary: e.target.value }))} />
            <label>Texto Secundario:</label>
            <input type="color" value={newColors.textSecondary} onChange={e => setNewColors(c => ({ ...c, textSecondary: e.target.value }))} />
            <label>Borde:</label>
            <input type="color" value={newColors.border} onChange={e => setNewColors(c => ({ ...c, border: e.target.value }))} />
            <label>Éxito:</label>
            <input type="color" value={newColors.success} onChange={e => setNewColors(c => ({ ...c, success: e.target.value }))} />
            <label>Advertencia:</label>
            <input type="color" value={newColors.warning} onChange={e => setNewColors(c => ({ ...c, warning: e.target.value }))} />
            <label>Peligro:</label>
            <input type="color" value={newColors.danger} onChange={e => setNewColors(c => ({ ...c, danger: e.target.value }))} />

            <button type="submit">Guardar Paleta</button>
          </form>

          {/* Controles de Tipografía */}
          <h3>Tipografía</h3>
          <div className={styles.typoControls}>
            <label>Fuente General:</label>
            <select
              value={localTypography.fontFamily} // Usar estado local
              onChange={e => setLocalTypography(t => ({ ...t, fontFamily: e.target.value }))}
            >
              <option value="'Arial', sans-serif">Arial</option>
              <option value="'Verdana', sans-serif">Verdana</option>
              <option value="'Georgia', serif">Georgia</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
              <option value="'Courier New', monospace">Courier New</option>
              <option value="'Lato', sans-serif">Lato (si importada)</option>
              <option value="'Roboto', sans-serif">Roboto (si importada)</option>
              <option value="system-ui, Avenir, Helvetica, Arial, sans-serif">System UI</option>
            </select>

            <label>Tamaño Fuente Base (px):</label>
            <input
              type="number"
              value={parseInt(localTypography.fontSize, 10)} // Usar estado local
              onChange={e => setLocalTypography(t => ({ ...t, fontSize: `${e.target.value}px` }))}
              step="1"
              min="10"
              max="30"
            />

            <label>Fuente Títulos:</label>
            <select
              value={localTypography.headingFontFamily || ''} // Asegúrate de manejar undefined si la interfaz lo permite
              onChange={e => setLocalTypography(t => ({ ...t, headingFontFamily: e.target.value }))}
            >
              <option value="">(Mismo que General)</option> {/* Opción para heredar */}
              <option value="'Arial Black', sans-serif">Arial Black</option>
              <option value="'Impact', sans-serif">Impact</option>
              <option value="'Montserrat', sans-serif">Montserrat (si importada)</option>
              <option value="'Oswald', sans-serif">Oswald (si importada)</option>
            </select>

            <label>Tamaño Botones (em):</label>
            <input
              type="number"
              value={parseFloat(localTypography.buttonFontSize || '1')}
              onChange={e => setLocalTypography(t => ({ ...t, buttonFontSize: `${e.target.value}em` }))}
              step="0.1"
              min="0.5"
              max="2"
            />
            <label>Interlineado:</label>
            <input
              type="number"
              value={parseFloat(localTypography.lineHeight || '1.5')}
              onChange={e => setLocalTypography(t => ({ ...t, lineHeight: e.target.value }))}
              step="0.1"
              min="1"
              max="2.5"
            />
            <button onClick={handleApplyTypography}>Aplicar Tipografía</button>
          </div>

          {/* Controles de Tamaño de Imagen */}
          <h3>Tamaño de Imagen</h3>
          <div className={styles.imageSizeControls}>
            <label>Ancho (px):</label>
            <input
              type="number"
              value={localImageSize.width} // Usar estado local
              onChange={e => setLocalImageSize(s => ({ ...s, width: parseInt(e.target.value, 10) }))}
              step="10"
              min="50"
              max="500"
            />
            <label>Alto (px):</label>
            <input
              type="number"
              value={localImageSize.height} // Usar estado local
              onChange={e => setLocalImageSize(s => ({ ...s, height: parseInt(e.target.value, 10) }))}
              step="10"
              min="50"
              max="500"
            />
            <button onClick={handleApplyImageSize}>Aplicar Tamaño Imagen</button>
          </div>

          <h2>Accesibilidad</h2>
          <label className={styles.cbMode}>
            <input
              type="checkbox"
              checked={cbMode}
              onChange={e => handleColorBlind(e.target.checked)}
            />
            Modo Daltonismo
          </label>
        </div>

        {/* Panel de vista previa */}
        <div className={styles.previewPanel}>
          <h2>Vista previa de Componentes</h2>
          <div
            className={`${styles.previewContainer} ${
              cbMode ? styles.daltonism : ''
            }`}
            style={previewVars} // Aplica todas las previewVars aquí
          >
            <Banner />
            <ProductCarousel />
            {/* Puedes añadir más componentes de tu aplicación para previsualizar aquí */}
            <h1 style={{color: 'var(--color-primary)'}}>Ejemplo de Título</h1>
            <p style={{color: 'var(--color-text-primary)'}}>Este es un texto de ejemplo con el color primario.</p>
            <button style={{
                backgroundColor: 'var(--color-background-secondary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                fontFamily: 'var(--font-fontFamily)',
                fontSize: 'var(--font-button-fontSize)'
            }}>Botón de Ejemplo</button>
            <p style={{color: 'var(--color-text-secondary)'}}>Texto secundario.</p>
            <button style={{backgroundColor: 'var(--color-danger)', color: 'white'}}>Botón de Peligro</button>

          </div>
        </div>
      </div>
    </section>
  )
}