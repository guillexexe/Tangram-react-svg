// src/pages/AdminPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import $ from 'jquery';
import 'datatables.net';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import 'datatables.net-buttons';
import 'datatables.net-buttons-dt/css/buttons.dataTables.css';

// Importaciones de los módulos de botones de DataTables.
// Las rutas pueden variar ligeramente dependiendo de la versión y cómo estén empaquetados.
// Estas son las rutas más comunes para los plugins de botones.
import 'datatables.net-buttons/js/dataTables.buttons.js'; // Base de los botones
import 'datatables.net-buttons/js/buttons.html5.js';     // Botón para exportar a HTML5 (Excel, CSV)
import 'datatables.net-buttons/js/buttons.print.js';     // Botón para imprimir

// Importaciones para PDF y ZIP
import JSZip from 'jszip';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

import Swal from 'sweetalert2';
import logoUrl from '../assets/Paso seguro.png'; // Asegúrate de que esta ruta sea correcta
import TangramLoader from '../components/TangramLoader';
import { useUserStore } from '../stores/userStore';
import styles from './AdminPage.module.css';

// Asignaciones globales para DataTables
// Esto es necesario para que DataTables (que a menudo depende de jQuery globalmente)
// y sus plugins (como pdfMake y JSZip) puedan encontrarlos.
(window as any).$ = $;
(window as any).jQuery = $;
(window as any).JSZip = JSZip;
pdfMake.vfs = pdfFonts.vfs; // Asigna las fuentes virtuales a pdfMake
(window as any).pdfMake = pdfMake;

// Función para convertir una URL de imagen a Base64
// Útil para incrustar imágenes en PDFs generados por pdfMake
async function toBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function AdminPage() {
  const tableRef = useRef<HTMLTableElement>(null);
  const dtInstance = useRef<any>(null); // Referencia a la instancia de DataTables

  const [logoBase64, setLogoBase64] = useState('');
  const [loading, setLoading] = useState(false); // Estado para controlar el loader

  // Obtener el estado y las acciones del store de Zustand
  const users = useUserStore(s => s.users);
  const initStore = useUserStore(s => s.init);
  const toggleActive = useUserStore(s => s.toggleActive);
  const setRole = useUserStore(s => s.setRole);
  // Obtener loadUsers que ahora está definido en el store
  const loadUsers = useUserStore(s => s.loadUsers); 

  // Constantes para el loader
  const LOADER_MIN_MS = 1000; // Reducido a 1 segundo para una mejor UX
  const showLoader = () => setLoading(true);
  const hideLoader = () => setTimeout(() => setLoading(false), LOADER_MIN_MS);

  // useEffect para cargar el logo en Base64
  useEffect(() => {
    showLoader();
    toBase64(logoUrl).then(dataUrl => {
      setLogoBase64(dataUrl);
      hideLoader();
    }).catch(error => {
      console.error("Error loading logo for PDF:", error);
      hideLoader();
    });
  }, []); // Se ejecuta solo una vez al montar el componente

  // useEffect para inicializar el store (si es necesario).
  // `zustand-persist` ya maneja la carga de `users` automáticamente.
  // `initStore` podría usarse para lógica adicional de inicialización del store.
  useEffect(() => {
    showLoader();
    initStore(); // Llama a la función init del store
    // Si loadUsers necesita ser llamado explícitamente para cargar datos iniciales
    // (más allá de lo que hace persist), hazlo aquí.
    loadUsers(); // Llama a loadUsers para asegurar que los usuarios estén cargados
    hideLoader();
  }, [initStore, loadUsers]); // Dependencias: initStore y loadUsers

  // useEffect para inicializar DataTables y manejar eventos
  useEffect(() => {
    // Solo inicializa DataTables si la referencia a la tabla existe y el logoBase64 está listo
    if (!tableRef.current || !logoBase64) {
      console.log('DataTables initialization skipped: tableRef or logoBase64 not ready.');
      return;
    }

    showLoader(); // Mostrar loader antes de inicializar la tabla

    // Destruir la instancia existente de DataTables si ya existe
    if (dtInstance.current) {
      dtInstance.current.destroy();
      // Limpiar eventos para evitar duplicados
      $(tableRef.current).off('.dt'); // Desactiva todos los eventos de DataTables
    }

    const $tbl = $(tableRef.current);
    dtInstance.current = $tbl.DataTable({
      data: users, // Los datos se pasan directamente desde el store
      columns: [
        { data: 'firstName', title: 'Nombre' },
        { data: 'lastName', title: 'Apellido' },
        { data: 'email', title: 'Email' },
        {
          data: 'role',
          title: 'Rol',
          render: (role: string) =>
            `<select class="role-select">
               <option value="user" ${role === 'user' ? 'selected' : ''}>User</option>
               <option value="admin" ${role === 'admin' ? 'selected' : ''}>Admin</option>
             </select>`,
        },
        {
          data: 'activo',
          title: 'Activo',
          render: (a: boolean) =>
            `<input type="checkbox" class="active-chk" ${a ? 'checked' : ''}/>`,
        },
        {
          data: null,
          title: 'Acciones',
          orderable: false,
          render: () => `<button type="button" class="btn-view">Ver</button>`,
        },
      ],
      dom: 'Bfrtip', // Habilita los botones
      buttons: [
        'excelHtml5',
        {
          extend: 'pdfHtml5',
          text: 'PDF',
          title: 'Paso seguro users',
          customize: (doc: any) => {
            doc.pageMargins = [40, 100, 40, 40];
            doc.header = {
              columns: [
                { image: logoBase64, width: 100 },
                {
                  text: 'Reporte de Usuarios',
                  alignment: 'right',
                  fontSize: 16,
                  margin: [0, 30, 0, 0],
                },
              ],
            };
          },
        },
        'print',
      ],
      language: { search: 'Buscar:', paginate: { next: '›', previous: '‹' } },
      destroy: true, // Permite que DataTables sea reinicializado
    });

    // Event listeners para los cambios en la tabla
    // Usamos .off() antes de .on() para evitar duplicar listeners en re-renders
    $tbl.off('change.role').on('change.role', 'select.role-select', function () {
      showLoader();
      const data = dtInstance.current.row($(this).closest('tr')).data();
      setRole(data.email, (this as HTMLSelectElement).value as 'user' | 'admin');
      hideLoader();
    });

    $tbl.off('click.active').on('click.active', 'input.active-chk', function () {
      showLoader();
      const data = dtInstance.current.row($(this).closest('tr')).data();
      toggleActive(data.email);
      hideLoader();
    });

    $tbl.off('click.view').on('click.view', 'tbody button.btn-view', function () {
      const user = dtInstance.current.row($(this).closest('tr')).data();
      const html = Object.entries(user)
        .map(([key, val]) => {
          // Manejo seguro de valores anidados para visualización en SweetAlert2
          let display: any;
          if (typeof val === 'object' && val !== null) {
            // Asegúrate de que las coordenadas se muestren correctamente si existen
            if (key === 'address' || key === 'company') {
              const addr = val as Address; // Castea para acceder a propiedades de Address
              const coords = addr.coordinates;
              display = `<pre>${JSON.stringify(val, null, 2)}</pre>`;
            } else {
              display = `<pre>${JSON.stringify(val, null, 2)}</pre>`;
            }
          } else {
            display = val;
          }
          return `<p><strong>${key}:</strong> ${display}</p>`;
        }).join('');
      Swal.fire({ title: 'Detalle completo de Usuario', html, width: 600 });
    });

    hideLoader(); // Ocultar loader después de inicializar la tabla y adjuntar eventos

    // Función de limpieza para destruir la instancia de DataTables
    return () => {
      if (dtInstance.current) {
        dtInstance.current.destroy();
        dtInstance.current = null; // Limpiar la referencia
      }
      $(tableRef.current).off('.dt change click view'); // Desactiva todos los eventos con el namespace .dt, change, click, view
    };
  }, [users, logoBase64, toggleActive, setRole]); // Dependencias: users (para re-renderizar la tabla cuando cambian los datos), logoBase64 (para PDF), toggleActive y setRole (funciones estables)

  // useEffect para actualizar los datos de la tabla cuando 'users' cambia
  // Este useEffect es redundante si `destroy: true` está en el init y `users` es una dependencia.
  // Sin embargo, si quieres un update más eficiente sin destruir la tabla, esta es la forma.
  // Lo mantendremos por ahora, pero considera si es realmente necesario con `destroy: true`.
  useEffect(() => {
    if (dtInstance.current && users) {
      console.log('Updating DataTables data due to users change.');
      dtInstance.current.clear();
      dtInstance.current.rows.add(users);
      dtInstance.current.draw(false); // draw(false) para no resetear la paginación/ordenación
    }
  }, [users]); // Dependencia: users

  return (
    <div className={styles.adminContainer}>
      {loading && (
        <div className={styles.loaderOverlay}>
          <TangramLoader />
        </div>
      )}

      <h1>Panel de Administración</h1>
      <div className={styles.tableWrapper}> {/* Contenedor para la tabla */}
        <table ref={tableRef} className="display nowrap" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody /> {/* DataTables poblará esto */}
        </table>
      </div>
      </div>
  ); }