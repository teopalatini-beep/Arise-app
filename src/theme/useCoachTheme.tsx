/**
 * useCoachTheme — inyección global del tema del coach activo.
 *
 * CoachThemeProvider lee el coach elegido del usuario (AppContext) y expone su
 * CoachTheme a todo el árbol. Cualquier pantalla (Misiones, Diario, Progreso,
 * Calendario) consume useCoachTheme() y muta su UI según el sensei.
 */
import React, { createContext, useContext, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CoachTheme, getCoachTheme } from './coachThemes';

const CoachThemeContext = createContext<CoachTheme>(getCoachTheme('goku'));

export function CoachThemeProvider({ children }: { children: React.ReactNode }) {
  const { data } = useApp();
  const coachId = data?.user.preferredCoachId;
  const theme = useMemo(() => getCoachTheme(coachId), [coachId]);
  return (
    <CoachThemeContext.Provider value={theme}>
      {children}
    </CoachThemeContext.Provider>
  );
}

/** Devuelve el CoachTheme del coach activo. Reactivo al cambio de sensei. */
export function useCoachTheme(): CoachTheme {
  return useContext(CoachThemeContext);
}
