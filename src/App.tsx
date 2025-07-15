// src/App.tsx
import React, { useEffect } from 'react'; // Importa useEffect
import Header from './components/Header';
import Footer from './components/Footer';
import AppRoutes from './routes';
import { useUserStore } from './stores/userStore'; // Importa tu userStore
import TangramEditor from './components/TangramEditor';

export default function App() {
  const initUserStore = useUserStore(state => state.init);
  const loaded = useUserStore(state => state.loaded); // Opcional: para saber si ya cargó

  // Ejecuta init solo una vez al montar el componente App
  useEffect(() => {
    // Solo llama a initUserStore si el store aún no ha sido cargado
    // Esto previene llamadas repetidas en re-renders
    if (!loaded) {
      console.log('Llamando a initUserStore desde App.tsx...');
      initUserStore();
    }
  }, [initUserStore, loaded]); // Dependencias para que se ejecute una vez al montar

  // Opcional: Mostrar un loader mientras la sesión se inicializa
  // Esto es útil si tienes lógica de inicialización más compleja o si los datos tardan en cargar.
  // En tu caso con localStorage es casi instantáneo, pero es una buena práctica.
  if (!loaded) {
    return <div>Cargando sesión de usuario...</div>;
  }

  return (
    <>
      <Header />
      <TangramEditor/>
      <main>
        <AppRoutes /> {/* Aquí se renderizan tus rutas, incluida HomePage */}
      </main>
      <Footer />
    </>
  );
}