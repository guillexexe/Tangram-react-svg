// src/pages/RegisterPage.tsx // (Nota: el nombre del archivo en tu código es LoginPage.tsx, pero el componente es RegisterPage)
import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { useUserStore } from '../stores/userStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import styles from './RegisterPage.module.css';
import { useNavigate } from 'react-router-dom'; // <-- Importa useNavigate

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [pw, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass1, setShowPass1] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const register = useUserStore(state => state.register);
  const navigate = useNavigate(); // <-- Inicializa useNavigate

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (pw.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (pw !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await register(email, pw);
      Swal.fire('¡Bienvenido!', 'Usuario registrado con éxito.', 'success').then(() => {
        navigate('/'); // <-- Redirige a la página de inicio (ruta '/')
      });
    } catch (err: any) {
      setError(err.message || 'Ha ocurrido un error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <h2>Crear cuenta</h2>

      <form onSubmit={onSubmit} noValidate>
        {/* Email */}
        <div className={styles.field}>
          <label>Email </label>
          <div className={styles.inputWrapper}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value.trim())}
              placeholder="tucorreo@ejemplo.com"
              required
            />
          </div>
        </div>

        {/* Contraseña */}
        <div className={styles.field}>
          <label>Contraseña</label>
          <div className={styles.inputWrapper}>
            <input
              type={showPass1 ? 'text' : 'password'}
              value={pw}
              onChange={e => setPassword(e.target.value.trim())}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
            />
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => setShowPass1(prev => !prev)}
            >
              <FontAwesomeIcon icon={showPass1 ? faEyeSlash : faEye} />
            </button>
          </div>
        </div>

        {/* Confirmar contraseña */}
        <div className={styles.field}>
          <label>Confirmar contraseña</label>
          <div className={styles.inputWrapper}>
            <input
              type={showPass2 ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value.trim())}
              placeholder="Repite tu contraseña"
              minLength={6}
              required
            />
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => setShowPass2(prev => !prev)}
            >
              <FontAwesomeIcon icon={showPass2 ? faEyeSlash : faEye} />
            </button>
          </div>
        </div>

        {/* Mensaje de error */}
        {error && <p className={styles.error}>{error}</p>}

        {/* Submit */}
        <button type="submit" disabled={loading}>
          {loading ? 'Registrando…' : 'Registrarse'}
        </button>
      </form>
    </div>
  );
}