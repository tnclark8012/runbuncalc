import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import syncStorage from './syncStorage';
import moveReducer from './moveSlice';

/**
 * Redux persist configuration
 * Uses sync storage (chrome.storage.sync) when available for cross-device sync,
 * falls back to localStorage otherwise
 */
const persistConfig = {
  key: 'root',
  storage: syncStorage,
};

const persistedReducer = persistReducer(persistConfig, moveReducer);

/**
 * Configure the Redux store with persistence
 */
export const store = configureStore({
  reducer: {
    move: persistedReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/FLUSH',
          'persist/PAUSE',
          'persist/PURGE',
          'persist/REGISTER',
        ],
      },
    }),
});

export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
