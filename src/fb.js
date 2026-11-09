/* Capa Firebase (se empaqueta con esbuild en dist/nexo-firebase.js). Sin lógica de pantallas: solo SDK + operaciones públicas. */
import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserSessionPersistence, signInWithEmailAndPassword, signOut, onAuthStateChanged, connectAuthEmulator, updatePassword, reauthenticateWithCredential, EmailAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { initializeFirestore, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, orderBy, limit, where, serverTimestamp, runTransaction, arrayUnion, writeBatch, connectFirestoreEmulator } from 'firebase/firestore';

const cfg = window.FIREBASE_CONFIG;
if (!cfg) throw new Error('Falta FIREBASE_CONFIG (backend.js)');
const app = initializeApp(cfg);
const auth = getAuth(app);
const db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
const emu = window.FIREBASE_EMULATORS;
if (emu) { connectAuthEmulator(auth, emu.auth, { disableWarnings: true }); connectFirestoreEmulator(db, emu.firestore.host, emu.firestore.port); }

/* Formulario público: único dato que el público puede escribir (las reglas lo restringen y no permiten leer nada). */
async function crearConsulta(id, d) {
  await setDoc(doc(db, 'consultas', id), {
    nombre: d.nombre, email: d.email, telefono: d.telefono, area: d.area, canal: 'formulario', estado: 'nueva', responsable: null,
    manual: false, idioma: d.idioma, consentimiento: { aceptado: true, version: d.version },
    createdAt: serverTimestamp(), actualizadoAt: serverTimestamp(),
    historial: [{ at: Date.now(), quien: 'Sistema', texto: 'Consulta recibida por formulario web.' }], notas: []
  });
}

/* Contenido publicado (lectura pública). Devuelve { seccion: { clave: {es, en} } } */
async function cargarContenido() {
  const snap = await getDocs(collection(db, 'contenido_publicado'));
  const out = {};
  snap.forEach((d) => { out[d.id] = (d.data() || {}).campos || {}; });
  return out;
}

window.NexoFB = {
  app, auth, db, crearConsulta, cargarContenido,
  setPersistence, browserSessionPersistence, signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword, reauthenticateWithCredential, EmailAuthProvider, sendPasswordResetEmail,
  doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, orderBy, limit, where, serverTimestamp, runTransaction, arrayUnion, writeBatch
};
