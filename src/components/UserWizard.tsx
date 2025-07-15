import React, { useState, useEffect, useRef, useCallback, ChangeEvent } from 'react';
import Swal from 'sweetalert2';
import L, { Map as LeafletMap, Marker } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './UserWizard.module.css';
import { useUserStore, User } from '../stores/userStore'; // Importa la interfaz User desde userStore
import TangramLoader from './TangramLoader'; // ¡Importa tu TangramLoader!

// Asegúrate de que estas interfaces coincidan con la estructura que esperas en el formulario.
// Si las propiedades son opcionales en el UserStore, aquí las manejamos con lógica defensiva.
interface Address {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  coordinates?: { lat?: number; lng?: number }; // Mantenidas como opcionales, pero se sanearán
  stateCode?: string;
  postalCode?: string;
}

interface Company {
  name?: string;
  department?: string;
  title?: string;
  address?: Address; // Anidado de Address
}

interface Bank {
  cardType?: string;
  cardNumber?: string;
  cardExpire?: string;
  currency?: string;
  iban?: string;
}

interface Crypto {
  coin?: string;
  wallet?: string;
  network?: string;
}

interface Hair {
  color?: string;
  type?: string;
}

// FormState extiende User, pero declara las propiedades anidadas como obligatorias
// para que TypeScript nos ayude a asegurar que existen después de la inicialización.
// La lógica de inicialización del useState se encargará de rellenarlas.
interface FormState extends User {
  address: Address;
  company: Company;
  bank: Bank;
  crypto: Crypto;
  hair: Hair;
}

interface Props {
  onClose: () => void;
}

const stepLabels = [
  'Personales',
  'Contacto',
  'Dirección Personal',
  'Apariencia',
  'Dirección Empresa',
  'Finanzas',
  'Confirmar',
];

const instructions: Record<number, string> = {
  1: 'Tus datos básicos.',
  2: 'Contacto y credenciales.',
  3: 'Ajusta tu dirección principal.',
  4: 'Tu apariencia física.',
  5: 'Datos y ubicación de tu empresa.',
  6: 'Banca y cripto.',
  7: 'Revisa y confirma.',
};

const TOTAL_STEPS = stepLabels.length;

// Define un initialForm exhaustivo con todas las propiedades esperadas
// Aseguramos que las propiedades anidadas sean objetos con valores por defecto.
const initialForm: FormState = {
  id: undefined,
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  maidenName: '',
  age: undefined,
  gender: 'female', // Valor por defecto
  phone: '',
  username: '', // Valor por defecto
  birthDate: '',
  image: '',
  bloodGroup: '',
  height: undefined,
  weight: undefined,
  eyeColor: '',
  university: '',
  role: 'user',
  activo: true,
  hair: { color: '', type: '' },
  address: {
    address: '', city: '', state: '', country: '',
    coordinates: { lat: 10.46, lng: -66.92 }, // Coordenadas por defecto (Valencia, Venezuela)
    stateCode: '', postalCode: ''
  },
  bank: { cardType: '', cardNumber: '', cardExpire: '', currency: '', iban: '' },
  company: {
    name: '', department: '', title: '',
    address: { // Dirección anidada dentro de Company
      address: '', city: '', state: '', country: '',
      coordinates: { lat: 34.05, lng: -118.24 }, // Coordenadas por defecto (Los Ángeles, USA)
      stateCode: '', postalCode: ''
    }
  },
  crypto: { coin: '', wallet: '', network: '' },
  ip: '',
  ssn: '',
  macAddress: '',
  ein: '',
  userAgent: '',
};

const initialErrors = {
  firstName: '',
  lastName: '',
  birthDate: '',
  phone: '',
  username: '',
};

export default function UserWizard({ onClose }: Props) {
  const { user, updateUser } = useUserStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false); // Nuevo estado para el loader

  // --- Lógica de inicialización del formulario (useState) ---
  const [form, setForm] = useState<FormState>(() => {
    // Función de ayuda para fusionar objetos anidados de forma segura
    const mergeDeep = (target: any, source: any) => {
      const output = { ...target };
      if (target && typeof target === 'object' && source && typeof source === 'object') {
        Object.keys(source).forEach(key => {
          if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            // Si la propiedad es un objeto y no un array, recursivamente fusionar
            // Asegura que output[key] sea un objeto si es null/undefined
            output[key] = mergeDeep(output[key] || {}, source[key]);
          } else {
            // Para valores primitivos o arrays, sobrescribir si source[key] no es undefined
            if (source[key] !== undefined) {
              output[key] = source[key];
            }
          }
        });
      }
      return output;
    };

    // Inicializa con una copia profunda de initialForm para asegurar la estructura completa
    let mergedForm: FormState = JSON.parse(JSON.stringify(initialForm));

    // Si hay un usuario en el store, fusiónalo con la estructura por defecto
    if (user) {
      mergedForm = mergeDeep(mergedForm, user);
    }

    // Post-procesamiento para asegurar que las propiedades anidadas críticas existan y sean numéricas
    // Esto es vital si 'user' viene de un localStorage antiguo o incompleto.
    mergedForm.address = mergedForm.address || {};
    mergedForm.address.coordinates = mergedForm.address.coordinates || {};
    mergedForm.address.coordinates.lat = Number(mergedForm.address.coordinates.lat) || initialForm.address.coordinates.lat;
    mergedForm.address.coordinates.lng = Number(mergedForm.address.coordinates.lng) || initialForm.address.coordinates.lng;

    mergedForm.company = mergedForm.company || {};
    mergedForm.company.address = mergedForm.company.address || {};
    mergedForm.company.address.coordinates = mergedForm.company.address.coordinates || {};
    mergedForm.company.address.coordinates.lat = Number(mergedForm.company.address.coordinates.lat) || initialForm.company.address.coordinates.lat;
    mergedForm.company.address.coordinates.lng = Number(mergedForm.company.address.coordinates.lng) || initialForm.company.address.coordinates.lng;

    // Asegurar que otras propiedades anidadas sean objetos vacíos si son undefined
    mergedForm.hair = mergedForm.hair || initialForm.hair;
    mergedForm.bank = mergedForm.bank || initialForm.bank;
    mergedForm.crypto = mergedForm.crypto || initialForm.crypto;

    // Asegurar que password sea string, no undefined
    mergedForm.password = mergedForm.password || '';
    // Asegurar gender y username si son opcionales en User pero obligatorios en FormState
    mergedForm.gender = mergedForm.gender || 'female';
    mergedForm.username = mergedForm.username || ''; // O user.email.split('@')[0] si lo prefieres

    return mergedForm;
  });
  // --- Fin de la lógica de inicialización del formulario ---

  const [errors, setErrors] = useState(initialErrors);
  const [searchPersonal, setSearchPersonal] = useState('');
  const [searchCompany, setSearchCompany] = useState('');

  // Refs para los contenedores de los mapas
  const personalMapRef = useRef<HTMLDivElement>(null);
  const companyMapRef = useRef<HTMLDivElement>(null);

  // Refs para guardar las instancias de los mapas y marcadores de Leaflet
  const mapInstances = useRef<Record<string, LeafletMap | null>>({
    personal: null,
    company: null,
  });
  const markerInstances = useRef<Record<string, Marker | null>>({
    personal: null,
    company: null,
  });

  // useEffect para re-sincronizar el formulario si el 'user' del store cambia
  useEffect(() => {
    if (user) {
      setForm(prevForm => {
        const mergeDeep = (target: any, source: any) => {
          const output = { ...target };
          if (target && typeof target === 'object' && source && typeof source === 'object') {
            Object.keys(source).forEach(key => {
              if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                output[key] = mergeDeep(output[key] || {}, source[key]);
              } else {
                if (source[key] !== undefined) {
                  output[key] = source[key];
                }
              }
            });
          }
          return output;
        };

        let mergedForm = mergeDeep(prevForm, user); // Fusiona con el estado actual del formulario

        // Asegurarse de que las coordenadas siempre sean objetos después de la fusión
        mergedForm.address = mergedForm.address || {};
        mergedForm.address.coordinates = mergedForm.address.coordinates || {};
        mergedForm.address.coordinates.lat = Number(mergedForm.address.coordinates.lat) || initialForm.address.coordinates.lat;
        mergedForm.address.coordinates.lng = Number(mergedForm.address.coordinates.lng) || initialForm.address.coordinates.lng;

        mergedForm.company = mergedForm.company || {};
        mergedForm.company.address = mergedForm.company.address || {};
        mergedForm.company.address.coordinates = mergedForm.company.address.coordinates || {};
        mergedForm.company.address.coordinates.lat = Number(mergedForm.company.address.coordinates.lat) || initialForm.company.address.coordinates.lat;
        mergedForm.company.address.coordinates.lng = Number(mergedForm.company.address.coordinates.lng) || initialForm.company.address.coordinates.lng;

        // Asegurar que otras propiedades anidadas sean objetos vacíos si son undefined
        mergedForm.hair = mergedForm.hair || initialForm.hair;
        mergedForm.bank = mergedForm.bank || initialForm.bank;
        mergedForm.crypto = mergedForm.crypto || initialForm.crypto;

        mergedForm.password = user.password || ''; // Asegura que password no sea 'undefined'
        mergedForm.gender = mergedForm.gender || 'female';
        mergedForm.username = mergedForm.username || '';

        return mergedForm;
      });
    }
  }, [user]); // Dependencia del 'user' del store

  // Función para actualizar la posición del marcador y la vista del mapa
  const updateMap = useCallback(
    (type: 'personal' | 'company', coords: { lat: number; lng: number }) => {
      const map = mapInstances.current[type];
      const marker = markerInstances.current[type];

      // Validar coordenadas antes de usarlas con Leaflet
      if (typeof coords.lat !== 'number' || typeof coords.lng !== 'number' || isNaN(coords.lat) || isNaN(coords.lng)) {
        console.error(`Invalid coordinates provided to updateMap for ${type}:`, coords);
        return;
      }

      if (map && marker) {
        map.setView([coords.lat, coords.lng], map.getZoom() || 13); // Mantener zoom actual o default
        marker.setLatLng([coords.lat, coords.lng]);
      } else {
        console.warn(`Map or marker for ${type} not found when trying to update. Map: ${!!map}, Marker: ${!!marker}`);
      }
    },
    [] // NO DEPENDENCIAS QUE CAMBIEN POR RENDERIZADO DEL FORMULARIO
  );

  // Función para geocodificación inversa (coordenadas a dirección)
  const reverseGeocode = useCallback(
    async (type: 'personal' | 'company', coords: { lat: number; lng: number }) => {
      // Validar coords antes de usar
      if (typeof coords.lat !== 'number' || typeof coords.lng !== 'number' || isNaN(coords.lat) || isNaN(coords.lng)) {
        console.error(`Invalid coordinates provided to reverseGeocode for ${type}:`, coords);
        Swal.fire('Error de ubicación', 'Coordenadas inválidas para geocodificación inversa.', 'error');
        return;
      }

      const { lat, lng } = coords;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
        );
        if (!res.ok) {
          console.error('Error en reverseGeocode:', res.status, res.statusText);
          Swal.fire('Error', `No se pudo obtener la dirección para estas coordenadas. (${res.status})`, 'error');
          return;
        }
        const j = await res.json();
        setForm(prevForm => {
          const newAddress: Address = {
            address: j.display_name || '',
            city: j.address.city || j.address.town || '',
            state: j.address.state || '',
            country: j.address.country || '',
            coordinates: { lat, lng }, // Aseguradas por validación previa
            stateCode: j.address.state_code || '',
            postalCode: j.address.postcode || '',
          };

          if (type === 'personal') {
            // Asegúrate de que `prevForm.address` es un objeto antes de fusionar
            return { ...prevForm, address: { ...(prevForm.address || {}), ...newAddress } };
          } else {
            // Asegúrate de que `prevForm.company` y `prevForm.company.address` son objetos
            return {
              ...prevForm,
              company: {
                ...(prevForm.company || {}),
                address: { ...(prevForm.company?.address || {}), ...newAddress }
              }
            };
          }
        });
        updateMap(type, coords);
      } catch (error) {
        console.error('Error fetching geocoding data:', error);
        Swal.fire('Error', 'Hubo un problema al obtener la dirección.', 'error');
      }
    },
    [updateMap] // updateMap es estable debido a useCallback con []
  );

  // Función para inicializar el mapa Leaflet
  const initMap = useCallback(
    async (type: 'personal' | 'company', refElem: React.RefObject<HTMLDivElement>) => {
      // Obtén las coordenadas actuales del formulario para el tipo de dirección
      // Accedemos directamente ya que FormState garantiza que address/company existen.
      const addr = type === 'personal' ? form.address : form.company.address;

      // Accede a las coordenadas de forma segura, usando valores por defecto si son undefined o NaN
      const lat = Number(addr.coordinates?.lat) || (type === 'personal' ? initialForm.address.coordinates.lat : initialForm.company.address.coordinates.lat);
      const lng = Number(addr.coordinates?.lng) || (type === 'personal' ? initialForm.address.coordinates.lng : initialForm.company.address.coordinates.lng);

      // Solo inicializa si el elemento DOM existe y el mapa no ha sido inicializado antes
      if (!refElem.current || mapInstances.current[type]) {
        return;
      }

      // Validar coordenadas finales antes de pasar a Leaflet
      if (isNaN(lat) || isNaN(lng)) {
          console.error(`Calculated initial coordinates are NaN for ${type} map: lat=${lat}, lng=${lng}. Using hardcoded default from initialForm.`);
          const fallbackCoords = type === 'personal' ? initialForm.address.coordinates : initialForm.company.address.coordinates;
          // Si hay un NaN, usa las coordenadas por defecto del initialForm.
          Swal.fire('Error de ubicación', 'Las coordenadas iniciales del mapa no son válidas. Usando una ubicación predeterminada.', 'error');
          // No inicializar el mapa si las coordenadas son inválidas y no hay fallback seguro
          return;
      }

      try {
        const map = L.map(refElem.current).setView([lat, lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

        const marker = L.marker([lat, lng], {
          draggable: true,
        }).addTo(map);

        marker.on('dragend', () => {
          const { lat: newLat, lng: newLng } = marker.getLatLng();
          // No actualices el form aquí directamente si ya lo hace reverseGeocode.
          reverseGeocode(type, { lat: newLat, lng: newLng });
        });

        mapInstances.current[type] = map;
        markerInstances.current[type] = marker;

        // ELIMINADA ESTA LÍNEA: Esta llamada estaba causando el bucle de recarga del mapa.
        // La información de la dirección ya debería estar en el formulario debido a la inicialización del estado.
        // await reverseGeocode(type, { lat, lng });

      } catch (error) {
        console.error(`Error initializing map for ${type}:`, error);
        Swal.fire('Error de mapa', `No se pudo cargar el mapa de ${type === 'personal' ? 'dirección personal' : 'empresa'}.`, 'error');
      }
    },
    [form, reverseGeocode, updateMap] // Dependencias: form (para obtener coordenadas iniciales), reverseGeocode, updateMap
  );

  // useEffect para manejar la inicialización y limpieza de los mapas según el paso
  useEffect(() => {
    const cleanupMap = (mapType: 'personal' | 'company') => {
      if (mapInstances.current[mapType]) {
        mapInstances.current[mapType]?.remove();
        mapInstances.current[mapType] = null;
        markerInstances.current[mapType] = null;
      }
    };

    if (step === 3 && personalMapRef.current) {
      initMap('personal', personalMapRef);
    } else {
      cleanupMap('personal'); // Limpia el mapa personal si no estamos en el paso 3
    }

    if (step === 5 && companyMapRef.current) {
      initMap('company', companyMapRef);
    } else {
      cleanupMap('company'); // Limpia el mapa de la empresa si no estamos en el paso 5
    }

    // Cleanup al desmontar el componente (o antes de que el useEffect se vuelva a ejecutar)
    return () => {
      cleanupMap('personal');
      cleanupMap('company');
    };
  }, [step, initMap]); // Dependencias importantes: step, initMap

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prevForm => ({
          ...prevForm,
          image: reader.result as string, // Guarda la URL base64 en el estado
        }));
      };
      reader.readAsDataURL(file); // Lee el archivo como una URL base64
    }
  };

  const validateStep = useCallback(() => {
    const errs = { ...initialErrors };
    let ok = true;

    if (step === 1) {
      if (!form.firstName) { errs.firstName = 'Requerido'; ok = false; }
      if (!form.lastName) { errs.lastName = 'Requerido'; ok = false; }
      if (!form.birthDate) { errs.birthDate = 'Requerido'; ok = false; }
    }
    if (step === 2) {
      if (!form.phone) { errs.phone = 'Requerido'; ok = false; }
      if (!form.username) { errs.username = 'Requerido'; ok = false; }
      if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        // Podrías añadir un campo para 'email' en initialErrors si lo necesitas validar aquí
        // errs.email = 'Email inválido';
        // ok = false;
      }
    }
    setErrors(errs);
    return ok;
  }, [form, step]);

  const nextStep = () => {
    if (validateStep() && step < TOTAL_STEPS) {
      setStep(s => s + 1);
    } else if (!validateStep()) {
      Swal.fire('Atención', 'Completa los campos requeridos', 'warning');
    }
  };

  const prevStep = () => setStep(s => Math.max(1, s - 1));

  const goTo = (n: number) => {
    if (n < step) {
      setStep(n);
    } else if (n > step && validateStep()) {
      setStep(n);
    }
  };

  // Handler para campos de nivel superior (no anidados)
  const onChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === 'number' && value !== '' ? parseFloat(value) : value, // Maneja cadenas vacías para números
    }));
  };

  // Handler para campos anidados
  const onChangeNested = useCallback((
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    parentField: keyof FormState,
    ...path: string[]
  ) => {
    const { value, type } = e.target;
    const newValue = type === 'number' && value !== '' ? parseFloat(value) : value; // Maneja cadenas vacías para números

    setForm(prevForm => {
      // Deeply update nested properties, ensuring intermediate objects exist
      const updateNested = (obj: any, keys: string[], val: any): any => {
        if (keys.length === 0) {
          return val;
        }

        const [currentKey, ...restKeys] = keys;
        // Si el objeto actual es nulo o indefinido, inicialízalo con un objeto vacío
        const currentObjCopy = { ...(obj || {}) };

        // Asegúrate de que los objetos anidados para 'address', 'company', 'coordinates' existan
        if (typeof currentObjCopy[currentKey] === 'undefined' || currentObjCopy[currentKey] === null) {
          if (currentKey === 'address') {
            currentObjCopy[currentKey] = { coordinates: { lat: 0, lng: 0 } };
          } else if (currentKey === 'company') {
            currentObjCopy[currentKey] = { address: { coordinates: { lat: 0, lng: 0 } } };
          } else if (currentKey === 'coordinates') {
            currentObjCopy[currentKey] = { lat: 0, lng: 0 };
          } else {
            currentObjCopy[currentKey] = {}; // Objeto genérico si no es especial
          }
        }

        return {
          ...currentObjCopy,
          [currentKey]: updateNested(currentObjCopy[currentKey], restKeys, val)
        };
      };

      const fullPath = [parentField, ...path];
      return updateNested(prevForm, fullPath, newValue);
    });
  }, []); // Dependencias vacías, es una función auxiliar

  // Función para obtener la ubicación actual del navegador
  const locateMe = (type: 'personal' | 'company') => {
    if (!navigator.geolocation) {
      Swal.fire('Error', 'Geolocalización no soportada en este navegador.', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        // Llama a reverseGeocode que a su vez actualizará el form y el mapa.
        reverseGeocode(type, { lat, lng });
      },
      (error) => { // Manejo de errores de geolocalización
        console.error('Geolocation error:', error);
        let errorMessage = 'No obtuvimos tu ubicación.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Permiso de geolocalización denegado. Por favor, habilítalo en la configuración de tu navegador.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = 'La información de ubicación no está disponible.';
        } else if (error.code === error.TIMEOUT) {
          errorMessage = 'Tiempo de espera agotado al intentar obtener la ubicación.';
        }
        Swal.fire('Error de ubicación', errorMessage, 'error');
      }
    );
  };

  // Función para buscar una dirección y actualizar el mapa
  const searchAddress = async (type: 'personal' | 'company') => {
    const query = type === 'personal' ? searchPersonal : searchCompany;
    if (!query) {
      Swal.fire('Atención', 'Escribe algo para buscar.', 'warning');
      return;
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      if (!res.ok) {
        Swal.fire('Error', 'Error al buscar dirección.', 'error');
        return;
      }
      const arr = await res.json();
      if (!arr.length) {
        Swal.fire('No encontrado', 'Ningún resultado para tu búsqueda.', 'info');
        return;
      }
      const best = arr[0];
      const newCoords = { lat: +best.lat, lng: +best.lon };
      // Llama a reverseGeocode que a su vez actualizará el form y el mapa.
      reverseGeocode(type, newCoords);
    } catch (error) {
      console.error('Error searching address:', error);
      Swal.fire('Error', 'Hubo un problema al buscar la dirección.', 'error');
    }
  };

  // Función para manejar el envío final del formulario
  const handleSubmit = async () => { // Marcar como async
    setLoading(true); // Mostrar el loader

    // Esperar 10 segundos
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Clona el formulario para hacer ajustes antes de enviar
    const finalForm: Partial<User> = {
      ...form,
      age: computedAge,
      // Manejo de valores vacíos para que sean undefined, según tu lógica original
      password: form.password === '' ? undefined : form.password,
      maidenName: form.maidenName === '' ? undefined : form.maidenName,
      bloodGroup: form.bloodGroup === '' ? undefined : form.bloodGroup,
      eyeColor: form.eyeColor === '' ? undefined : form.eyeColor,
      university: form.university === '' ? undefined : form.university,
      ip: form.ip === '' ? undefined : form.ip,
      macAddress: form.macAddress === '' ? undefined : form.macAddress,
      ein: form.ein === '' ? undefined : form.ein,
      ssn: form.ssn === '' ? undefined : form.ssn,
      userAgent: form.userAgent === '' ? undefined : form.userAgent,
      height: form.height === 0 || form.height === undefined ? undefined : form.height,
      weight: form.weight === 0 || form.weight === undefined ? undefined : form.weight,

      // Las propiedades anidadas deben ser undefined si todas sus sub-propiedades son vacías o por defecto
      hair: (form.hair?.color === '' && form.hair?.type === '') ? undefined : form.hair,
      bank: (Object.values(form.bank || {}).every(val => val === '' || val === undefined)) ? undefined : form.bank,
      crypto: (Object.values(form.crypto || {}).every(val => val === '' || val === undefined)) ? undefined : form.crypto,

      // Para Address y Company.Address, la lógica es más compleja por las coordenadas
      address: (() => {
        const defaultCoords = initialForm.address.coordinates;
        const currentCoords = form.address.coordinates;
        const isDefaultCoords = Number(currentCoords?.lat) === defaultCoords.lat && Number(currentCoords?.lng) === defaultCoords.lng;

        const isAddressEmpty = (
          (form.address?.address === '' || form.address?.address === undefined) &&
          (form.address?.city === '' || form.address?.city === undefined) &&
          (form.address?.state === '' || form.address?.state === undefined) &&
          (form.address?.country === '' || form.address?.country === undefined) &&
          (form.address?.stateCode === '' || form.address?.stateCode === undefined) &&
          (form.address?.postalCode === '' || form.address?.postalCode === undefined)
        );

        // Si la dirección está vacía Y las coordenadas son las por defecto, entonces la dirección es "indefinida"
        if (isAddressEmpty && isDefaultCoords) {
          return undefined;
        }

        return {
          ...form.address,
          // Asegurar que las coordenadas son numéricas válidas antes de enviar
          coordinates: {
            lat: Number(form.address?.coordinates?.lat) || defaultCoords.lat,
            lng: Number(form.address?.coordinates?.lng) || defaultCoords.lng,
          }
        };
      })(),

      company: (() => {
        const defaultCoords = initialForm.company.address.coordinates;
        const currentCoords = form.company.address.coordinates;
        const isDefaultCoords = Number(currentCoords?.lat) === defaultCoords.lat && Number(currentCoords?.lng) === defaultCoords.lng;

        const isCompanyAddressEmpty = (
          (form.company?.address?.address === '' || form.company?.address?.address === undefined) &&
          (form.company?.address?.city === '' || form.company?.address?.city === undefined) &&
          (form.company?.address?.state === '' || form.company?.address?.state === undefined) &&
          (form.company?.address?.country === '' || form.company?.address?.country === undefined) &&
          (form.company?.address?.stateCode === '' || form.company?.address?.stateCode === undefined) &&
          (form.company?.address?.postalCode === '' || form.company?.address?.postalCode === undefined)
        );

        const isCompanyInfoEmpty = (
          (form.company?.name === '' || form.company?.name === undefined) &&
          (form.company?.department === '' || form.company?.department === undefined) &&
          (form.company?.title === '' || form.company?.title === undefined)
        );

        // Si toda la información de la compañía (incluyendo la dirección) está vacía o es por defecto
        if (isCompanyInfoEmpty && isCompanyAddressEmpty && isDefaultCoords) {
          return undefined;
        }

        return {
          ...form.company,
          address: {
            ...form.company.address,
            coordinates: {
              lat: Number(form.company?.address?.coordinates?.lat) || defaultCoords.lat,
              lng: Number(form.company?.address?.coordinates?.lng) || defaultCoords.lng,
            }
          }
        };
      })(),

      // Datos de usuario esenciales que no cambian en el wizard o vienen del store
      id: user?.id,
      email: user?.email,
      role: user?.role,
      activo: user?.activo,
    };

    updateUser(finalForm);
    setLoading(false); // Ocultar el loader
    Swal.fire('¡Listo!', 'Datos guardados', 'success').then(onClose);
  };

  const computedAge = React.useMemo(() => {
    if (!form.birthDate) return 0;
    const bd = new Date(form.birthDate);
    const today = new Date();
    let age = today.getFullYear() - bd.getFullYear();
    if (
      today.getMonth() < bd.getMonth() ||
      (today.getMonth() === bd.getMonth() &&
        today.getDate() < bd.getDate())
    ) {
      age--;
    }
    return age;
  }, [form.birthDate]);

  // Bloqueo de renderizado si el usuario no está cargado.
  // Esto es muy importante para evitar accesos a 'user' antes de que persist lo cargue.
  if (!user) {
    return (
      <div className={styles.loadingOverlay}>
        <div className={styles.loadingSpinner}></div>
        <p>Cargando información del usuario...</p>
      </div>
    );
  }

  // --- NUEVA FUNCIÓN PARA RENDERIZAR DATOS EN EL PASO DE CONFIRMACIÓN ---
  const renderConfirmationData = useCallback(() => {
    const dataToDisplay: { [key: string]: any } = { ...form };

    // Eliminar datos sensibles o no relevantes para la visualización
    delete dataToDisplay.password;
    delete dataToDisplay.id; // ID puede ser redundante para el usuario final
    delete dataToDisplay.role; // Rol es más para administración
    delete dataToDisplay.activo; // Activo es más para administración

    // Mapeo de claves a nombres amigables en español
    const friendlyNames: { [key: string]: string } = {
      firstName: 'Nombre',
      lastName: 'Apellido',
      email: 'Email',
      maidenName: 'Apellido de Soltera',
      age: 'Edad',
      gender: 'Género',
      phone: 'Teléfono',
      username: 'Nombre de Usuario',
      birthDate: 'Fecha de Nacimiento',
      image: 'Imagen de Perfil',
      bloodGroup: 'Grupo Sanguíneo',
      height: 'Altura (cm)',
      weight: 'Peso (kg)',
      eyeColor: 'Color de Ojos',
      university: 'Universidad',
      ip: 'Dirección IP',
      macAddress: 'Dirección MAC',
      ein: 'EIN',
      ssn: 'SSN',
      userAgent: 'User Agent',
      // Propiedades anidadas
      address: 'Dirección Personal',
      company: 'Datos de Empresa',
      bank: 'Datos Bancarios',
      crypto: 'Datos de Criptomonedas',
      hair: 'Cabello',
      // Sub-propiedades de Address
      address_address: 'Calle y Número',
      address_city: 'Ciudad',
      address_state: 'Estado',
      address_stateCode: 'Código de Estado',
      address_postalCode: 'Código Postal',
      address_country: 'País',
      address_coordinates: 'Coordenadas',
      address_coordinates_lat: 'Latitud',
      address_coordinates_lng: 'Longitud',
      // Sub-propiedades de Company
      company_name: 'Nombre de la Empresa',
      company_department: 'Departamento',
      company_title: 'Título',
      company_address: 'Dirección de la Empresa',
      // Sub-propiedades de Company.Address (usarán los mismos prefijos de address_)
      // Sub-propiedades de Hair
      hair_color: 'Color',
      hair_type: 'Tipo',
      // Sub-propiedades de Bank
      bank_cardType: 'Tipo de Tarjeta',
      bank_cardNumber: 'Número de Tarjeta',
      bank_cardExpire: 'Vencimiento',
      bank_currency: 'Moneda',
      bank_iban: 'IBAN',
      // Sub-propiedades de Crypto
      crypto_coin: 'Moneda',
      crypto_wallet: 'Wallet',
      crypto_network: 'Red',
    };

    const renderField = (key: string, value: any, prefix: string = '') => {
      const fullKey = prefix ? `${prefix}_${key}` : key;
      const displayName = friendlyNames[fullKey] || key;

      if (value === undefined || value === null || value === '') {
        return null; // No mostrar campos vacíos
      }

      if (typeof value === 'object' && !Array.isArray(value)) {
        // Renderizar objetos anidados como sub-secciones
        const subFields = Object.keys(value).map(subKey =>
          renderField(subKey, value[subKey], fullKey)
        ).filter(Boolean); // Filtrar nulls

        if (subFields.length === 0) return null; // No mostrar secciones vacías

        return (
          <div key={fullKey} className={styles.confirmationSection}>
            <h4 className={styles.confirmationSubHeading}>{displayName}</h4>
            <ul className={styles.confirmationList}>
              {subFields}
            </ul>
          </div>
        );
      } else if (key === 'image') {
        return (
          <li key={fullKey} className={styles.confirmationItem}>
            <strong>{displayName}:</strong> <img src={value} alt="Perfil" className={styles.confirmationImage} />
          </li>
        );
      } else if (key === 'gender') {
        return (
          <li key={fullKey} className={styles.confirmationItem}>
            <strong>{displayName}:</strong> {value === 'female' ? 'Femenino' : 'Masculino'}
          </li>
        );
      } else if (key === 'birthDate') {
        const date = new Date(value);
        return (
          <li key={fullKey} className={styles.confirmationItem}>
            <strong>{displayName}:</strong> {date.toLocaleDateString('es-ES')}
          </li>
        );
      }
      else {
        return (
          <li key={fullKey} className={styles.confirmationItem}>
            <strong>{displayName}:</strong> {String(value)}
          </li>
        );
      }
    };

    return (
      <div className={styles.confirmationContainer}>
        <h3 className={styles.confirmationHeading}>Información del Perfil</h3>
        <ul className={styles.confirmationList}>
          {Object.keys(dataToDisplay).map(key => renderField(key, dataToDisplay[key]))}
        </ul>
      </div>
    );
  }, [form]); // Dependencia del formulario para re-renderizar si los datos cambian
  // --- FIN NUEVA FUNCIÓN PARA RENDERIZAR DATOS ---


  return (
    <div className={styles.wizard}>
      {/* Loader Overlay */}
      {loading && (
        <div className={styles.fullScreenLoaderOverlay}>
          <TangramLoader /> {/* ¡Tu componente de animación Tangram! */}
          <p>Guardando tus datos, por favor espera...</p>
        </div>
      )}

      <div className={styles.header}>
        {stepLabels.map((lbl, i) => (
          <button
            key={i}
            className={step === i + 1 ? styles.activeTab : ''}
            onClick={() => goTo(i + 1)}
          >
            {lbl}
          </button>
        ))}
      </div>
      <p className={styles.instruction}>{instructions[step]}</p>

      <div className={styles.content}>
        {step === 1 && (
          <div className={styles.step}>
            <label>
              ID de Usuario:
              <input
                type="number"
                name="id"
                value={form.id || ''}
                readOnly
                className={styles.readOnlyField}
                onChange={onChange}
              />
            </label>
            <label>
              Nombre:
              <input
                name="firstName"
                value={form.firstName}
                onChange={onChange}
              />
              {errors.firstName && (
                <span className={styles.error}>{errors.firstName}</span>
              )}
            </label>
            <label>
              Apellido:
              <input
                name="lastName"
                value={form.lastName}
                onChange={onChange}
              />
              {errors.lastName && (
                <span className={styles.error}>{errors.lastName}</span>
              )}
            </label>
            <label>
              Fecha Nac.:
              <input
                type="date"
                name="birthDate"
                value={form.birthDate}
                onChange={onChange}
              />
              {errors.birthDate && (
                <span className={styles.error}>{errors.birthDate}</span>
              )}
            </label>
            <p>Edad: {computedAge} años</p>
            <label>
              Apellido de Soltera:
              <input
                name="maidenName"
                value={form.maidenName || ''}
                onChange={onChange}
              />
            </label>
            <label>
              Género:
              <div className={styles.radioGroup}>
                <label>
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={form.gender === 'female'}
                    onChange={onChange}
                  />{' '}
                  Femenino
                </label>
                <label>
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={form.gender === 'male'}
                    onChange={onChange}
                  />{' '}
                  Masculino
                </label>
              </div>
            </label>
          </div>
        )}
        {step === 2 && (
          <div className={styles.step}>
            <label>
              Teléfono:
              <input name="phone" value={form.phone || ''} onChange={onChange} />
              {errors.phone && (
                <span className={styles.error}>{errors.phone}</span>
              )}
            </label>
            <label>
              Usuario:
              <input name="username" value={form.username || ''} onChange={onChange} />
              {errors.username && (
                <span className={styles.error}>{errors.username}</span>
              )}
            </label>
            <label>
              Email:
              <input name="email" value={form.email} onChange={onChange} />
            </label>
            <label>
              Contraseña:
              <input
                type="password"
                name="password"
                value={form.password || ''}
                onChange={onChange}
                placeholder="Deja vacío para no cambiar"
              />
            </label>
            <label>
              Imagen:
              <div className={styles.imageUpload}>
                <input
                  type="file"
                  name="imageFile"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                />
                <button type="button" onClick={() => fileInputRef.current?.click()}>
                  Subir Imagen
                </button>
                {form.image && (
                  <div className={styles.imagePreview}>
                    <img src={form.image} alt="Vista previa" style={{ maxWidth: '100px', maxHeight: '100px' }} />
                  </div>
                )}
              </div>
            </label>
            <label>
              Grupo Sanguíneo:
              <input name="bloodGroup" value={form.bloodGroup || ''} onChange={onChange} />
            </label>
          </div>
        )}
        {step === 3 && (
          <div className={styles.step}>
            <label>
              Dirección (Calle, No.):
              <input
                name="address.address"
                value={form.address.address || ''}
                onChange={(e) => onChangeNested(e, 'address', 'address')}
              />
            </label>
            <label>
              Ciudad:
              <input
                name="address.city"
                value={form.address.city || ''}
                onChange={(e) => onChangeNested(e, 'address', 'city')}
              />
            </label>
            <label>
              Código Estado:
              <input
                name="address.stateCode"
                value={form.address.stateCode || ''}
                onChange={(e) => onChangeNested(e, 'address', 'stateCode')}
              />
            </label>
            <label>
              Código Postal:
              <input
                name="address.postalCode"
                value={form.address.postalCode || ''}
                onChange={(e) => onChangeNested(e, 'address', 'postalCode')}
              />
            </label>
            <label>
              Estado:
              <input
                name="address.state"
                value={form.address.state || ''}
                onChange={(e) => onChangeNested(e, 'address', 'state')}
              />
            </label>
            <label>
              País:
              <input
                name="address.country"
                value={form.address.country || ''}
                onChange={(e) => onChangeNested(e, 'address', 'country')}
              />
            </label>
            <label>
              Coordenadas Latitud:
              <input
                type="number"
                name="address.coordinates.lat"
                value={form.address.coordinates.lat ?? ''}
                onChange={(e) => onChangeNested(e, 'address', 'coordinates', 'lat')}
                step="any"
              />
            </label>
            <label>
              Coordenadas Longitud:
              <input
                type="number"
                name="address.coordinates.lng"
                value={form.address.coordinates.lng ?? ''}
                onChange={(e) => onChangeNested(e, 'address', 'coordinates', 'lng')}
                step="any"
              />
            </label>
            <div className={styles.mapControls}>
              <button type="button" onClick={() => locateMe('personal')}>Mi Ubicación</button>
              <input
                placeholder="Buscar dirección"
                value={searchPersonal}
                onChange={e => setSearchPersonal(e.target.value)}
              />
              <button type="button" onClick={() => searchAddress('personal')}>
                Buscar
              </button>
            </div>
            <div
              id="personal-map"
              ref={personalMapRef}
              className={styles.mapContainer}
            />
            <p className={styles.mapAddressDisplay}>
              **Dirección Automática:** {form.address.address || 'N/A'}, {form.address.city || 'N/A'}, {form.address.state || 'N/A'}, {form.address.country || 'N/A'}
            </p>
          </div>
        )}
        {step === 4 && (
          <div className={styles.step}>
            <label>
              Altura (cm):
              <input
                type="number"
                name="height"
                value={form.height ?? ''}
                onChange={onChange}
                step="any"
              />
            </label>
            <label>
              Peso (kg):
              <input
                type="number"
                name="weight"
                value={form.weight ?? ''}
                onChange={onChange}
                step="any"
              />
            </label>
            <label>
              Color de Ojos:
              <input name="eyeColor" value={form.eyeColor || ''} onChange={onChange} />
            </label>
            <label>
              Color de Cabello:
              <input
                name="hair.color"
                value={form.hair.color || ''}
                onChange={(e) => onChangeNested(e, 'hair', 'color')}
              />
            </label>
            <label>
              Tipo de Cabello:
              <input
                name="hair.type"
                value={form.hair.type || ''}
                onChange={(e) => onChangeNested(e, 'hair', 'type')}
              />
            </label>
            <label>
              Universidad:
              <input name="university" value={form.university || ''} onChange={onChange} />
            </label>
          </div>
        )}
        {step === 5 && (
          <div className={styles.step}>
            <label>
              Empresa:
              <input
                name="company.name"
                value={form.company.name || ''}
                onChange={(e) => onChangeNested(e, 'company', 'name')}
              />
            </label>
            <label>
              Departamento:
              <input
                name="company.department"
                value={form.company.department || ''}
                onChange={(e) => onChangeNested(e, 'company', 'department')}
              />
            </label>
            <label>
              Título:
              <input
                name="company.title"
                value={form.company.title || ''}
                onChange={(e) => onChangeNested(e, 'company', 'title')}
              />
            </label>
            <h4>Dirección de la Empresa</h4>
            <label>
              Dirección Empresa (Calle, No.):
              <input
                name="company.address.address"
                value={form.company.address.address || ''}
                onChange={(e) => onChangeNested(e, 'company', 'address', 'address')}
              />
            </label>
            <label>
              Código Estado Empresa:
              <input
                name="company.address.stateCode"
                value={form.company.address.stateCode || ''}
                onChange={(e) => onChangeNested(e, 'company', 'address', 'stateCode')}
              />
            </label>
            <label>
              Código Postal Empresa:
              <input
                name="company.address.postalCode"
                value={form.company.address.postalCode || ''}
                onChange={(e) => onChangeNested(e, 'company', 'address', 'postalCode')}
              />
            </label>
            <label>
              Ciudad Empresa:
              <input
                name="company.address.city"
                value={form.company.address.city || ''}
                onChange={(e) => onChangeNested(e, 'company', 'address', 'city')}
              />
            </label>
            <label>
              Estado Empresa:
              <input
                name="company.address.state"
                value={form.company.address.state || ''}
                onChange={(e) => onChangeNested(e, 'company', 'address', 'state')}
              />
            </label>
            <label>
              País Empresa:
              <input
                name="company.address.country"
                value={form.company.address.country || ''}
                onChange={(e) => onChangeNested(e, 'company', 'address', 'country')}
              />
            </label>
            <h5>Coordenadas Empresa</h5>
            <label>
              Latitud Empresa:
              <input
                type="number"
                name="company.address.coordinates.lat"
                value={form.company.address.coordinates.lat ?? ''}
                onChange={(e) => onChangeNested(e, 'company', 'address', 'coordinates', 'lat')}
                step="any"
              />
            </label>
            <label>
              Longitud Empresa:
              <input
                type="number"
                name="company.address.coordinates.lng"
                value={form.company.address.coordinates.lng ?? ''}
                onChange={(e) => onChangeNested(e, 'company', 'address', 'coordinates', 'lng')}
                step="any"
              />
            </label>
            <div className={styles.mapControls}>
              <button type="button" onClick={() => locateMe('company')}>Mi Ubicación</button>
              <input
                placeholder="Buscar dirección"
                value={searchCompany}
                onChange={e => setSearchCompany(e.target.value)}
              />
              <button type="button" onClick={() => searchAddress('company')}>
                Buscar
              </button>
            </div>
            <div
              id="company-map"
              ref={companyMapRef}
              className={styles.mapContainer}
            />
            <p className={styles.mapAddressDisplay}>
              **Dirección Automática:** {form.company.address.address || 'N/A'}, {form.company.address.city || 'N/A'}, {form.company.address.state || 'N/A'}, {form.company.address.country || 'N/A'}
            </p>
          </div>
        )}
        {step === 6 && (
          <div className={styles.step}>
            <h3>Datos Bancarios</h3>
            <label>
              Tipo de Tarjeta:
              <input
                name="bank.cardType"
                value={form.bank.cardType || ''}
                onChange={(e) => onChangeNested(e, 'bank', 'cardType')}
              />
            </label>
            <label>
              Número de Tarjeta:
              <input
                name="bank.cardNumber"
                value={form.bank.cardNumber || ''}
                onChange={(e) => onChangeNested(e, 'bank', 'cardNumber')}
              />
            </label>
            <label>
              Vencimiento Tarjeta (MM/AA):
              <input
                name="bank.cardExpire"
                value={form.bank.cardExpire || ''}
                onChange={(e) => onChangeNested(e, 'bank', 'cardExpire')}
              />
            </label>
            <label>
              Moneda:
              <input
                name="bank.currency"
                value={form.bank.currency || ''}
                onChange={(e) => onChangeNested(e, 'bank', 'currency')}
              />
            </label>
            <label>
              IBAN:
              <input
                name="bank.iban"
                value={form.bank.iban || ''}
                onChange={(e) => onChangeNested(e, 'bank', 'iban')}
              />
            </label>

            <h3>Criptomonedas</h3>
            <label>
              Moneda Crypto:
              <input
                name="crypto.coin"
                value={form.crypto.coin || ''}
                onChange={(e) => onChangeNested(e, 'crypto', 'coin')}
              />
            </label>
            <label>
              Wallet:
              <input
                name="crypto.wallet"
                value={form.crypto.wallet || ''}
                onChange={(e) => onChangeNested(e, 'crypto', 'wallet')}
              />
            </label>
            <label>
              Red:
              <input
                name="crypto.network"
                value={form.crypto.network || ''}
                onChange={(e) => onChangeNested(e, 'crypto', 'network')}
              />
            </label>
            <label>
              IP:
              <input name="ip" value={form.ip || ''} onChange={onChange} />
            </label>
            <label>
              SSN:
              <input name="ssn" value={form.ssn || ''} onChange={onChange} />
            </label>
            <label>
              MAC Address:
              <input name="macAddress" value={form.macAddress || ''} onChange={onChange} />
            </label>
            <label>
              EIN:
              <input name="ein" value={form.ein || ''} onChange={onChange} />
            </label>
            <label>
              User Agent:
              <input name="userAgent" value={form.userAgent || ''} onChange={onChange} />
            </label>
          </div>
        )}
        {step === 7 && (
          <div className={styles.step}>
            {/* Renderizar los datos de confirmación usando la nueva función */}
            {renderConfirmationData()}
          </div>
        )}
      </div>

      <div className={styles.navigation}>
        {step > 1 && (
          <button onClick={prevStep} className={styles.prevButton}>
            Anterior
          </button>
        )}
        {step < TOTAL_STEPS && (
          <button onClick={nextStep} className={styles.nextButton}>
            Siguiente
          </button>
        )}
        {step === TOTAL_STEPS && (
          <button onClick={handleSubmit} className={styles.submitButton}>
            Guardar Cambios
          </button>
        )}
        <button onClick={onClose} className={styles.closeButton}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
