import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import app, { auth, db, storage } from '../../services/firebase';

// Mock Firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn()
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn()
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn()
}));

describe('Firebase Service', () => {
  const mockApp = { name: 'mock-app' };
  const mockAuth = { signInWithEmailAndPassword: jest.fn() };
  const mockDb = { collection: jest.fn() };
  const mockStorage = { ref: jest.fn() };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup mock implementations
    (initializeApp as jest.Mock).mockReturnValue(mockApp);
    (getAuth as jest.Mock).mockReturnValue(mockAuth);
    (getFirestore as jest.Mock).mockReturnValue(mockDb);
    (getStorage as jest.Mock).mockReturnValue(mockStorage);
  });

  describe('Firebase Initialization', () => {
    it('initializes Firebase with correct config', () => {
      // Verify that initializeApp was called with the correct config
      expect(initializeApp).toHaveBeenCalledWith({
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.REACT_APP_FIREBASE_APP_ID
      });
    });

    it('exports the initialized Firebase app', () => {
      expect(app).toBe(mockApp);
    });
  });

  describe('Firebase Services', () => {
    it('exports auth service', () => {
      expect(auth).toBe(mockAuth);
      expect(getAuth).toHaveBeenCalledWith(mockApp);
    });

    it('exports firestore service', () => {
      expect(db).toBe(mockDb);
      expect(getFirestore).toHaveBeenCalledWith(mockApp);
    });

    it('exports storage service', () => {
      expect(storage).toBe(mockStorage);
      expect(getStorage).toHaveBeenCalledWith(mockApp);
    });
  });

  describe('Environment Variables', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      // Reset process.env after each test
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      // Restore original process.env
      process.env = originalEnv;
    });

    it('throws error when API key is missing', () => {
      // Temporarily remove the API key
      process.env.REACT_APP_FIREBASE_API_KEY = undefined;

      // Re-import the firebase service to trigger the check
      jest.isolateModules(() => {
        expect(() => {
          require('../../services/firebase');
        }).toThrow('Firebase API Key saknas i miljövariablerna');
      });
    });

    it('initializes successfully when all environment variables are present', () => {
      // Set all required environment variables
      process.env.REACT_APP_FIREBASE_API_KEY = 'test-api-key';
      process.env.REACT_APP_FIREBASE_AUTH_DOMAIN = 'test-auth-domain';
      process.env.REACT_APP_FIREBASE_PROJECT_ID = 'test-project-id';
      process.env.REACT_APP_FIREBASE_STORAGE_BUCKET = 'test-storage-bucket';
      process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID = 'test-sender-id';
      process.env.REACT_APP_FIREBASE_APP_ID = 'test-app-id';

      // Re-import the firebase service
      jest.isolateModules(() => {
        const firebaseService = require('../../services/firebase');
        expect(firebaseService.default).toBeDefined();
        expect(firebaseService.auth).toBeDefined();
        expect(firebaseService.db).toBeDefined();
        expect(firebaseService.storage).toBeDefined();
      });
    });
  });
}); 