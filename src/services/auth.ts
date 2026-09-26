import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import { setDriveAccessToken } from './googleDrive';

export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

export interface AppUser {
  uid: string;
  email: string | null;
  phoneNumber?: string | null;
  displayName: string | null;
  isDemo?: boolean;
}

export interface RegisterCredentials {
  email?: string;
  phone?: string;
  password: string;
  displayName?: string;
}

const LOCAL_STORAGE_DEMO_USER_KEY = 'moneyflow_demo_user';

export function sanitizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

export async function loginWithGoogle(
  customPhone?: string,
  customName?: string
): Promise<AppUser> {
  if (isFirebaseConfigured && auth) {
    const provider = new GoogleAuthProvider();
    SCOPES.forEach((scope) => provider.addScope(scope));
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      setDriveAccessToken(credential.accessToken);
    }

    const displayName = customName || user.displayName || user.email?.split('@')[0] || 'User';
    const cleanPhone = customPhone ? sanitizePhoneDigits(customPhone) : '';

    if (customName && (!user.displayName || user.displayName !== customName)) {
      try {
        await updateProfile(user, { displayName: customName });
      } catch (err) {
        console.warn('Could not update Google user profile:', err);
      }
    }

    if (db) {
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          {
            uid: user.uid,
            email: user.email,
            displayName,
            phoneNumber: customPhone || user.phoneNumber || null,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        if (cleanPhone) {
          await setDoc(
            doc(db, 'phone_index', cleanPhone),
            {
              email: user.email,
              uid: user.uid,
              phone: customPhone || cleanPhone,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );

          if (cleanPhone.startsWith('880') && cleanPhone.length > 3) {
            await setDoc(
              doc(db, 'phone_index', '0' + cleanPhone.slice(3)),
              { email: user.email, uid: user.uid, phone: customPhone || cleanPhone },
              { merge: true }
            );
          } else if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
            await setDoc(
              doc(db, 'phone_index', '88' + cleanPhone),
              { email: user.email, uid: user.uid, phone: customPhone || cleanPhone },
              { merge: true }
            );
          }
        }
      } catch (err) {
        console.warn('Could not sync Google user profile to Firestore:', err);
      }
    }

    return {
      uid: user.uid,
      email: user.email,
      phoneNumber: customPhone || user.phoneNumber || null,
      displayName,
      isDemo: false,
    };
  }

  // Local fallback
  const demoUser: AppUser = {
    uid: 'google-demo-user',
    email: 'user@gmail.com',
    displayName: customName || 'Google User',
    phoneNumber: customPhone || null,
    isDemo: true,
  };
  localStorage.setItem(LOCAL_STORAGE_DEMO_USER_KEY, JSON.stringify(demoUser));
  return demoUser;
}

export async function registerWithCredentials(
  creds: RegisterCredentials
): Promise<AppUser> {
  const { email, phone, password, displayName } = creds;
  const cleanPhone = phone ? sanitizePhoneDigits(phone) : '';

  // Determine primary email for Firebase Auth
  let primaryEmail = email ? email.trim().toLowerCase() : '';
  if (!primaryEmail && cleanPhone) {
    primaryEmail = `${cleanPhone}@phone.moneyflow.app`;
  }

  if (!primaryEmail) {
    throw new Error('Please provide an email address or phone number to register.');
  }

  if (isFirebaseConfigured && auth) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, primaryEmail, password);
      const user = userCredential.user;

      if (displayName && user) {
        try {
          await updateProfile(user, { displayName });
        } catch (err) {
          console.warn('Could not update profile display name:', err);
        }
      }

      // Record user profile in Firestore
      if (db) {
        try {
          await setDoc(
            doc(db, 'users', user.uid),
            {
              uid: user.uid,
              email: primaryEmail,
              phoneNumber: phone || cleanPhone || null,
              displayName: displayName || null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );

          // Record phone index so user can log in from any device using their phone number
          if (cleanPhone) {
            await setDoc(
              doc(db, 'phone_index', cleanPhone),
              {
                email: primaryEmail,
                uid: user.uid,
                phone: phone || cleanPhone,
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            );

            // Handle common country code prefixes (e.g. Bangladesh +880 vs 01...)
            if (cleanPhone.startsWith('880') && cleanPhone.length > 3) {
              await setDoc(
                doc(db, 'phone_index', '0' + cleanPhone.slice(3)),
                { email: primaryEmail, uid: user.uid, phone: phone || cleanPhone },
                { merge: true }
              );
            } else if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
              await setDoc(
                doc(db, 'phone_index', '88' + cleanPhone),
                { email: primaryEmail, uid: user.uid, phone: phone || cleanPhone },
                { merge: true }
              );
            }
          }
        } catch (err) {
          console.warn('Could not write user profile/phone index to Firestore:', err);
        }
      }

      return {
        uid: user.uid,
        email: user.email,
        phoneNumber: phone || null,
        displayName: displayName || user.displayName,
        isDemo: false,
      };
    } catch (createErr: any) {
      if (
        createErr?.code === 'auth/operation-not-allowed' ||
        createErr?.message?.includes('operation-not-allowed')
      ) {
        const error = new Error(
          'Email/Password registration is disabled in this Firebase project (auth/operation-not-allowed). Please use "Continue with Google" above to sign in instantly, or enable Email/Password in Firebase Console.'
        );
        (error as any).code = 'auth/operation-not-allowed';
        throw error;
      }
      throw createErr;
    }
  }

  // Local demo fallback
  const demoUser: AppUser = {
    uid: 'demo-user-123',
    email: primaryEmail,
    phoneNumber: phone || null,
    displayName: displayName || primaryEmail.split('@')[0],
    isDemo: true,
  };
  localStorage.setItem(LOCAL_STORAGE_DEMO_USER_KEY, JSON.stringify(demoUser));
  return demoUser;
}

export async function registerWithEmail(
  email: string,
  pass: string,
  displayName?: string
): Promise<AppUser> {
  return registerWithCredentials({
    email,
    password: pass,
    displayName,
  });
}

export async function loginWithCredentials(
  identifier: string,
  pass: string
): Promise<AppUser> {
  const trimmed = identifier.trim();

  if (isFirebaseConfigured && auth) {
    let emailToAuth = trimmed.toLowerCase();

    // Check if user entered a phone number instead of an email address
    const isPhone = !trimmed.includes('@') && /^\+?[\d\s\-()]+$/.test(trimmed);

    if (isPhone) {
      const cleanPhone = sanitizePhoneDigits(trimmed);
      emailToAuth = `${cleanPhone}@phone.moneyflow.app`;

      // Check phone lookup index in Firestore to see if this phone is registered to an email
      if (db) {
        try {
          const directSnap = await getDoc(doc(db, 'phone_index', cleanPhone));
          if (directSnap.exists() && directSnap.data().email) {
            emailToAuth = directSnap.data().email;
          } else if (cleanPhone.startsWith('0')) {
            const intlSnap = await getDoc(doc(db, 'phone_index', '88' + cleanPhone));
            if (intlSnap.exists() && intlSnap.data().email) {
              emailToAuth = intlSnap.data().email;
            }
          } else if (cleanPhone.startsWith('880')) {
            const localSnap = await getDoc(doc(db, 'phone_index', '0' + cleanPhone.slice(3)));
            if (localSnap.exists() && localSnap.data().email) {
              emailToAuth = localSnap.data().email;
            }
          }
        } catch (err) {
          console.warn('Could not query phone index:', err);
        }
      }
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, emailToAuth, pass);
      const user = userCredential.user;

      // Check Firestore user doc for profile & phone
      let userPhone: string | null = null;
      let userName = user.displayName;
      if (db) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            userPhone = data.phoneNumber || null;
            userName = data.displayName || userName;
          }
        } catch {
          // Non-blocking
        }
      }

      return {
        uid: user.uid,
        email: user.email,
        phoneNumber: userPhone,
        displayName: userName,
        isDemo: false,
      };
    } catch (authError: any) {
      // If phone login with looked-up email failed, try fallback with phone alias directly
      if (isPhone) {
        const cleanPhone = sanitizePhoneDigits(trimmed);
        const fallbackEmail = `${cleanPhone}@phone.moneyflow.app`;
        if (emailToAuth !== fallbackEmail) {
          const fallbackCred = await signInWithEmailAndPassword(auth, fallbackEmail, pass);
          return {
            uid: fallbackCred.user.uid,
            email: fallbackCred.user.email,
            displayName: fallbackCred.user.displayName,
            isDemo: false,
          };
        }
      }
      if (
        authError?.code === 'auth/operation-not-allowed' ||
        authError?.message?.includes('operation-not-allowed')
      ) {
        const err = new Error(
          'Email/Password sign-in is disabled in this Firebase project (auth/operation-not-allowed). Please sign in using "Continue with Google" above.'
        );
        (err as any).code = 'auth/operation-not-allowed';
        throw err;
      }
      throw authError;
    }
  }

  const demoUser: AppUser = {
    uid: 'demo-user-123',
    email: trimmed,
    displayName: trimmed.split('@')[0],
    isDemo: true,
  };
  localStorage.setItem(LOCAL_STORAGE_DEMO_USER_KEY, JSON.stringify(demoUser));
  return demoUser;
}

export async function loginWithEmail(email: string, pass: string): Promise<AppUser> {
  return loginWithCredentials(email, pass);
}

export async function logoutUser(): Promise<void> {
  if (isFirebaseConfigured && auth) {
    await signOut(auth);
  }
  setDriveAccessToken(null);
  localStorage.removeItem(LOCAL_STORAGE_DEMO_USER_KEY);
}

export async function resetPassword(email: string): Promise<void> {
  if (isFirebaseConfigured && auth) {
    await sendPasswordResetEmail(auth, email);
  }
}

export function loginWithLocalProfile(profile: {
  displayName?: string;
  email?: string;
  phoneNumber?: string;
}): AppUser {
  const localUser: AppUser = {
    uid: 'local-' + Date.now(),
    email: profile.email || 'user@moneyflow.local',
    displayName: profile.displayName || 'User',
    phoneNumber: profile.phoneNumber || null,
    isDemo: true,
  };
  localStorage.setItem(LOCAL_STORAGE_DEMO_USER_KEY, JSON.stringify(localUser));
  return localUser;
}

export function loginAsDemoUser(): AppUser {
  const defaultDemo: AppUser = {
    uid: 'demo-user-123',
    email: 'user@moneyflow.local',
    displayName: 'Demo User',
    isDemo: true,
  };
  localStorage.setItem(LOCAL_STORAGE_DEMO_USER_KEY, JSON.stringify(defaultDemo));
  return defaultDemo;
}

export function subscribeToAuthState(
  onUserChanged: (user: AppUser | null) => void
): () => void {
  if (isFirebaseConfigured && auth) {
    return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        let phone: string | null = null;
        let name = firebaseUser.displayName;

        if (db) {
          try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              phone = data.phoneNumber || null;
              name = data.displayName || name;
            }
          } catch {
            // Ignore offline/permission errors
          }
        }

        onUserChanged({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          phoneNumber: phone,
          displayName: name,
          isDemo: false,
        });
      } else {
        // Check if demo user is stored
        const savedDemo = localStorage.getItem(LOCAL_STORAGE_DEMO_USER_KEY);
        if (savedDemo) {
          try {
            onUserChanged(JSON.parse(savedDemo));
            return;
          } catch {
            localStorage.removeItem(LOCAL_STORAGE_DEMO_USER_KEY);
          }
        }
        onUserChanged(null);
      }
    });
  }

  // If Firebase is not configured, check local storage demo user
  const savedDemo = localStorage.getItem(LOCAL_STORAGE_DEMO_USER_KEY);
  if (savedDemo) {
    try {
      onUserChanged(JSON.parse(savedDemo));
    } catch {
      onUserChanged({
        uid: 'demo-user-123',
        email: 'user@moneyflow.local',
        displayName: 'Demo User',
        isDemo: true,
      });
    }
  } else {
    const defaultDemo: AppUser = {
      uid: 'demo-user-123',
      email: 'user@moneyflow.local',
      displayName: 'Demo User',
      isDemo: true,
    };
    localStorage.setItem(LOCAL_STORAGE_DEMO_USER_KEY, JSON.stringify(defaultDemo));
    onUserChanged(defaultDemo);
  }

  return () => {};
}
