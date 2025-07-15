// src/components/Header.tsx
import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import UserWizard from '../components/UserWizard';
import logo from '../assets/Paso seguro.png';
import styles from './Header.module.css';

export default function Header() {
  const { user, logout } = useUserStore();
  const role = user?.role;
  const navigate = useNavigate();

  const [toggle, setToggle] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
    setToggle(false); // Cierra el menú después de hacer clic
  };

  const handleProfile = () => {
    setToggle(false); // Cierra el menú
    setShowWizard(true); // Abre el wizard
  };

  const closeWizard = () => {
    setShowWizard(false);
  };

  // Función para manejar el clic fuera del dropdown
  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
  //       setToggle(false);
  //     }
  //   };
  //   document.addEventListener('mousedown', handleClickOutside);
  //   return () => {
  //     document.removeEventListener('mousedown', handleClickOutside);
  //   };
  // }, [dropdownRef]);


  return (
    <>
      <nav className={styles.header}>
        <Link to="/" className={styles.logo}>
          <img src={logo} alt="Mi Tienda" className={styles.logoImg} />
        </Link>
        <div className={styles.spacer} />

        {!user ? (
          <>
            <Link to="/login" className={styles.btn}>Iniciar sesión</Link>
            <Link to="/register" className={styles.btn}>Registrarse</Link>
          </>
        ) : (
          <div
            className={`${styles.dropdown} ${toggle ? styles.open : ''}`} // <-- ¡Añade esta línea!
            tabIndex={0}
            ref={dropdownRef}
            onBlur={() => {
              // Pequeño retraso para permitir clics en los elementos del menú
              setTimeout(() => setToggle(false), 100);
            }}
            onClick={() => setToggle(t => !t)}
          >
            <button className={`${styles.btn} ${styles.optionsBtn}`}>
              Opciones <span className={`${styles.arrow} ${toggle ? styles.open : ''}`}>▾</span>
            </button>
            {/* El menú se renderiza siempre, pero su visibilidad es controlada por CSS */}
            <ul className={styles.dropdownMenu}>
              {role === 'admin' && (
                <>
                  <li>
                    <Link to="/admin" onClick={() => setToggle(false)}>Panel de Estilos</Link>
                  </li>
                  <li>
                    <Link to="/admin/users" onClick={() => setToggle(false)}>Listado de Usuarios</Link>
                  </li>
                </>
              )}
              {role === 'user' && (
                <li>
                  <button className={styles.dropdownBtn} onClick={handleProfile}>
                    Editar perfil
                  </button>
                </li>
              )}
              <li>
                <button className={`${styles.dropdownBtn} ${styles.logout}`} onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </li>
            </ul>
          </div>
        )}
      </nav>

      {showWizard && user && (
        <UserWizard userId={user.id} onClose={closeWizard} />
      )}
    </>
  );
}