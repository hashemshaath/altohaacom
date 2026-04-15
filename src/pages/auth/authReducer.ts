/**
 * Centralized state management for authentication.
 * Replaces 38 individual useState calls with a single useReducer.
 */
export type SignUpStep = "contact" | "verify" | "details" | "credentials";
export type SignUpMethod = "phone" | "email";
export type SignInMethod = "phone" | "email";

export const DEFAULT_COUNTRY = "SA";
export const DEFAULT_PHONE_CODE = "+966";

export interface AuthState {
  // Sign-in
  signInMethod: SignInMethod;
  signInPhone: string;
  signInPhoneCode: string;
  signInCountry: string;
  signInEmail: string;
  signInPassword: string;
  signInPhoneStep: "phone" | "otp" | "password" | "pin";
  signInVerifiedPhone: string;
  signInPin: string;
  pinAvailable: boolean;
  pinError: string;

  // Sign-up
  signUpStep: SignUpStep;
  signUpMethod: SignUpMethod;
  phoneInput: string;
  emailInput: string;
  countryCode: string;
  phoneCode: string;
  verifiedPhone: string;
  verifiedEmail: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  usernameStatus: "idle" | "checking" | "available" | "taken";
  termsAccepted: boolean;
  manualRefCode: string;
  accountType: "professional" | "fan";

  // Reset
  resetPassword: string;
  resetConfirm: string;
  resetSuccess: boolean;

  // Dialogs
  forgotOpen: boolean;

  // General
  loading: boolean;
  errors: Record<string, string>;
  formError: string;
  loginAttempts: number;
  lockoutUntil: number | null;
}

export const initialAuthState: AuthState = {
  signInMethod: "phone",
  signInPhone: "", signInPhoneCode: DEFAULT_PHONE_CODE, signInCountry: DEFAULT_COUNTRY,
  signInEmail: "", signInPassword: "",
  signInPhoneStep: "phone", signInVerifiedPhone: "", signInPin: "",
  pinAvailable: false, pinError: "",

  signUpStep: "contact", signUpMethod: "phone",
  phoneInput: "", emailInput: "",
  countryCode: DEFAULT_COUNTRY, phoneCode: DEFAULT_PHONE_CODE,
  verifiedPhone: "", verifiedEmail: "",
  fullName: "", email: "", password: "", confirmPassword: "",
  username: "", usernameStatus: "idle",
  termsAccepted: false, manualRefCode: "", accountType: "fan",

  resetPassword: "", resetConfirm: "", resetSuccess: false,
  forgotOpen: false,
  loading: false, errors: {}, formError: "",
  loginAttempts: 0, lockoutUntil: null,
};

export type AuthAction =
  | { type: "SET_FIELD"; field: keyof AuthState; value: unknown }
  | { type: "SET_ERRORS"; errors: Record<string, string> }
  | { type: "CLEAR_ERRORS" }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "LOGIN_FAILED"; lockoutUntil?: number }
  | { type: "LOGIN_SUCCESS" }
  | { type: "RESET_SIGNUP" }
  | { type: "RESET_SIGNIN_PHONE" };

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };

    case "SET_ERRORS":
      return { ...state, errors: action.errors };

    case "CLEAR_ERRORS":
      return { ...state, errors: {}, formError: "" };

    case "SET_LOADING":
      return { ...state, loading: action.loading };

    case "LOGIN_FAILED": {
      const newAttempts = state.loginAttempts + 1;
      return {
        ...state,
        loginAttempts: action.lockoutUntil ? 0 : newAttempts,
        lockoutUntil: action.lockoutUntil ?? state.lockoutUntil,
      };
    }

    case "LOGIN_SUCCESS":
      return { ...state, loginAttempts: 0, lockoutUntil: null, loading: false };

    case "RESET_SIGNUP":
      return { ...state, signUpStep: "contact", errors: {}, formError: "" };

    case "RESET_SIGNIN_PHONE":
      return { ...state, signInPhoneStep: "phone", loading: false };

    default:
      return state;
  }
}
