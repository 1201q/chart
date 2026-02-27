'use client';

import { createContext, useContext } from 'react';

export const AuthenticatedContext = createContext<boolean>(false);

export function useIsAuthenticated(): boolean {
  return useContext(AuthenticatedContext);
}
