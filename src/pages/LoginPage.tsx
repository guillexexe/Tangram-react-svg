// src/pages/LoginPage.tsx
import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import TangramLoader from '../components/TangramLoader'
import { useUserStore } from '../stores/userStore'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)

  const login    = useUserStore(s => s.login)
  const navigate = useNavigate()
  const location = useLocation()

  // Query param `redirect` o '/'
  const params   = new URLSearchParams(location.search)
  const redirect = params.get('redirect') || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await login(email.trim(), password)
    } catch (err: any) {
      return Swal.fire('Error', err.message || 'Credenciales inválidas', 'error')
    }

    // Muestro loader popup 10s y luego navego
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      navigate(redirect, { replace: true })
    }, 10000)
  }

  return (
    <div className={styles.authPage}>
      {loading && (
        <>
          <div className={styles.overlay} />
          <div className={styles.loaderPopup}>
            <TangramLoader />
          </div>
        </>
      )}

      <h2>Iniciar sesión</h2>
      <form onSubmit={handleSubmit} noValidate>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Correo"
          required
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Contraseña"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Cargando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}