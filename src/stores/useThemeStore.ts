// src/stores/useThemeStore.ts

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware' // Importa persist y createJSONStorage
import Swal from 'sweetalert2' // No sé si lo usas aquí, pero lo mantengo si estaba antes

// Definiciones de tipos para mayor claridad y seguridad
interface ColorPalette {
  primary: string
  secondary: string
  accent: string
  backgroundPrimary?: string; // Nuevo
  backgroundSecondary?: string; // Nuevo
  textPrimary?: string; // Nuevo
  textSecondary?: string; // Nuevo
  border?: string; // Nuevo
  success?: string; // Nuevo
  warning?: string; // Nuevo
  danger?: string; // Nuevo
}

interface Typography {
  fontFamily: string
  fontSize: string
  headingFontFamily?: string; // Nuevo
  buttonFontSize?: string; // Nuevo
  lineHeight?: string; // Nuevo
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

interface ThemeState {
  palettes: Palette[]
  currentId: number | null
  typography: Typography
  imageSize: ImageSize
  colorBlind: boolean
  init: () => void
  addPalette: (palette: Palette) => void
  removePalette: (id: number) => void
  applyPalette: (id: number) => void
  updateTypography: (typo: Typography) => void
  updateImageSize: (size: ImageSize) => void
  updateColorBlind: (mode: boolean) => void
  // Función para aplicar estilos CSS (la que tenías originalmente en tu store)
  _applyCssVariables: (
    colors: ColorPalette,
    typography: Typography,
    imageSize: ImageSize,
    colorBlindMode: boolean
  ) => void
}

// =========================================================================
// CAMBIO CLAVE AQUÍ: ENVOLVER create CON persist
// =========================================================================
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // ESTADO INICIAL
      palettes: [
        {
          id: 1,
    name: 'Default Light',
    colors: {
      primary: '#007bff', secondary: '#f8f9fa', accent: '#28a745',
      backgroundPrimary: '#ffffff', backgroundSecondary: '#f0f0f0', // Valores para el tema claro
      textPrimary: '#212529', textSecondary: '#6c757d',
      border: '#dee2e6',
      success: '#28a745', warning: '#ffc107', danger: '#dc3545'
    },
  },
  {
    id: 2,
    name: 'Dark Mode',
    colors: {
      primary: '#bb86fc', secondary: '#121212', accent: '#03dac6',
      backgroundPrimary: '#121212', backgroundSecondary: '#1e1e1e', // Valores para el tema oscuro
      textPrimary: 'rgba(255, 255, 255, 0.87)', textSecondary: '#a0a0a0',
      border: '#424242',
      success: '#69f0ae', warning: '#ffeb3b', danger: '#ef5350'
    },
  },
        
      ],
      currentId: 1, // La paleta por defecto al inicio
      typography: {
  fontFamily: "'Arial', sans-serif",
  fontSize: '16px',
  headingFontFamily: "'Arial Black', sans-serif", // Un ejemplo
  buttonFontSize: '1em',
  lineHeight: '1.6'
},
imageSize: { width: 100, height: 100 },
      colorBlind: false,

      // ACCIONES
      init: () => {
        // La lógica de hidratación (cargar desde localStorage) la manejará `persist`
        // Sin embargo, si quieres asegurar que la paleta actual se aplique
        // en el primer render después de la hidratación, lo haremos aquí.
        const state = get();
        if (state.currentId) {
          const currentPalette = state.palettes.find(p => p.id === state.currentId);
          if (currentPalette) {
            state._applyCssVariables(
              currentPalette.colors,
              state.typography,
              state.imageSize,
              state.colorBlind
            );
          }
        } else {
             // Si no hay currentId guardado (primera vez o error), aplica la primera paleta por defecto
             const defaultPalette = state.palettes[0];
             if (defaultPalette) {
                 set({ currentId: defaultPalette.id });
                 state._applyCssVariables(
                     defaultPalette.colors,
                     state.typography,
                     state.imageSize,
                     state.colorBlind
                 );
             }
        }
      },

      addPalette: (palette) => {
        set((state) => ({ palettes: [...state.palettes, palette] }))
      },

      removePalette: (id) => {
        set((state) => {
          const newPalettes = state.palettes.filter((p) => p.id !== id)
          // Si la paleta eliminada era la actual, resetear a la primera o null
          const newCurrentId = state.currentId === id ? (newPalettes.length > 0 ? newPalettes[0].id : null) : state.currentId;
          return {
            palettes: newPalettes,
            currentId: newCurrentId
          }
        })
        // Después de eliminar, si la actual fue eliminada, aplicar la nueva por defecto
        const state = get();
        if (state.currentId) {
            const currentPalette = state.palettes.find(p => p.id === state.currentId);
            if (currentPalette) {
                state._applyCssVariables(
                    currentPalette.colors,
                    state.typography,
                    state.imageSize,
                    state.colorBlind
                );
            }
        } else {
            // Si no quedan paletas, puedes querer resetear todos los estilos a un default fijo
            state._applyCssVariables(
                { primary: '#007bff', secondary: '#f8f9fa', accent: '#28a745' }, // Tus colores base si no hay paletas
                { fontFamily: "'Arial', sans-serif", fontSize: '16px' },
                { width: 100, height: 100 },
                false
            );
        }
      },

      applyPalette: (id) => {
        set((state) => {
          const selectedPalette = state.palettes.find((p) => p.id === id)
          if (selectedPalette) {
            // Aplica las variables CSS inmediatamente
            state._applyCssVariables(
              selectedPalette.colors,
              state.typography,
              state.imageSize,
              state.colorBlind
            )
            return { currentId: id }
          }
          return {} // No hacer nada si no se encuentra la paleta
        })
      },

      updateTypography: (typo) => {
        set({ typography: typo })
        const state = get() // Obtener el estado actual después de la actualización
        const currentPalette = state.palettes.find(p => p.id === state.currentId);
        if (currentPalette) {
            state._applyCssVariables(
                currentPalette.colors,
                state.typography, // Usa la tipografía recién actualizada
                state.imageSize,
                state.colorBlind
            )
        }
      },

      updateImageSize: (size) => {
        set({ imageSize: size })
        const state = get() // Obtener el estado actual después de la actualización
        const currentPalette = state.palettes.find(p => p.id === state.currentId);
        if (currentPalette) {
            state._applyCssVariables(
                currentPalette.colors,
                state.typography,
                state.imageSize, // Usa el tamaño de imagen recién actualizado
                state.colorBlind
            )
        }
      },
      
      updateColorBlind: (mode) => {
        set({ colorBlind: mode })
        const state = get() // Obtener el estado actual después de la actualización
        const currentPalette = state.palettes.find(p => p.id === state.currentId);
        if (currentPalette) {
            state._applyCssVariables(
                currentPalette.colors,
                state.typography,
                state.imageSize,
                state.colorBlind // Usa el modo daltonismo recién actualizado
            )
        }
      },

      // Función interna para aplicar las variables CSS al documento
      _applyCssVariables: (colors, typography, imageSize, colorBlindMode) => {
  const root = document.documentElement
  root.style.setProperty('--color-primary', colors.primary)
  root.style.setProperty('--color-secondary', colors.secondary)
  root.style.setProperty('--color-accent', colors.accent)

  // Nuevos colores de fondo y texto
  if (colors.backgroundPrimary) root.style.setProperty('--color-background-primary', colors.backgroundPrimary);
  if (colors.backgroundSecondary) root.style.setProperty('--color-background-secondary', colors.backgroundSecondary);
  if (colors.textPrimary) root.style.setProperty('--color-text-primary', colors.textPrimary);
  if (colors.textSecondary) root.style.setProperty('--color-text-secondary', colors.textSecondary);
  if (colors.border) root.style.setProperty('--color-border', colors.border);
  if (colors.success) root.style.setProperty('--color-success', colors.success);
  if (colors.warning) root.style.setProperty('--color-warning', colors.warning);
  if (colors.danger) root.style.setProperty('--color-danger', colors.danger);

  // Nuevas variables de tipografía
  root.style.setProperty('--font-fontFamily', typography.fontFamily)
  root.style.setProperty('--font-fontSize', typography.fontSize)
  if (typography.headingFontFamily) root.style.setProperty('--font-heading-fontFamily', typography.headingFontFamily);
  if (typography.buttonFontSize) root.style.setProperty('--font-button-fontSize', typography.buttonFontSize);
  if (typography.lineHeight) root.style.setProperty('--font-lineHeight', typography.lineHeight);

  // Las variables de imagen ya están
  root.style.setProperty('--img-width', `${imageSize.width}px`)
  root.style.setProperty('--img-height', `${imageSize.height}px`)

        // Toggle la clase de daltonismo en el HTML
        if (colorBlindMode) {
          root.classList.add('daltonism')
        } else {
          root.classList.remove('daltonism')
        }
      },
    }),
    {
      name: 'theme-storage', // Nombre único para tu item en localStorage
      storage: createJSONStorage(() => localStorage), // Usa localStorage
      // `onRehydrateStorage` se ejecuta al inicio, después de cargar desde el storage
      onRehydrateStorage: (state) => {
        console.log('Hydration starts')
        return (state, error) => {
          if (error) {
            console.error('An error happened during hydration', error)
          } else {
            console.log('Hydration finished')
            // Después de que el estado se ha cargado, aplica las variables CSS
            // Esto es crucial para que los estilos se apliquen al cargar la página
            if (state) {
              const currentPalette = state.palettes.find(p => p.id === state.currentId);
              if (currentPalette) {
                state._applyCssVariables(
                  currentPalette.colors,
                  state.typography,
                  state.imageSize,
                  state.colorBlind
                );
              }
            }
          }
        }
      },
      // `partialize` es opcional; si quieres guardar solo una parte del estado
      partialize: (state) => ({
         currentId: state.currentId,
         typography: state.typography,
         imageSize: state.imageSize,
         colorBlind: state.colorBlind,
         // No guardamos las paletas en sí si son fijas, solo el currentId
         // Si las paletas se pueden crear, entonces sí hay que guardarlas
         palettes: state.palettes,
       }),
    },
  ),
)