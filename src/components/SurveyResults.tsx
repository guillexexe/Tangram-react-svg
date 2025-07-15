import React, { useState, useEffect, useMemo } from 'react'
import styles from './SurveyResults.module.css'

interface Address {
  address: string
  city: string
  state: string
  country: string
}

interface Hair {
  color: string
  type: string
}

interface Company {
  address: Address
}

interface Bank {
  cardType: string
  cardNumber: string
  cardExpire: string
  iban: string
}

interface Crypto {
  coin: string
  wallet: string
}

export interface SurveyData {
  firstName: string
  lastName: string
  birthDate: string
  gender: string
  email: string
  phone: string
  username: string
  address: Address
  height: number
  weight: number
  eyeColor: string
  hair: Hair
  university: string
  company: Company
  bank: Bank
  crypto: Crypto
}

type Props = {
  userId: string | number
  userEmail: string
  onClose: () => void
}

export default function SurveyResults({ userId, userEmail, onClose }: Props) {
  const [data, setData] = useState<SurveyData | null>(null)
  const [loaded, setLoaded] = useState(false)

  // Cargar datos desde localStorage al montar
  useEffect(() => {
    const raw = localStorage.getItem(`wizard-${userId}`)
    setData(raw ? JSON.parse(raw) : null)
    setLoaded(true)
  }, [userId])

  // Calcular edad a partir de la fecha de nacimiento
  const computedAge = useMemo(() => {
    if (!data?.birthDate) return 0
    const bd = new Date(data.birthDate)
    const today = new Date()
    let age = today.getFullYear() - bd.getFullYear()
    if (
      today.getMonth() < bd.getMonth() ||
      (today.getMonth() === bd.getMonth() && today.getDate() < bd.getDate())
    ) {
      age--
    }
    return age
  }, [data])

  return (
    <div className={styles.results}>
      <h2>Respuestas de {userEmail}</h2>

      {!loaded && <div className={styles.loading}>Cargando…</div>}

      {loaded && !data && (
        <p>No hay respuestas guardadas para este usuario.</p>
      )}

      {data && (
        <>
          <section className={styles.block}>
            <h3>Datos Personales</h3>
            <p>
              Nombre: {data.firstName} {data.lastName}
            </p>
            <p>Fecha Nac.: {data.birthDate}</p>
            <p>Edad: {computedAge} años</p>
            <p>Género: {data.gender}</p>
          </section>

          <section className={styles.block}>
            <h3>Contacto</h3>
            <p>Email: {data.email}</p>
            <p>Teléfono: {data.phone}</p>
            <p>Usuario: {data.username}</p>
          </section>

          <section className={styles.block}>
            <h3>Dirección Personal</h3>
            <p>Dirección: {data.address.address}</p>
            <p>
              Ciudad: {data.address.city}, {data.address.state},{' '}
              {data.address.country}
            </p>
          </section>

          <section className={styles.block}>
            <h3>Apariencia</h3>
            <p>Altura: {data.height} cm</p>
            <p>Peso: {data.weight} kg</p>
            <p>Ojos: {data.eyeColor}</p>
            <p>
              Cabello: {data.hair.color} ({data.hair.type})
            </p>
          </section>

          <section className={styles.block}>
            <h3>Empresa</h3>
            <p>Universidad/Depto: {data.university}</p>
            <p>Dirección: {data.company.address.address}</p>
            <p>
              Ciudad: {data.company.address.city}, {data.company.address.state}
              , {data.company.address.country}
            </p>
          </section>

          <section className={styles.block}>
            <h3>Finanzas</h3>
            <p>
              Tarjeta: {data.bank.cardType} {data.bank.cardNumber} (exp.{' '}
              {data.bank.cardExpire})
            </p>
            <p>IBAN: {data.bank.iban}</p>
            <p>
              Crypto: {data.crypto.coin} (Wallet: {data.crypto.wallet})
            </p>
          </section>
        </>
      )}

      <div className={styles.actions}>
        <button onClick={onClose}>Cerrar</button>
      </div>
    </div>
  )
}