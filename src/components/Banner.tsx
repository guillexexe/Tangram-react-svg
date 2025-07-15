import React from 'react'
import styles from './Banner.module.css'

export default function Banner() {
  return (
    <section id="inicio" className={styles.banner}>
      <div className={styles.bannerText}>
        <h1>Colección Invierno 2025</h1>
        <p>
          Descubre los estilos que marcarán la temporada. Calidad y confort en
          cada paso.
        </p>
        <a href="#catalogo" className={styles.ctaButton}>
          Ver Colección
        </a>
      </div>
    </section>
  )
}