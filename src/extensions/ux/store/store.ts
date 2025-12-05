import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import moveReducer from './moveSlice';
import partyReducer from './partySlice';
import setReducer from './setSlice';
import syncStorage from './syncStorage';

/**
 * Redux persist configuration
 * Uses sync storage (chrome.storage.sync) when available for cross-device sync,
 * falls back to localStorage otherwise
 */
const persistConfig = {
  key: 'root',
  storage: syncStorage,
};

const persistedMoveReducer = persistReducer(persistConfig, moveReducer);
const persistedSetReducer = persistReducer({ ...persistConfig, key: 'set' }, setReducer);
const persistedPartyReducer = persistReducer({ ...persistConfig, key: 'party' }, partyReducer);

/**
 * Configure the Redux store with persistence
 */
export const store = configureStore({
  reducer: {
    move: persistedMoveReducer,
    set: persistedSetReducer,
    party: persistedPartyReducer,
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
