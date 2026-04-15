/**
 * Lightweight form validation hook (no external dependency).
 *
 * - Field-level validation on blur
 * - Clears errors on change
 * - Error summary support
 * - Bilingual messages
 */

import { useState, useCallback, useRef } from "react";

/* ─── Types ─── */

export interface FieldRule {
  /** Validation test — return true if valid */
  test: (value: string) => boolean;
  messageEn: string;
  messageAr: string;
}

export interface FieldConfig {
  rules: FieldRule[];
}

export type FieldErrors = Record<string, string | undefined>;

interface UseFormValidationOptions<T extends Record<string, string>> {
  fields: Record<keyof T, FieldConfig>;
  isAr: boolean;
}

/* ─── Built-in rule factories ─── */

export const rules = {
  required: (labelEn: string, labelAr: string): FieldRule => ({
    test: (v) => v.trim().length > 0,
    messageEn: `${labelEn} is required`,
    messageAr: `${labelAr} مطلوب`,
  }),

  email: (): FieldRule => ({
    test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    messageEn: "Please enter a valid email address",
    messageAr: "يرجى إدخال بريد إلكتروني صحيح",
  }),

  minLength: (min: number): FieldRule => ({
    test: (v) => v.trim().length >= min,
    messageEn: `Must be at least ${min} characters`,
    messageAr: `يجب أن يكون ${min} أحرف على الأقل`,
  }),

  maxLength: (max: number): FieldRule => ({
    test: (v) => v.trim().length <= max,
    messageEn: `Must be ${max} characters or less`,
    messageAr: `يجب ألا يتجاوز ${max} حرفاً`,
  }),

  phone: (): FieldRule => ({
    test: (v) => !v.trim() || /^\+?[0-9\s\-()]{7,20}$/.test(v.trim()),
    messageEn: "Please enter a valid phone number",
    messageAr: "يرجى إدخال رقم هاتف صحيح",
  }),

  url: (): FieldRule => ({
    test: (v) => {
      if (!v.trim()) return true;
      try { new URL(v.startsWith("http") ? v : `https://${v}`); return true; } catch { return false; }
    },
    messageEn: "Please enter a valid URL",
    messageAr: "يرجى إدخال رابط صحيح",
  }),
};

/* ─── Hook ─── */

export function useFormValidation<T extends Record<string, string>>(
  opts: UseFormValidationOptions<T>,
) {
  const { fields, isAr } = opts;
  const [errors, setErrors] = useState<FieldErrors>({});
  const touchedRef = useRef<Set<string>>(new Set());

  /** Validate a single field, return error message or undefined */
  const validateField = useCallback(
    (name: keyof T, value: string): string | undefined => {
      const config = fields[name];
      if (!config) return undefined;
      for (const rule of config.rules) {
        if (!rule.test(value)) {
          return isAr ? rule.messageAr : rule.messageEn;
        }
      }
      return undefined;
    },
    [fields, isAr],
  );

  /** Call on blur — validates and shows error */
  const onBlur = useCallback(
    (name: keyof T, value: string) => {
      touchedRef.current.add(name as string);
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    [validateField],
  );

  /** Call on change — clears error for that field */
  const onChange = useCallback((name: keyof T) => {
    setErrors((prev) => {
      if (!prev[name as string]) return prev;
      return { ...prev, [name]: undefined };
    });
  }, []);

  /** Validate all fields at once (on submit). Returns true if valid */
  const validateAll = useCallback(
    (values: T): boolean => {
      const newErrors: FieldErrors = {};
      let valid = true;
      for (const name of Object.keys(fields) as (keyof T)[]) {
        touchedRef.current.add(name as string);
        const error = validateField(name, values[name]);
        if (error) {
          newErrors[name as string] = error;
          valid = false;
        }
      }
      setErrors(newErrors);
      return valid;
    },
    [fields, validateField],
  );

  /** List of current error messages (for summary) */
  const errorList = Object.values(errors).filter(Boolean) as string[];

  /** Reset all errors and touched state */
  const resetErrors = useCallback(() => {
    setErrors({});
    touchedRef.current.clear();
  }, []);

  return {
    errors,
    errorList,
    onBlur,
    onChange,
    validateAll,
    resetErrors,
    /** Check if a specific field has an error */
    hasError: (name: keyof T) => !!errors[name as string],
    /** Get the error message for a specific field */
    getError: (name: keyof T) => errors[name as string],
  };
}
