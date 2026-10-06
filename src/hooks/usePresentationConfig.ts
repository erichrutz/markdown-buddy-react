// Loads /presentation/config.json, validates it, and exposes the resolved
// active header/footer templates. Any failure falls back to DEFAULT_CONFIG
// with a console.warn (spec §6).

import { useEffect, useState } from 'react';
import { ResolvedPresentationConfig } from '../types/presentation';
import {
  DEFAULT_CONFIG,
  parseConfig,
  resolveConfig,
} from '../utils/presentationConfig';

// Respect Vite's base path so the config also loads when deployed under a subpath (GitHub Pages).
const configFile = import.meta.env.VITE_BRAND === 'db' ? 'config.db.json' : 'config.json';
const CONFIG_URL = `${import.meta.env.BASE_URL}presentation/${configFile}`;

export const usePresentationConfig = (): ResolvedPresentationConfig => {
  const [resolved, setResolved] = useState<ResolvedPresentationConfig>(() =>
    resolveConfig(DEFAULT_CONFIG),
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(CONFIG_URL, { cache: 'no-cache' });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const raw = await res.json();
        const config = parseConfig(raw);
        if (!cancelled) setResolved(resolveConfig(config));
      } catch (err) {
        console.warn(
          `Presentation config unavailable (${CONFIG_URL}); using built-in default.`,
          err,
        );
        if (!cancelled) setResolved(resolveConfig(DEFAULT_CONFIG));
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return resolved;
};
