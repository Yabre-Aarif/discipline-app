export type Daily = {
  id: string;
  label: string;
  target: string;
  createdDate: string; // YYYY-MM-DD, cycle day this daily became active
};

export type Goal = {
  id: string;
  label: string;
  target: string;
  pct: number; // 0-100, set by the user via the target description
};

// dateKey (YYYY-MM-DD) -> dailyId -> done
export type History = Record<string, Record<string, boolean>>;

// Password never lives in app state — it's only ever held locally in the
// signup/login form and sent straight to the server, which stores a bcrypt
// hash in Airtable. Never persisted to AsyncStorage.
export type User = {
  name: string;
  email: string;
};

export type AppState = {
  hydrated: boolean;
  onboardingComplete: boolean;
  authToken: string | null;
  user: User;
  cycleStartDate: string | null; // YYYY-MM-DD
  dailies: Daily[];
  goals: Goal[];
  history: History;
  sworn: boolean;
};

export const INITIAL_STATE: AppState = {
  hydrated: false,
  onboardingComplete: false,
  authToken: null,
  user: { name: "", email: "" },
  cycleStartDate: null,
  dailies: [],
  goals: [],
  history: {},
  sworn: false,
};
