import { useState } from 'react'
import styles from './ContactForm.module.css'

export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !message) {
      alert('Por favor, completa todos los campos.')
      return
    }

    console.log('Enviando datos:', { name, email, message })
    alert(`Gracias, ${name}. Hemos recibido tu mensaje.`)

    // Limpiar el formulario
    setName('')
    setEmail('')
    setMessage('')
  }

  return (
    <section id="contacto" className={styles.contactSection}>
      <div className={styles.container}>
        <h2>Contáctanos</h2>
        <p>¿Tienes alguna pregunta? Envíanos un mensaje.</p>
        <form onSubmit={handleSubmit} className={styles.contactForm}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Nombre</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="message">Mensaje</label>
            <textarea
              id="message"
              rows={5}
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
            />
          </div>
          <button type="submit">Enviar Mensaje</button>
        </form>
      </div>
    </section>
  )
}