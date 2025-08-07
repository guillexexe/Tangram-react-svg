// src/pages/HomePage.tsx (o donde sea que esté tu HomePage.tsx)

import React from 'react'
import Banner from '../components/Banner'
import ServiceSection, { Service } from '../components/ServiceSection' // Importa Service interface
import ImageCarousel from '../components/ImageCarousel/ImageCarousel';
import VideoCarousel from '../components/VideoGallery/Videocarousel';
import ProductCarousel from '../components/ProductCarousel'
import ContactForm from '../components/ContactForm';
import styles from './HomePage.module.css'


export default function HomePage() {
  // datos estáticos o desde un hook/custom hook
  const services: Service[] = [ // Asegúrate de que esto no esté vacío
    {
      icon: ['fas', 'truck'], // Coincide con faTruck que importaste en main.tsx
      title: 'Envío Rápido',
      description: 'Recibe tus productos directamente en la puerta de tu casa con nuestra entrega eficiente.'
    },
    {
      icon: ['fas', 'exchange-alt'], // Coincide con faExchangeAlt que importaste en main.tsx
      title: 'Devoluciones Fáciles',
      description: 'Proceso de cambio y devolución simple y sin complicaciones para tu tranquilidad.'
    },
    {
      icon: ['fas', 'lock'], // Coincide con faLock que importaste en main.tsx
      title: 'Pago Seguro',
      description: 'Tus transacciones están protegidas con la última tecnología de encriptación.'
    },
    // ¡Añade más servicios aquí si lo necesitas!
  ];

  const featuredProducts = [
    // ... tus productos destacados aquí
  ];

  return (
    <div className={styles.homePage}>
      <Banner />
      <ServiceSection services={services} />
      
      {/* Carrusel de Productos Existente */}
      <ProductCarousel items={featuredProducts} />
      
      {/* Nuevo Carrusel de Imágenes Editables */}
      <section className={styles.section}>
        <h2>Personaliza tus Zapatos</h2>
        <ImageCarousel />
      </section>

      <VideoCarousel />

      <ContactForm />
    </div>
  );
}