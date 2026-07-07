'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Client-side anti-cheating monitor.
 * Every suspicious event is reported to the server via `onViolation`,
 * which is expected to POST to /api/public/attempt/:id/violation and
 * return { autoSubmitted }. If the server says the violation limit was
 * hit, `onAutoSubmitted` fires so the page can redirect to the result screen.
 *
 * NOTE: no client-side protection is 100% unbeatable — the point is to
 * deter casual cheating and give the admin a transparent, timestamped log.
 */
export function useAntiCheat({ active, onViolation, onAutoSubmitted }) {
  const lastReportRef = useRef({});

  const report = useCallback(
    (type, detail = '') => {
      if (!active) return;
      // Debounce identical violation types fired within 800ms (e.g. duplicate blur events)
      const now = Date.now();
      const last = lastReportRef.current[type] || 0;
      if (now - last < 800) return;
      lastReportRef.current[type] = now;

      onViolation?.(type, detail).then((res) => {
        if (res?.autoSubmitted) onAutoSubmitted?.();
      });
    },
    [active, onViolation, onAutoSubmitted]
  );

  const requestFullscreen = useCallback(() => {
    const el = document.documentElement;
    const req =
      el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (req) req.call(el).catch(() => {});
  }, []);

  useEffect(() => {
    if (!active) return undefined;

    function isFullscreen() {
      return !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );
    }

    function handleVisibility() {
      if (document.hidden) report('tab_switch', 'Tab/window switched or minimized');
    }

    function handleBlur() {
      report('window_blur', 'Window lost focus');
    }

    function handleFullscreenChange() {
      if (!isFullscreen()) report('fullscreen_exit', 'Exited fullscreen mode');
    }

    function handleContextMenu(e) {
      e.preventDefault();
      report('right_click', 'Right-click attempted');
    }

    function handleCopy(e) {
      e.preventDefault();
      report('copy_attempt', 'Copy attempted');
    }

    function handlePaste(e) {
      e.preventDefault();
      report('paste_attempt', 'Paste attempted');
    }

    function handleCut(e) {
      e.preventDefault();
      report('cut_attempt', 'Cut attempted');
    }

    function handleKeyDown(e) {
      const blockedCombos =
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key)) ||
        (e.ctrlKey && ['u', 'U', 'p', 'P', 's', 'S'].includes(e.key)) ||
        e.key === 'PrintScreen';

      if (blockedCombos) {
        e.preventDefault();
        report('devtools_shortcut', `Blocked key combo: ${e.key}`);
      }
    }

    function handleBeforeUnload(e) {
      e.preventDefault();
      e.returnValue = '';
    }

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [active, report]);

  return { requestFullscreen };
}
