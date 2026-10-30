import { useCallback, useRef, useState } from 'react';
export function useSelection<T>() {
  const [selection, setSelection] = useState<T | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const select = useCallback((value: T) => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelection(value);
  }, []);
  const close = useCallback(() => {
    setSelection(null);
    requestAnimationFrame(() => {
      const target = opener.current?.isConnected
        ? opener.current
        : document.querySelector<HTMLElement>('main button');
      target?.focus();
    });
  }, []);
  return { selection, select, close };
}
