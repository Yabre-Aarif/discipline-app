import { useApp } from "./AppContext";
import { api } from "../api/client";
import { todayKey } from "../utils/date";

// Bridges the local-first reducer with the Airtable-backed API: mutations on
// records that already have a real (server) id apply optimistically and
// sync in the background; creating a new daily/goal has no id to be
// optimistic about, so it waits for the server's record before touching
// state at all.
export function useSyncActions() {
  const { state, dispatch } = useApp();
  const token = state.authToken;

  async function signup(name: string, email: string, password: string) {
    const res = await api.signup({
      name,
      email,
      password,
      dailies: state.dailies.map((d) => ({ label: d.label, target: d.target })),
      goals: state.goals.map((g) => ({ label: g.label, target: g.target })),
    });
    dispatch({ type: "AUTH_SUCCESS", payload: res });
  }

  async function login(email: string, password: string) {
    const res = await api.login({ email, password });
    dispatch({ type: "LOGIN_SUCCESS", payload: res });
  }

  async function startCycle() {
    if (!token) throw new Error("Session manquante.");
    const res = await api.startCycle(token, {
      dailies: state.dailies.map((d) => ({ label: d.label, target: d.target })),
      goals: state.goals.map((g) => ({ label: g.label, target: g.target })),
    });
    dispatch({ type: "AUTH_SUCCESS", payload: { token, user: state.user, ...res } });
  }

  async function addDaily(label: string, target?: string) {
    if (token) {
      const daily = await api.createDaily(token, { label, target });
      dispatch({ type: "ADD_DAILY_RECORD", daily });
    } else {
      dispatch({ type: "ADD_DAILY", label, target });
    }
  }

  // Renaming/retargeting dispatches locally on every keystroke (unchanged,
  // instant); the caller fires this separately — typically on blur — so we
  // sync once per edit instead of once per character.
  function syncDaily(id: string, patch: { label?: string; target?: string }) {
    if (token) api.updateDaily(token, id, patch).catch(console.error);
  }

  function removeDaily(id: string) {
    dispatch({ type: "REMOVE_DAILY", id });
    if (token) api.deleteDaily(token, id).catch(console.error);
  }

  async function addGoal(label: string, target?: string) {
    if (token) {
      const goal = await api.createGoal(token, { label, target });
      dispatch({ type: "ADD_GOAL_RECORD", goal });
    } else {
      dispatch({ type: "ADD_GOAL", label, target });
    }
  }

  function syncGoal(id: string, patch: { label?: string; target?: string }) {
    if (token) api.updateGoal(token, id, patch).catch(console.error);
  }

  function removeGoal(id: string) {
    dispatch({ type: "REMOVE_GOAL", id });
    if (token) api.deleteGoal(token, id).catch(console.error);
  }

  function toggleDailyToday(id: string) {
    const key = todayKey();
    const wasDone = !!state.history[key]?.[id];
    dispatch({ type: "TOGGLE_DAILY_TODAY", id });
    if (token) api.upsertCheckin(token, { dailyId: id, date: key, done: !wasDone }).catch(console.error);
  }

  function setUserField(field: "name" | "email", value: string) {
    dispatch({ type: "SET_USER_FIELD", field, value });
  }

  function syncUserField(field: "name" | "email", value: string) {
    if (token) api.updateUser(token, { [field]: value }).catch(console.error);
  }

  async function reset() {
    if (token) await api.reset(token);
    dispatch({ type: "RESET_CYCLE" });
  }

  function logout() {
    dispatch({ type: "LOGOUT" });
  }

  return {
    signup,
    login,
    startCycle,
    addDaily,
    syncDaily,
    removeDaily,
    addGoal,
    syncGoal,
    removeGoal,
    toggleDailyToday,
    setUserField,
    syncUserField,
    reset,
    logout,
  };
}
