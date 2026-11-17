import { FirebaseError, initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export const SHEETS_SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const provider = new GoogleAuthProvider();
SHEETS_SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({ prompt: 'select_account' });

let isSigningIn = false;
// Access token is strictly cached in memory (never localStorage or sessionStorage)
let cachedAccessToken: string | null = null;

export type GoogleSignInResult =
  | { status: 'success'; user: User; accessToken: string }
  | { status: 'cancelled'; message: string }
  | { status: 'error'; message: string };

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        onAuthSuccess?.(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        onAuthFailure?.(user);
      }
    } else {
      cachedAccessToken = null;
      onAuthFailure?.(null);
    }
  });
};

export const googleSignIn = async (): Promise<GoogleSignInResult> => {
  if (isSigningIn) {
    return {
      status: 'cancelled',
      message: 'Ya hay una ventana de inicio de sesión abierta.',
    };
  }

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      return {
        status: 'error',
        message:
          'No se obtuvo el permiso de acceso para Google Sheets. Vuelve a intentarlo aceptando los permisos solicitados.',
      };
    }
    cachedAccessToken = credential.accessToken;
    return {
      status: 'success',
      user: result.user,
      accessToken: cachedAccessToken,
    };
  } catch (err: unknown) {
    if (err instanceof FirebaseError) {
      if (
        err.code === 'auth/popup-closed-by-user' ||
        err.code === 'auth/cancelled-popup-request'
      ) {
        return {
          status: 'cancelled',
          message:
            'Inicio de sesión cancelado. Cuando estés listo, presiona "Sign in with Google" para conectar Google Sheets.',
        };
      }
      if (err.code === 'auth/popup-blocked') {
        return {
          status: 'error',
          message:
            'El navegador bloqueó la ventana emergente de Google. Habilita las ventanas emergentes para este sitio e intenta de nuevo.',
        };
      }
      if (err.code === 'auth/network-request-failed') {
        return {
          status: 'error',
          message:
            'Error de conexión de red al autenticar con Google. Verifica tu conexión e inténtalo de nuevo.',
        };
      }
      return {
        status: 'error',
        message: `No se pudo completar el inicio de sesión (${err.code}).`,
      };
    }

    return {
      status: 'error',
      message:
        err instanceof Error
          ? err.message
          : 'Error inesperado al iniciar sesión con Google.',
    };
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => cachedAccessToken;

export const logout = async (): Promise<void> => {
  await auth.signOut();
  cachedAccessToken = null;
};
