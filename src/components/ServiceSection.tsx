import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import styles from './ServiceSection.module.css'

export interface Service {
  icon: ['fas','truck'] | string  // por ejemplo ['fas','truck'] o 'truck'
  title: string
  description: string
}

type Props = {
  services: Service[]
}

export default function ServiceSection({ services }: Props) {
  return (
    <section className={styles.services}>
      <div className={styles.container}>
        {services.map((s, i) => (
          <div key={i} className={styles.card}>
            <FontAwesomeIcon icon={s.icon} size="2x" />
            <h3>{s.title}</h3>
            <p>{s.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}