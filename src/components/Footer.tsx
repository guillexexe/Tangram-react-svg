import React from 'react'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p>© 2025 Zapatería El Paso Firme. Todos los derechos reservados.</p>
        <div className={styles.socialLinks}>
          <a href="#" aria-label="Facebook">Facebook</a>
          <span> | </span>
          <a href="#" aria-label="Instagram">Instagram</a>
          <span> | </span>
          <a href="#" aria-label="Twitter">Twitter</a>
        </div>
      </div>
    </footer>
  )
}