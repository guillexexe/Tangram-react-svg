// src/stores/userStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Address {
  address?: string;
  city?: string;
  state?: string;
  stateCode?: string;
  postalCode?: string;
  coordinates?: { // Mantenemos como opcional, pero la lógica de saneamiento lo manejará
    lat?: number; // Mantenemos como opcional, pero la lógica de saneamiento lo manejará
    lng?: number; // Mantenemos como opcional, pero la lógica de saneamiento lo manejará
  };
  country?: string;
}

// Interfaz User: Ahora contiene TODOS los campos del perfil directamente
export interface User {
  id: number;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  activo: boolean;

  maidenName?: string;
  age?: number;
  gender?: string;
  phone?: string;
  username?: string;
  birthDate?: string;
  image?: string;
  bloodGroup?: string;
  height?: number;
  weight?: number;
  eyeColor?: string;
  ip?: string;
  macAddress?: string;
  university?: string;
  ein?: string;
  ssn?: string;
  userAgent?: string;

  hair?: {
    color?: string;
    type?: string;
  };
  address?: Address;
  bank?: {
    cardExpire?: string;
    cardNumber?: string;
    cardType?: string;
    currency?: string;
    iban?: string;
  };
  company?: {
    department?: string;
    name?: string;
    title?: string;
    address?: Address;
  };
  crypto?: {
    coin?: string;
    wallet?: string;
    network?: string;
  };
}

// Tipo de estado para el store
type State = {
  loaded: boolean;
  users: User[];
  user: User | null;
  init: () => void;
  // AÑADIMOS loadUsers AQUÍ para que AdminPage pueda llamarlo
  loadUsers: () => void; // Esta función cargará los usuarios si no están ya cargados por persist
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, pw: string) => Promise<void>;
  toggleActive: (email: string) => void;
  setRole: (email: string, role: 'user' | 'admin') => void;
  updateUser: (updates: Partial<User>) => void;
};

// --- Funciones auxiliares para asegurar valores por defecto/estructura ---
// Estas funciones nos permitirán "sanear" los objetos si les faltan propiedades opcionales.

// Proporciona una estructura de Address por defecto
const defaultAddress: Address = {
  address: '', city: '', state: '', stateCode: '', postalCode: '', country: '',
  coordinates: { lat: 0, lng: 0 } // Default coordinates
};

// Proporciona una estructura de Company por defecto
const defaultCompany: NonNullable<User['company']> = {
  department: '', name: '', title: '',
  address: defaultAddress // La dirección de la compañía también usa la dirección por defecto
};

// Proporciona una estructura de Hair por defecto
const defaultHair: NonNullable<User['hair']> = {
    color: '', type: ''
};

// Proporciona una estructura de Bank por defecto
const defaultBank: NonNullable<User['bank']> = {
    cardExpire: '', cardNumber: '', cardType: '', currency: '', iban: ''
};

// Proporciona una estructura de Crypto por defecto
const defaultCrypto: NonNullable<User['crypto']> = {
    coin: '', wallet: '', network: ''
};

// Función de saneamiento para un objeto User
// Asegura que todas las propiedades anidadas opcionales tengan una estructura mínima
const sanitizeUser = (userData: User | null): User | null => {
  if (!userData) return null;

  const sanitizedUser: User = { ...userData };

  // Saneamiento de propiedades de nivel superior que pueden ser opcionales
  sanitizedUser.gender = sanitizedUser.gender || 'female';
  sanitizedUser.username = sanitizedUser.username || sanitizedUser.email.split('@')[0];

  // Saneamiento de Address
  sanitizedUser.address = {
    ...defaultAddress,
    ...(sanitizedUser.address || {}),
    coordinates: {
      ...defaultAddress.coordinates,
      ...(sanitizedUser.address?.coordinates || {}),
    }
  };
  sanitizedUser.address.coordinates.lat = Number(sanitizedUser.address.coordinates.lat) || 0;
  sanitizedUser.address.coordinates.lng = Number(sanitizedUser.address.coordinates.lng) || 0;

  // Saneamiento de Company
  sanitizedUser.company = {
    ...defaultCompany,
    ...(sanitizedUser.company || {}),
    address: {
      ...defaultAddress,
      ...(sanitizedUser.company?.address || {}),
      coordinates: {
        ...defaultAddress.coordinates,
        ...(sanitizedUser.company?.address?.coordinates || {}),
      }
    }
  };
  sanitizedUser.company.address.coordinates.lat = Number(sanitizedUser.company.address.coordinates.lat) || 0;
  sanitizedUser.company.address.coordinates.lng = Number(sanitizedUser.company.address.coordinates.lng) || 0;

  // Saneamiento de otras propiedades anidadas
  sanitizedUser.hair = { ...defaultHair, ...(sanitizedUser.hair || {}) };
  sanitizedUser.bank = { ...defaultBank, ...(sanitizedUser.bank || {}) };
  sanitizedUser.crypto = { ...defaultCrypto, ...(sanitizedUser.crypto || {}) };

  return sanitizedUser;
};

// Implementación del store
export const useUserStore = create<State>()(
  persist(
    (set, get) => ({
      loaded: false,
      users: [],
      user: null,

      init: () => {
        set({ loaded: true });
        console.log('Store de usuario inicializado (a través de persist). Loaded:', get().loaded);
      },

      // AÑADIMOS LA IMPLEMENTACIÓN DE loadUsers
      loadUsers: () => {
        // La lógica de carga de usuarios ya la maneja persist en gran medida.
        // Sin embargo, si necesitas cargar usuarios de una fuente externa (ej. API)
        // y no solo de localStorage, esta es la función para hacerlo.
        // Para que funcione con tu AdminPage, asumiremos que los usuarios
        // ya están siendo gestionados por `persist` o que se cargarán de alguna fuente
        // inicial si no hay datos persistidos.
        // Aquí puedes añadir una lógica para cargar usuarios de un JSON inicial
        // si el array 'users' está vacío después de la hidratación.
        const currentUsers = get().users;
        if (currentUsers.length === 0) {
            // Esto es un placeholder. Si tienes un JSON de usuarios inicial, cárgalo aquí.
            // Por ejemplo:
            // const initialUsersData = JSON.parse(localStorage.getItem('usuarios_inicial') || '[]');
            // const sanitizedInitialUsers = initialUsersData.map((u: User) => sanitizeUser(u)!);
            // set({ users: sanitizedInitialUsers });
            console.log("loadUsers: No hay usuarios en el store. Si necesitas cargar desde una fuente inicial, implementa la lógica aquí.");
        }
      },

      login: async (email, pw) => {
        const u = get().users.find(u => u.email === email);

        if (!u || u.password !== pw) {
          throw new Error('Usuario o contraseña incorrectos');
        }

        // Sanea el usuario antes de establecerlo en el estado
        const userToSet = sanitizeUser(u);
        set({ user: userToSet });
        console.log('Usuario logueado y guardado por persist:', userToSet?.email);
      },

      logout: () => {
        set({ user: null });
        console.log('Sesión cerrada y limpiada por persist.');
      },

      // CORRECCIÓN DE SINTAXIS EN EL MÉTODO register:
      register: async (email, pw) => {
        const users = get().users;
        if (users.some(u => u.email === email)) {
          throw new Error('Este email ya está registrado.');
        }

        const id = Date.now();
        const newUser: User = sanitizeUser({
          id,
          email,
          password: pw,
          firstName: '',
          lastName: '',
          role: 'user',
          activo: true,
          username: email.split('@')[0],
          gender: 'female',
          birthDate: '',
          image: 'https://dummyjson.com/icon/default/128',
          // Las propiedades anidadas se inicializan con valores por defecto vía sanitizeUser
        } as User)!; // Aseguramos a TypeScript que será un User no-nulo

        const updatedUsers = [...users, newUser];
        set({
          users: updatedUsers,
          user: newUser,
        });
        console.log('Usuario registrado y logueado, persistencia manejada automáticamente:', newUser.email);
      },

      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (!currentUser) {
          console.warn('No hay usuario logueado para actualizar.');
          return;
        }

        // Realiza una copia profunda de currentUser para evitar mutaciones directas
        let updatedUser: User = JSON.parse(JSON.stringify(currentUser));

        // Fusiona las actualizaciones de forma defensiva para cada objeto anidado
        // Asegúrate de que los objetos anidados existan antes de fusionar updates
        updatedUser.hair = { ...(updatedUser.hair || {}), ...(updates.hair || {}) };
        updatedUser.address = { ...(updatedUser.address || {}), ...(updates.address || {}) };
        if (updates.address?.coordinates) {
            updatedUser.address.coordinates = { ...(updatedUser.address?.coordinates || {}), ...updates.address.coordinates };
        }
        updatedUser.bank = { ...(updatedUser.bank || {}), ...(updates.bank || {}) };
        updatedUser.company = { ...(updatedUser.company || {}), ...(updates.company || {}) };
        if (updates.company?.address) {
            updatedUser.company.address = { ...(updatedUser.company.address || {}), ...updates.company.address };
            if (updates.company.address?.coordinates) {
                updatedUser.company.address.coordinates = { ...(updatedUser.company.address?.coordinates || {}), ...updates.company.address.coordinates };
            }
        }
        updatedUser.crypto = { ...(updatedUser.crypto || {}), ...(updates.crypto || {}) };

        // Fusionar el resto de las propiedades de nivel superior
        updatedUser = { ...updatedUser, ...updates };

        // Post-actualización: Sanea el usuario para asegurar la consistencia.
        const finalUpdatedUser = sanitizeUser(updatedUser);

        set({ user: finalUpdatedUser });

        const users = get().users.map(u =>
          u.id === finalUpdatedUser!.id ? finalUpdatedUser! : u
        );
        set({ users });
        console.log('Usuario actualizado y persistencia manejada automáticamente:', finalUpdatedUser?.email);
      },

      toggleActive: email => {
        const users = get().users.map(u =>
          u.email === email ? { ...u, activo: !u.activo } : u
        );
        set({ users });
      },

      setRole: (email, role) => {
        const users = get().users.map(u =>
          u.email === email ? { ...u, role } : u
        );
        set({ users });
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
      // ESTO ES CRUCIAL PARA LA ROBUSTEZ: Saneamiento de datos al cargar de localStorage
      onRehydrateStorage: (state) => {
        console.log('Zustand persist: Inicio de hidratación');
        return (storedState, error) => {
          if (error) {
            console.error('Zustand persist: Error de hidratación', error);
          } else {
            console.log('Zustand persist: Hidratación completa. Estado cargado:', storedState);
            if (storedState) {
              if (storedState.user) {
                storedState.user = sanitizeUser(storedState.user)!;
              }
              if (storedState.users && Array.isArray(storedState.users)) {
                storedState.users = storedState.users.map(u => sanitizeUser(u)!);
              }
            }
            console.log('Zustand persist: Estado hidratado y saneado:', storedState);
          }
        };
      },
    }
  )
);