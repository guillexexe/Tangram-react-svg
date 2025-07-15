// src/components/ProductCarousel.tsx
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  CSSProperties,
} from 'react'
import img1 from '../assets/Cuero.jpg'
import img2 from '../assets/urbana.jpg'
import img3 from '../assets/Clasicos.jpg'
import img4 from '../assets/Sandalia.jpg'
import img5 from '../assets/Correr.jpg'
import styles from './ProductCarousel.module.css'

interface Product {
  id: number
  name: string
  price: string
  image: string
}

const products: Product[] = [
  { id: 1, name: 'Botines de Cuero',     price: '$120.00', image: img1 },
  { id: 2, name: 'Zapatillas Urbanas',   price: '$85.50',  image: img2 },
  { id: 3, name: 'Mocasines Clásicos',   price: '$95.00',  image: img3 },
  { id: 4, name: 'Sandalias de Verano',  price: '$55.00',  image: img4 },
  { id: 5, name: 'Zapatos de Correr',    price: '$110.00', image: img5 },
]

export default function ProductCarousel() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(true)
  const timerRef = useRef<number>()

  // itemsToShow según ancho
  const itemsToShow = windowWidth > 1024
    ? 3
    : windowWidth > 768
    ? 2
    : 1

  // clonesCount = número de elementos clonados al inicio y fin
  const clonesCount = itemsToShow

  // arreglo con clones
  const clonedProducts = [
    ...products.slice(-clonesCount),
    ...products,
    ...products.slice(0, clonesCount),
  ]

  // calcula índice activo para los dots
  const activeDotIndex =
    (currentIndex - clonesCount + products.length) % products.length

  // estilo dinámico del carousel
  const carouselStyle: CSSProperties = {
    transform: `translateX(-${(currentIndex * 100) / itemsToShow}%)`,
    transition: isTransitioning ? 'transform 0.5s ease' : 'none',
  }

  // Funciones de navegación
  const goNext = useCallback(() => {
    setCurrentIndex(i => i + 1)
    resetTimer()
  }, [])

  const goPrev = () => {
    setCurrentIndex(i => i - 1)
    resetTimer()
  }

  const goTo = (idx: number) => {
    setCurrentIndex(idx + clonesCount)
    resetTimer()
  }

  // Timer auto-play
  function resetTimer() {
    window.clearInterval(timerRef.current)
    timerRef.current = window.setInterval(goNext, 4000)
  }

  // Listener resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Inicializa índice en clonesCount cuando cambie itemsToShow
  useEffect(() => {
    setCurrentIndex(clonesCount)
  }, [clonesCount])

  // Ciclo infinito: detecta saltos y ajusta sin transición
  useEffect(() => {
    const maxIndex = products.length + clonesCount
    if (currentIndex >= maxIndex) {
      setTimeout(() => {
        setIsTransitioning(false)
        setCurrentIndex(clonesCount)
      }, 500)
    } else if (currentIndex < clonesCount) {
      setTimeout(() => {
        setIsTransitioning(false)
        setCurrentIndex(maxIndex - 1)
      }, 500)
    } else if (!isTransitioning) {
      setTimeout(() => setIsTransitioning(true), 50)
    }
  }, [currentIndex, clonesCount])

  // Arranca autoplay al montar
  useEffect(() => {
    resetTimer()
    return () => window.clearInterval(timerRef.current)
  }, [goNext])
   useEffect(() => {
    document.documentElement.style.setProperty('--items-to-show', itemsToShow.toString());
    // O, si quieres que esté limitado al contenedor del carrusel:
    const carouselElement = document.querySelector(`.${styles.carouselContainer}`);
    if (carouselElement) {
    (carouselElement as HTMLElement).style.setProperty('--items-to-show', itemsToShow.toString());
     }
    setCurrentIndex(clonesCount); // Mantén esto aquí para el índice inicial
  }, [itemsToShow, clonesCount]);

  return (
    <div className={styles.carouselContainer}>
      <button className={`${styles.nav} ${styles.prev}`} onClick={goPrev}>
        ‹
      </button>

      <div className={styles.carousel} style={carouselStyle}>
        {clonedProducts.map((p, idx) => (
          <div key={idx} className={styles.slide}>
            <img src={p.image} alt={p.name} />
            <h3>{p.name}</h3>
            <p>{p.price}</p>
          </div>
        ))}
      </div>

      <button className={`${styles.nav} ${styles.next}`} onClick={goNext}>
        ›
      </button>

      <div className={styles.dots}>
        {products.map((_, i) => (
          <span
            key={i}
            className={`${styles.dot} ${
              i === activeDotIndex ? styles.active : ''
            }`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  )
}