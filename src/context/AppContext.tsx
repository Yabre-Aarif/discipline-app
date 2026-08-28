import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { AppState, Daily, Goal, History, INITIAL_STATE, User } from "./types";
import { loadState, saveState, makeId } from "../utils/storage";
import { todayKey } from "../utils/date";
import { api, ApiError } from "../api/client";

type AuthPayload = {
  token: string;
  user: User;
  cycleStartDate: string | null;
  sworn: boolean;
  dailies: Daily[];
  goals: Goal[];
  history: History;
};

type Action =
  | { type: "HYDRATE"; state: AppState }
  | { type: "SET_USER_FIELD"; field: keyof User; value: string }
  | { type: "ADD_DAILY"; label: string; target?: string }
  | { type: "ADD_DAILY_RECORD"; daily: Daily }
  | { type: "RENAME_DAILY"; id: string; label: string }
  | { type: "RETARGET_DAILY"; id: string; target: string }
  | { type: "REMOVE_DAILY"; id: string }
  | { type: "ADD_GOAL"; label: string; target?: string }
  | { type: "ADD_GOAL_RECORD"; goal: Goal }
  | { type: "RENAME_GOAL"; id: string; label: string }
  | { type: "RETARGET_GOAL"; id: string; target: string }
  | { type: "REMOVE_GOAL"; id: string }
  | { type: "TOGGLE_DAILY_TODAY"; id: string }
  | { type: "SET_SWORN"; sworn: boolean }
  | { type: "AUTH_SUCCESS"; payload: AuthPayload }
  | { type: "LOGIN_SUCCESS"; payload: AuthPayload }
  | { type: "FINISH_ONBOARDING" }
  | { type: "RESET_CYCLE" }
  | { type: "LOGOUT" };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "HYDRATE":
      return { ...action.state, hydrated: true };
    case "SET_USER_FIELD":
      return { ...state, user: { ...state.user, [action.field]: action.value } };
    case "ADD_DAILY": {
      const label = action.label.trim();
      if (!label) return state;
      const daily: Daily = {
        id: makeId(),
        label,
        target: action.target?.trim() || "à définir",
        createdDate: todayKey(),
      };
      return { ...state, dailies: [...state.dailies, daily] };
    }
    case "ADD_DAILY_RECORD":
      return { ...state, dailies: [...state.dailies, action.daily] };
    case "RENAME_DAILY":
      return { ...state, dailies: state.dailies.map((d) => (d.id === action.id ? { ...d, label: action.label } : d)) };
    case "RETARGET_DAILY":
      return { ...state, dailies: state.dailies.map((d) => (d.id === action.id ? { ...d, target: action.target } : d)) };
    case "REMOVE_DAILY":
      return { ...state, dailies: state.dailies.filter((d) => d.id !== action.id) };
    case "ADD_GOAL": {
      const label = action.label.trim();
      if (!label) return state;
      const goal: Goal = { id: makeId(), label, target: action.target?.trim() || "cible à chiffrer", pct: 0 };
      return { ...state, goals: [...state.goals, goal] };
    }
    case "ADD_GOAL_RECORD":
      return { ...state, goals: [...state.goals, action.goal] };
    case "RENAME_GOAL":
      return { ...state, goals: state.goals.map((g) => (g.id === action.id ? { ...g, label: action.label } : g)) };
    case "RETARGET_GOAL":
      return { ...state, goals: state.goals.map((g) => (g.id === action.id ? { ...g, target: action.target } : g)) };
    case "REMOVE_GOAL":
      return { ...state, goals: state.goals.filter((g) => g.id !== action.id) };
    case "TOGGLE_DAILY_TODAY": {
      const key = todayKey();
      const day = { ...(state.history[key] ?? {}) };
      day[action.id] = !day[action.id];
      return { ...state, history: { ...state.history, [key]: day } };
    }
    case "SET_SWORN":
      return { ...state, sworn: action.sworn };
    case "AUTH_SUCCESS":
      // Leaves onboardingComplete untouched: signup/startCycle need the
      // caller to still show a confirmation step before switching to the
      // main app (see FINISH_ONBOARDING). The background /me refresh on
      // launch also goes through here, where it should preserve whatever
      // onboardingComplete already was.
      return {
        ...state,
        authToken: action.payload.token,
        user: action.payload.user,
        cycleStartDate: action.payload.cycleStartDate,
        sworn: action.payload.sworn,
        dailies: action.payload.dailies,
        goals: action.payload.goals,
        history: action.payload.history,
      };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        onboardingComplete: true,
        authToken: action.payload.token,
        user: action.payload.user,
        cycleStartDate: action.payload.cycleStartDate,
        sworn: action.payload.sworn,
        dailies: action.payload.dailies,
        goals: action.payload.goals,
        history: action.payload.history,
      };
    case "FINISH_ONBOARDING":
      return { ...state, onboardingComplete: true };
    case "RESET_CYCLE":
      return {
        ...INITIAL_STATE,
        hydrated: true,
        onboardingComplete: false,
        authToken: state.authToken,
        user: state.user,
        sworn: false,
      };
    case "LOGOUT":
      return { ...INITIAL_STATE, hydrated: true };
    default:
      return state;
  }
}

type ContextValue = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
};

const AppContext = createContext<ContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  useEffect(() => {
    loadState<AppState>().then((saved) => {
      dispatch({ type: "HYDRATE", state: saved ?? INITIAL_STATE });
    });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    saveState(state);
  }, [state]);

  // Best-effort refresh from the server on launch, so a change made on
  // another device shows up here too. Never blocks the (already-hydrated)
  // local UI, and only signs out on a definitive 401 — a flaky network
  // should not kick the user back to the login screen.
  useEffect(() => {
    if (!state.hydrated || !state.authToken) return;
    api
      .me(state.authToken)
      .then((res) => {
        dispatch({ type: "AUTH_SUCCESS", payload: { token: state.authToken as string, ...res } });
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) dispatch({ type: "LOGOUT" });
      });
    // Only ever on hydration / login, not on every subsequent state change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.hydrated]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): ContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
