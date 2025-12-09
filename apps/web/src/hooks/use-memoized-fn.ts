import { useRef } from "react";

/**
 * Stable callback hook similar to ahooks' useMemoizedFn.
 * - Always returns the same function reference.
 * - Inside it always calls the latest `fn`.
 */
export function useMemoizedFn<T extends (...args: any[]) => any>(
  fn: T
): T {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const memoRef = useRef<T>();
  if (!memoRef.current) {
    memoRef.current = ((...args: Parameters<T>) =>
      fnRef.current(...args)) as T;
  }
  return memoRef.current;
}
