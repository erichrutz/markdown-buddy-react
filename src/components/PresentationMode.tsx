import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Box, Slider } from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  MyLocation,
  LightMode,
  DarkMode,
  Close,
  South,
  FormatListBulleted,
  AspectRatio,
} from '@mui/icons-material';
import { StageTokens, SurroundTokens, BRAND } from '../theme/designTokens';
import { Section } from '../utils/sectionParser';
import { paginateBlocks } from '../utils/slidePagination';
import { SlideBand } from './SlideBand';
import { BandTemplate, PresentationDefaults, TokenContext } from '../types/presentation';

interface PresentationModeProps {
  sections: Section[];
  presIndex: number;
  onPresIndexChange: (i: number) => void;
  pointer: boolean;
  onTogglePointer: () => void;
  presTheme: 'light' | 'dark';
  onTogglePresTheme: () => void;
  onStop: () => void;
  pc: StageTokens;
  surround: SurroundTokens;
  fileName: string;
  documentTitle: string;
  skipped: number[];
  headerTemplate: BandTemplate;
  footerTemplate: BandTemplate;
  presDefaults: PresentationDefaults;
  author: string;
  onReanchorMarks?: (
    resolveBlock: (blockIndex: number) => Element | null,
    sectionIndex: number,
  ) => void;
  onRemoveMarkAtPoint?: (x: number, y: number) => boolean;
  onMermaidProcess?: (container: HTMLElement) => void;
  onPlantUMLProcess?: (container: HTMLElement) => Promise<void>;
}

const EASE = 'cubic-bezier(.4,0,.2,1)';

const STAGE_WIDTH_MIN = 1000;
const STAGE_WIDTH_MAX = 2400;
const STAGE_WIDTH_STEP = 50;

export const PresentationMode: React.FC<PresentationModeProps> = ({
  sections,
  presIndex,
  onPresIndexChange,
  pointer,
  onTogglePointer,
  presTheme,
  onTogglePresTheme,
  onStop,
  pc,
  surround,
  fileName,
  documentTitle,
  skipped,
  headerTemplate,
  footerTemplate,
  presDefaults,
  author,
  onReanchorMarks,
  onRemoveMarkAtPoint,
  onMermaidProcess,
  onPlantUMLProcess,
}) => {
  const slideRef = useRef<HTMLDivElement>(null);
  const contentWrapRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [moreBelow, setMoreBelow] = useState(false);

  // Slide fill width (portion of screen the slide occupies). Larger = bigger slide.
  const [stageWidth, setStageWidth] = useState(1600);

  // Build mode: reveal list items one at a time
  const [buildActive, setBuildActive] = useState(false);
  const [buildRevealed, setBuildRevealed] = useState(0);

  // ---------- Slide splitting (pagination of overflowing sections) ----------
  // pages = arrays of ORIGINAL block indices; one entry per continuation slide.
  // `null` (or single-element) means "not split" → original scroll behaviour.
  const [pages, setPages] = useState<number[][] | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  // Guards a measurement pass so we render ALL blocks once to measure them.
  const [measuring, setMeasuring] = useState(false);
  const measureKeyRef = useRef<string>('');
  // When navigating backward into a split section, land on its last page.
  const landLastPageRef = useRef(false);
  // Locked auto-fit ratio (k) so ALL continuation pages of a split section
  // share the SAME font size — the smallest that any page needs. null = auto.
  const lockedKRef = useRef<number | null>(null);

  // Controls visibility (sidebar + header)
  const [chromeVisible, setChromeVisible] = useState(true);
  const [chromePin, setChromePin] = useState(false);
  const edgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filter out skipped sections for presentation
  const activeSections = useMemo(() => {
    return sections.map((s, i) => ({ section: s, originalIndex: i }))
      .filter(({ originalIndex }) => !skipped.includes(originalIndex));
  }, [sections, skipped]);

  const currentActiveIndex = useMemo(() => {
    return activeSections.findIndex(a => a.originalIndex === presIndex);
  }, [activeSections, presIndex]);

  const totalSlides = activeSections.length;

  // Count total list items in current section for build mode
  const totalBuildItems = useMemo(() => {
    if (presIndex < 0 || presIndex >= sections.length) return 0;
    const section = sections[presIndex];
    if (!section) return 0;
    let count = 0;
    for (const block of section.blocks) {
      if (block.type === 'list') {
        const tmp = document.createElement('div');
        tmp.innerHTML = block.html;
        count += tmp.querySelectorAll('li').length;
      }
    }
    return count;
  }, [sections, presIndex]);

  // ---------- Auto-fit ----------
  // The design spec says: measure the content-wrapper inside the scroll area,
  // NOT body.scrollHeight (which never shrinks below the container).
  // Both the fit check and overflow indicator must use the same measurement.
  const doAutoFit = useCallback(() => {
    const slide = slideRef.current;
    const wrap = contentWrapRef.current;
    const scroll = scrollRef.current;
    if (!slide || !wrap || !scroll) return;

    // The slide is a flex column: title + accent bar + scrollArea(flex:1) + footer.
    // slideRef.clientHeight includes CSS padding (border-box).
    // We use the slide's full height to derive the base font size…
    const slideH = slide.clientHeight;
    if (slideH <= 0) return;

    const base = slideH * 0.0385;
    let k = 1;

    // Locked font: all continuation pages of a split section must share the
    // same (smallest) font size. Apply it directly and skip fit computation.
    if (lockedKRef.current != null) {
      k = lockedKRef.current;
      slide.style.fontSize = `${base * k}px`;
      const availableLocked = scroll.clientHeight;
      const textHLocked = wrap.getBoundingClientRect().height;
      setMoreBelow(textHLocked > availableLocked + 2);
      return;
    }

    // After setting font-size, the flex layout re-flows: title/accent/footer
    // take their em-relative space, and scrollRef gets the remainder.
    // "available" is scrollRef.clientHeight — measured fresh each iteration.

    // Shrink pass: reduce k until content fits in the scroll area
    for (let i = 0; i < 8; i++) {
      slide.style.fontSize = `${base * k}px`;
      // Force layout reflow so flex children resize
      const available = scroll.clientHeight;
      const textH = wrap.getBoundingClientRect().height;
      if (available <= 0) break;
      if (textH <= available) break;
      k = Math.max(0.65, k * Math.min(0.97, Math.sqrt(available / textH)));
    }

    // Grow pass: if text is too short, enlarge until it fills ~100%
    slide.style.fontSize = `${base * k}px`;
    let available = scroll.clientHeight;
    let textH = wrap.getBoundingClientRect().height;
    if (available > 0 && textH < available * 0.9 && k < 1.25) {
      for (let i = 0; i < 12; i++) {
        const next = k + 0.05;
        if (next > 1.25) break;
        slide.style.fontSize = `${base * next}px`;
        available = scroll.clientHeight;
        textH = wrap.getBoundingClientRect().height;
        if (available <= 0 || textH > available) {
          slide.style.fontSize = `${base * k}px`;
          break;
        }
        k = next;
      }
    }

    slide.style.fontSize = `${base * k}px`;

    // Overflow indicator — same basis as the fit check
    available = scroll.clientHeight;
    const finalTextH = wrap.getBoundingClientRect().height;
    setMoreBelow(finalTextH > available + 2);
  }, []);

  const syncMore = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Content still scrollable below the current scroll position?
    setMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
  }, []);

  // Refit after transitions complete
  const scheduleRefit = useCallback(() => {
    doAutoFit();
    setTimeout(doAutoFit, 300);
    setTimeout(doAutoFit, 560);
  }, [doAutoFit]);

  // ---------- Measure blocks & compute slide pages ----------
  // Runs a measurement pass: with every block rendered (measuring=true) and
  // the auto-fit font applied, read each block's height and pack them into
  // pages that fill the slide. Split only at block boundaries; small spillover
  // is tolerated (grace) so we don't create near-empty continuation slides.
  const measureAndPaginate = useCallback((): number[][] | null => {
    const wrap = contentWrapRef.current;
    const scroll = scrollRef.current;
    const slide = slideRef.current;
    if (!wrap || !scroll || !slide) return null;

    // Measure with NO font lock so heights reflect a free auto-fit.
    lockedKRef.current = null;
    doAutoFit();

    const available = scroll.clientHeight;
    if (available <= 0) return null;

    const blockEls = Array.from(
      wrap.querySelectorAll('[data-block-index]'),
    ) as HTMLElement[];

    if (blockEls.length === 0) {
      setPages(null);
      return null;
    }

    const blockIndices: number[] = [];
    const blockHeights: number[] = [];
    for (const el of blockEls) {
      const idx = parseInt(el.getAttribute('data-block-index') || '-1', 10);
      if (idx < 0) continue;
      blockIndices.push(idx);
      // offsetHeight excludes the `mt` gap (that is margin) — good, we add gap explicitly.
      blockHeights.push(el.getBoundingClientRect().height);
    }

    // Font ratio (k) at which the heights above were measured.
    const slideH = slide.clientHeight;
    const measureBase = slideH * 0.0385;
    const measuredFontPx = parseFloat(getComputedStyle(slide).fontSize) || measureBase;
    const kMeasure = measureBase > 0 ? measuredFontPx / measureBase : 1;

    // Gap between blocks = 2.2em at the measured font size.
    const gap = 2.2 * measuredFontPx;
    // Grace ≈ 2 lines of body text (lineHeight 1.55).
    const gracePx = 2 * measuredFontPx * 1.55;

    const result = paginateBlocks({
      blockHeights,
      blockIndices,
      gap,
      available,
      gracePx,
    });

    const finalPages = result.length > 1 ? result : null;
    setPages(finalPages);

    if (finalPages) {
      // All pages must share ONE font size: the smallest any page needs.
      // Height scales ~linearly with font, so a page with content height Hp
      // (measured at kMeasure) fits when k <= kMeasure * available / Hp.
      const measIndexOf = (orig: number) => blockIndices.indexOf(orig);
      let minK = Infinity;
      for (const page of finalPages) {
        let hp = 0;
        page.forEach((orig, i) => {
          const mi = measIndexOf(orig);
          if (mi >= 0) hp += blockHeights[mi] ?? 0;
          if (i > 0) hp += gap;
        });
        if (hp <= 0) continue;
        const pageK = kMeasure * (available / hp);
        if (pageK < minK) minK = pageK;
      }
      if (Number.isFinite(minK)) {
        // Clamp to the same bounds doAutoFit uses (floor 0.65, grow cap 1.25).
        lockedKRef.current = Math.max(0.65, Math.min(1.25, minK));
      } else {
        lockedKRef.current = null;
      }
    } else {
      lockedKRef.current = null;
    }

    return finalPages;
  }, [doAutoFit]);

  // Navigate
  const goTo = useCallback(
    (i: number) => {
      if (activeSections.length === 0) return;
      const clamped = Math.max(0, Math.min(i, activeSections.length - 1));
      const target = activeSections[clamped];
      if (!target) return;
      onPresIndexChange(target.originalIndex);
      setBuildRevealed(0);
      setTimeout(() => {
        // The pagination effect owns scroll positioning when a section is
        // (re)measured — including landing on the last page when navigating
        // backward. Only reset scroll here for the normal forward case.
        if (!landLastPageRef.current) {
          const el = scrollRef.current;
          if (el) el.scrollTop = 0;
          doAutoFit();
        }
      }, 50);
    },
    [activeSections, onPresIndexChange, doAutoFit],
  );

  const step = useCallback(
    (dir: number) => {
      // Build mode: reveal next/prev item
      if (dir > 0 && buildActive && buildRevealed < totalBuildItems) {
        setBuildRevealed(r => r + 1);
        return;
      }

      const pageCount = pages && pages.length > 1 ? pages.length : 1;

      const el = scrollRef.current;
      if (el) {
        const page = Math.max(120, el.clientHeight * 0.82);
        if (dir > 0) {
          if (el.scrollHeight - el.scrollTop - el.clientHeight > 8) {
            el.scrollBy({ top: page, behavior: 'smooth' });
            setTimeout(syncMore, 420);
            return;
          }
        } else {
          if (el.scrollTop > 8) {
            el.scrollBy({ top: -page, behavior: 'smooth' });
            setTimeout(syncMore, 420);
            return;
          }
          // Retract build items before going to previous section
          if (buildActive && buildRevealed > 0) {
            setBuildRevealed(r => r - 1);
            return;
          }
        }
      }

      // Continuation pages within the current split section.
      if (pageCount > 1) {
        if (dir > 0 && pageIndex < pageCount - 1) {
          setPageIndex(p => p + 1);
          setTimeout(() => {
            const s = scrollRef.current;
            if (s) s.scrollTop = 0;
            doAutoFit();
            syncMore();
          }, 40);
          return;
        }
        if (dir < 0 && pageIndex > 0) {
          setPageIndex(p => p - 1);
          setTimeout(() => {
            const s = scrollRef.current;
            if (s) s.scrollTop = s.scrollHeight; // land at bottom of prev page
            doAutoFit();
            syncMore();
          }, 40);
          return;
        }
      }

      // Navigate sections
      const nextActive = currentActiveIndex + dir;
      if (nextActive >= 0 && nextActive < activeSections.length) {
        if (dir < 0) landLastPageRef.current = true;
        goTo(nextActive);
        if (dir < 0) {
          // Go to previous section: reveal build fully. Landing on its LAST
          // page + bottom scroll is handled by the pagination effect.
          setTimeout(() => {
            setBuildRevealed(999);
          }, 80);
        }
      }
    },
    [buildActive, buildRevealed, totalBuildItems, currentActiveIndex, activeSections.length, goTo, syncMore, pages, pageIndex, doAutoFit],
  );

  // ---------- Controls visibility ----------
  const showChrome = useCallback(() => {
    setChromeVisible(true);
  }, []);

  const hideChrome = useCallback(() => {
    if (!chromePin) setChromeVisible(false);
  }, [chromePin]);

  // Auto-hide after start
  useEffect(() => {
    autoHideTimerRef.current = setTimeout(() => {
      if (!chromePin) setChromeVisible(false);
    }, 2500);
    return () => { if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current); };
  }, []);

  // Mouse edge detection
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (e.clientX <= 6 || e.clientY <= 6) {
        showChrome();
        if (edgeTimerRef.current) clearTimeout(edgeTimerRef.current);
        edgeTimerRef.current = null;
      } else {
        if (!edgeTimerRef.current && !chromePin) {
          edgeTimerRef.current = setTimeout(() => {
            edgeTimerRef.current = null;
            hideChrome();
          }, 1800);
        }
      }
    };
    window.addEventListener('mousemove', handleMouse);
    return () => {
      window.removeEventListener('mousemove', handleMouse);
      if (edgeTimerRef.current) clearTimeout(edgeTimerRef.current);
    };
  }, [chromePin, showChrome, hideChrome]);

  // Refit when chrome visibility changes (via transitionend)
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;
    const handler = () => scheduleRefit();
    sidebar.addEventListener('transitionend', handler);
    return () => sidebar.removeEventListener('transitionend', handler);
  }, [scheduleRefit]);

  // ---------- Keyboard ----------
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        try { if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {}); } catch { /* fullscreen API unavailable */ }
        onStop();
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault(); step(1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault(); step(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const next = currentActiveIndex + 1;
        if (next < activeSections.length) goTo(next);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = currentActiveIndex - 1;
        if (prev >= 0) goTo(prev);
      } else if (e.key === 'b' || e.key === 'B') {
        setBuildActive(b => !b);
        setBuildRevealed(0);
      } else if (e.key === 'p' || e.key === 'P') {
        onTogglePointer();
      } else if (e.key === 'd' || e.key === 'D') {
        onTogglePresTheme();
      } else if (e.key === 's' || e.key === 'S') {
        setChromePin(p => !p);
        setChromeVisible(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step, goTo, currentActiveIndex, activeSections.length, onStop, onTogglePointer, onTogglePresTheme]);

  // ---------- Auto-fit triggers ----------
  useEffect(() => { setTimeout(doAutoFit, 60); }, [presIndex, doAutoFit]);

  // ---------- Pagination pass ----------
  // On any change that affects layout, re-measure and recompute pages.
  // Build mode is single-slide (reveal items in place), so skip splitting there.
  const triggerMeasure = useCallback((wantLast: boolean) => {
    if (buildActive) {
      setPages(null);
      setPageIndex(0);
      lockedKRef.current = null;
      return () => {};
    }
    const key = `${presIndex}|${stageWidth}|${presTheme}|${buildActive}|${Date.now()}`;
    measureKeyRef.current = key;
    setMeasuring(true);
    const id1 = setTimeout(() => {
      if (measureKeyRef.current !== key) return;
      const computed = measureAndPaginate();
      const lastPage = computed && computed.length > 1 ? computed.length - 1 : 0;
      const targetPage = wantLast ? lastPage : 0;
      setPageIndex(targetPage);
      setMeasuring(false);
      setTimeout(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = wantLast ? el.scrollHeight : 0;
        doAutoFit();
        syncMore();
      }, 40);
    }, 70);
    return () => clearTimeout(id1);
  }, [buildActive, presIndex, stageWidth, presTheme, measureAndPaginate, doAutoFit, syncMore]);

  useEffect(() => {
    const wantLast = landLastPageRef.current;
    landLastPageRef.current = false;
    const cancel = triggerMeasure(wantLast);
    return cancel;
  }, [presIndex, stageWidth, presTheme, buildActive, sections]);

  useEffect(() => {
    // On resize, geometry changes → re-measure so the shared (locked) font
    // and page packing are recomputed for the new slide size.
    const handler = () => { triggerMeasure(false); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [triggerMeasure]);
  useEffect(() => { setTimeout(syncMore, 100); }, [presIndex, syncMore]);
  // Refit whenever the visible page changes.
  useEffect(() => { setTimeout(doAutoFit, 30); }, [pageIndex, doAutoFit]);

  // Re-anchor marks
  useEffect(() => {
    if (!onReanchorMarks) return;
    const id = setTimeout(() => {
      const scroll = scrollRef.current;
      if (!scroll) return;
      const wrappers = Array.from(scroll.querySelectorAll('[data-mark-block]')) as HTMLElement[];
      const blockEls: Element[] = [];
      for (const w of wrappers) {
        const bi = parseInt(w.getAttribute('data-mark-block') || '-1', 10);
        const el = w.firstElementChild;
        if (bi >= 0 && el) blockEls[bi] = el;
      }
      const titleEl = scroll.querySelector('[data-mark-title]') as Element | null;
      const resolve = (blockIndex: number): Element | null =>
        blockIndex === -1 ? titleEl : blockEls[blockIndex] ?? null;
      onReanchorMarks(resolve, presIndex);
    }, 60);
    return () => clearTimeout(id);
  }, [presIndex, presTheme, sections, onReanchorMarks]);

  // ---------- Render diagrams inside the current slide ----------
  // Slides mount from the pre-processed HTML string, so mermaid/PlantUML
  // placeholders are not yet rendered. Run the same async passes the document
  // view uses, targeting the slide's scroll container. Re-run on slide change,
  // theme toggle (mermaid re-themes), and build reveal (DOM re-created).
  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(async () => {
      const container = scrollRef.current;
      if (!container) return;
      try {
        onMermaidProcess?.(container);
        if (onPlantUMLProcess) await onPlantUMLProcess(container);
      } finally {
        if (!cancelled) scheduleRefit();
      }
    }, 60);
    return () => { cancelled = true; clearTimeout(id); };
  }, [presIndex, presTheme, buildActive, buildRevealed, sections, onMermaidProcess, onPlantUMLProcess, scheduleRefit]);


  const renderBlocks = useCallback((section: Section) => {
    // Which original block indices are visible on the current slide.
    // During a measurement pass (or when not split / in build mode) we render
    // every block so heights can be measured and build/scroll keep working.
    const split = !measuring && !buildActive && pages && pages.length > 1;
    const visibleSet: Set<number> | null = split
      ? new Set(pages[Math.min(pageIndex, pages.length - 1)])
      : null;

    let ordinal = 0;
    return section.blocks.map((block, bi) => {
      // Skip horizontal rules ("---") — no visual divider on slides.
      if (block.type === 'other' && /^\s*<hr\b[^>]*>\s*$/i.test(block.html)) {
        return null;
      }
      const onThisPage = !visibleSet || visibleSet.has(bi);
      if (block.type === 'list' && buildActive) {
        const tmp = document.createElement('div');
        tmp.innerHTML = block.html;
        const items = tmp.querySelectorAll('li');
        const startOrdinal = ordinal;
        ordinal += items.length;
        // Render list with individual item visibility
        const listTag = block.html.trim().startsWith('<ol') ? 'ol' : 'ul';
        const itemsHtml = Array.from(items).map((li, idx) => {
          const visible = (startOrdinal + idx) < buildRevealed;
          return `<li style="opacity:${visible ? 1 : 0};transition:opacity 220ms ${EASE}">${li.innerHTML}</li>`;
        }).join('');
        const html = `<${listTag}>${itemsHtml}</${listTag}>`;
        return (
          <Box key={bi} data-mark-block={bi} data-block-index={bi} sx={{ mt: bi === 0 ? 0 : '2.2em', ...blockStyles }}>
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </Box>
        );
      }
      ordinal += 0; // non-list blocks don't increment
      if (!onThisPage) return null;
      return (
        <Box key={bi} data-mark-block={bi} data-block-index={bi} sx={{ mt: bi === 0 ? 0 : '2.2em', ...blockStyles }}>
          <div dangerouslySetInnerHTML={{ __html: block.html }} />
        </Box>
      );
    });
  }, [buildActive, buildRevealed, measuring, pages, pageIndex]);

  const section = presIndex >= 0 && presIndex < sections.length ? sections[presIndex] : null;

  // Continuation-slide info for the current section.
  const pageCount = pages && pages.length > 1 ? pages.length : 1;
  const isSplit = pageCount > 1;
  const safePageIndex = Math.min(pageIndex, pageCount - 1);

  // A chapter with no renderable body (only sub-headings, dividers, or empty
  // blocks) is shown as a large centered title-only "header slide".
  const hasBody = useMemo(() => {
    if (!section) return false;
    return section.blocks.some((b) => !/^\s*<hr\b[^>]*>\s*$/i.test(b.html));
  }, [section]);

  // Token context for header/footer bands — recomputed per visible slide/page.
  const tokenCtx = useMemo<TokenContext>(() => {
    const now = new Date();
    return {
      sectionTitle: section?.title ?? '',
      continuation: isSplit && safePageIndex > 0 ? ' (Fortsetzung)' : '',
      documentTitle,
      fileName,
      sectionNumber: currentActiveIndex + 1,
      sectionCount: totalSlides,
      pageNumber: safePageIndex + 1,
      pageCount,
      date: now.toLocaleDateString('de-DE'),
      time: now.toLocaleTimeString('de-DE'),
      author: author || presDefaults.team,
    };
  }, [
    section,
    isSplit,
    safePageIndex,
    documentTitle,
    fileName,
    currentActiveIndex,
    totalSlides,
    pageCount,
    author,
    presDefaults.team,
  ]);

  const handleSlideClick = useCallback((e: React.MouseEvent) => {
    onRemoveMarkAtPoint?.(e.clientX, e.clientY);
  }, [onRemoveMarkAtPoint]);

  const navBtnSx = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    border: `1px solid ${pc.line}`,
    background: 'transparent',
    cursor: 'pointer',
    color: pc.dim,
    '&:hover': { borderColor: BRAND.ACCENT, color: BRAND.ACCENT },
  };

  const blockStyles = {
    '& p': {
      margin: 0,
      lineHeight: 1.55,
      color: pc.body,
      textWrap: 'pretty' as const,
      fontSize: '1em',
    },
    '& a': {
      color: 'inherit',
      textDecoration: 'none',
      borderBottom: `1px solid ${pc.dim}`,
    },
    '& ul, & ol': {
      margin: 0,
      padding: 0,
      listStyle: 'none',
      lineHeight: 1.55,
      color: pc.body,
      fontSize: '1em',
    },
    '& li': {
      position: 'relative',
      paddingLeft: '1.1em',
      mb: '.55em',
      '&::before': {
        content: '""',
        position: 'absolute',
        left: 0,
        top: '.55em',
        width: '.38em',
        height: '.38em',
        background: BRAND.ACCENT,
      },
    },
    '& strong': {
      fontWeight: 600,
      color: pc.title,
    },
    '& pre': {
      margin: 0,
      padding: '.8em 1em',
      background: pc.pre,
      borderLeft: `3px solid ${BRAND.ACCENT}`,
      fontFamily: "'Noto Sans Mono', monospace",
      fontWeight: 400,
      lineHeight: 1.6,
      color: pc.body,
      whiteSpace: 'pre-wrap' as const,
      overflowWrap: 'anywhere' as const,
      fontSize: '.82em',
    },
    '& pre code': {
      background: 'transparent',
      padding: 0,
      fontSize: 'inherit',
    },
    '& blockquote': {
      padding: '2px 0 2px 18px',
      borderLeft: `3px solid ${pc.line}`,
      color: pc.dim,
      lineHeight: 1.7,
      margin: 0,
    },
    '& code': {
      fontFamily: "'Noto Sans Mono', monospace",
      fontSize: '.85em',
      padding: '2px 5px',
      background: pc.pre,
    },
    '& table': {
      width: '100%',
      borderCollapse: 'collapse' as const,
      fontSize: '.92em',
      lineHeight: 1.45,
      margin: 0,
      tableLayout: 'auto' as const,
    },
    '& th, & td': {
      border: `1px solid ${pc.line}`,
      padding: '.4em .7em',
      textAlign: 'left' as const,
      verticalAlign: 'top' as const,
      color: pc.body,
    },
    '& thead th': {
      background: pc.hover,
      color: pc.title,
      fontWeight: 600,
      borderBottom: `2px solid ${BRAND.ACCENT}`,
    },
    '& tbody tr:nth-of-type(even)': {
      background: pc.hover,
    },
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        cursor: pointer ? 'none' : 'default',
        background: pc.stage,
      }}
    >
      {/* Outline sidebar (collapsible) */}
      <Box
        ref={sidebarRef}
        sx={{
          width: chromeVisible ? 264 : 0,
          flexShrink: 0,
          overflow: 'hidden',
          opacity: chromeVisible ? 1 : 0,
          borderRight: chromeVisible ? `1px solid ${pc.line}` : 'none',
          display: 'flex',
          flexDirection: 'column',
          transition: `width 220ms ${EASE}, opacity 180ms ${EASE}`,
        }}
      >
        <Box sx={{ px: '24px', pt: '26px', pb: '4px', fontSize: 10.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: pc.dim, whiteSpace: 'nowrap' }}>
          Gliederung
        </Box>
        <Box sx={{ px: '24px', pb: '18px', fontSize: 12, color: pc.dim, whiteSpace: 'nowrap' }}>
          Klicken zum Springen
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {activeSections.map(({ section: s, originalIndex }, i) => {
            const active = presIndex === originalIndex;
            return (
              <Box
                key={s.id}
                onClick={() => goTo(i)}
                sx={{
                  display: 'flex',
                  gap: '12px',
                  padding: '9px 24px',
                  cursor: 'pointer',
                  borderLeft: `3px solid ${active ? BRAND.ACCENT : 'transparent'}`,
                  background: active ? pc.activeBg : 'transparent',
                  whiteSpace: 'nowrap',
                  '&:hover': { background: pc.hover },
                }}
              >
                <Box sx={{ flexShrink: 0, fontSize: 11, fontVariantNumeric: 'tabular-nums', pt: '2px', color: active ? BRAND.ACCENT : pc.dim }}>
                  {String(i + 1).padStart(2, '0')}
                </Box>
                <Box sx={{ flex: 1, fontSize: 13, lineHeight: 1.4, color: active ? pc.title : pc.dim, fontWeight: active ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.title}
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Keyboard legend */}
        <Box sx={{ padding: '16px 24px 20px', borderTop: `1px solid ${pc.line}`, fontSize: 11.5, lineHeight: 1.7, color: pc.dim, whiteSpace: 'nowrap' }}>
          <div>↓ ↑&nbsp;&nbsp;Weiterblättern</div>
          <div>← →&nbsp;&nbsp;Abschnitt wechseln</div>
          <div>B&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Aufbau ein/aus</div>
          <div>P&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Zeiger ein/aus</div>
          <div>D&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Hell/Dunkel</div>
          <div>S&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Steuerung ein/aus</div>
          <div>Esc&nbsp;&nbsp;Beenden</div>
          <Box sx={{ mt: '8px', fontSize: 10.5, opacity: 0.7 }}>
            Die Steuerung blendet sich aus. Taste S oder Maus an den linken bzw. oberen Bildschirmrand.
          </Box>
        </Box>
      </Box>

      {/* Main stage area */}
      <Box sx={{ position: 'relative', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Stage header (collapsible) */}
        <Box
          sx={{
            flexShrink: 0,
            height: chromeVisible ? 52 : 0,
            overflow: 'hidden',
            opacity: chromeVisible ? 1 : 0,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            px: '28px',
            borderBottom: chromeVisible ? `1px solid ${pc.line}` : 'none',
            transition: `height 220ms ${EASE}, opacity 180ms ${EASE}`,
          }}
        >
          <Box sx={{
            flex: '0 1 auto',
            minWidth: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: 13,
            color: pc.dim,
          }}>
            {fileName}
          </Box>
          <Box sx={{ flex: 1 }} />
          <Box sx={{ flex: '0 0 auto', fontSize: 12, fontVariantNumeric: 'tabular-nums', color: pc.dim }}>
            Abschnitt {currentActiveIndex + 1} von {totalSlides}
          </Box>

          <Box component="button" type="button" onClick={() => goTo(currentActiveIndex - 1)} title="Vorheriger Abschnitt" sx={navBtnSx}>
            <ChevronLeft sx={{ fontSize: 18 }} />
          </Box>
          <Box component="button" type="button" onClick={() => goTo(currentActiveIndex + 1)} title="Nächster Abschnitt" sx={navBtnSx}>
            <ChevronRight sx={{ fontSize: 18 }} />
          </Box>

          <Box sx={{ width: 1, height: 20, background: pc.line }} />

          {/* Build mode toggle */}
          <Box
            component="button"
            type="button"
            onClick={() => { setBuildActive(b => !b); setBuildRevealed(0); }}
            title="Aufbau (B)"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              height: 32,
              px: '12px',
              border: `1px solid ${buildActive ? BRAND.ACCENT : pc.line}`,
              background: 'transparent',
              font: `600 11.5px 'Noto Sans', Arial, sans-serif`,
              cursor: 'pointer',
              color: buildActive ? BRAND.ACCENT : pc.dim,
            }}
          >
            <FormatListBulleted sx={{ fontSize: 17 }} />
            Aufbau
          </Box>

          {/* Pointer toggle */}
          <Box
            component="button"
            type="button"
            onClick={onTogglePointer}
            title="Zeiger (P)"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              height: 32,
              px: '12px',
              border: `1px solid ${pointer ? BRAND.ACCENT : pc.line}`,
              background: 'transparent',
              font: `600 11.5px 'Noto Sans', Arial, sans-serif`,
              cursor: 'pointer',
              color: pointer ? BRAND.ACCENT : pc.dim,
            }}
          >
            <MyLocation sx={{ fontSize: 17 }} />
            Zeiger
          </Box>

          <Box sx={{ width: 1, height: 20, background: pc.line }} />

          {/* Slide fill width */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }} title="Bildschirmnutzung">
            <AspectRatio sx={{ fontSize: 16, color: pc.dim }} />
            <Slider
              value={stageWidth}
              onChange={(_, v) => { setStageWidth(v as number); scheduleRefit(); }}
              min={STAGE_WIDTH_MIN}
              max={STAGE_WIDTH_MAX}
              step={STAGE_WIDTH_STEP}
              size="small"
              title="Bildschirmnutzung"
              sx={{ width: 90, color: BRAND.ACCENT, '& .MuiSlider-thumb': { width: 12, height: 12 } }}
            />
          </Box>

          <Box sx={{ width: 1, height: 20, background: pc.line }} />

          {/* Theme toggle */}
          <Box component="button" type="button" onClick={onTogglePresTheme} title="Hell/Dunkel (D)" sx={navBtnSx}>
            {presTheme === 'dark' ? <LightMode sx={{ fontSize: 17 }} /> : <DarkMode sx={{ fontSize: 17 }} />}
          </Box>

          {/* Exit */}
          <Box
            component="button"
            type="button"
            onClick={onStop}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              height: 32,
              px: '12px',
              border: `1px solid ${pc.line}`,
              background: 'transparent',
              color: pc.dim,
              font: `600 11.5px 'Noto Sans', Arial, sans-serif`,
              cursor: 'pointer',
              '&:hover': { borderColor: BRAND.DANGER, color: BRAND.DANGER },
            }}
          >
            <Close sx={{ fontSize: 16 }} />
            Beenden
          </Box>
        </Box>

        {/* Slide area */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '22px 28px',
            background: surround.surround,
          }}
        >
          {section && (
            <Box
              ref={slideRef}
              onClick={handleSlideClick}
              sx={{
                position: 'relative',
                width: '100%',
                maxWidth: stageWidth,
                aspectRatio: '16 / 9',
                maxHeight: '100%',
                background: pc.stage,
                border: `1px solid ${pc.line}`,
                borderRadius: 0,
                padding: '4.4% 5%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {hasBody ? (
                <>
              {/* Configurable header band — replaces the old title + accent bar.
                  Fixed font (clamp), sits outside scrollRef so auto-fit/split
                  measure only the content area. */}
              <SlideBand template={headerTemplate} ctx={tokenCtx} pc={pc} />

              {/* Split-section sub-page counter (page N of M within a section).
                  Restored as a fixed overlay independent of the config band. */}
              {isSplit && (
                <Box sx={{
                  position: 'absolute',
                  top: '4.4%',
                  right: '5%',
                  fontSize: 'clamp(11px, 1.4vh, 15px)',
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  color: BRAND.ACCENT,
                  zIndex: 2,
                }}>
                  {safePageIndex + 1} / {pageCount}
                </Box>
              )}

              {/* Accent bar */}
              <Box sx={{
                width: 64,
                height: 3,
                background: BRAND.ACCENT,
                mt: '12px',
                mb: '18px',
                flexShrink: 0,
              }} />

              {/* Content area */}
              <Box
                ref={scrollRef}
                onScroll={syncMore}
                sx={{
                  flex: 1,
                  minHeight: 0,
                  overflow: 'auto',
                  lineHeight: 1.55,
                  color: pc.body,
                }}
              >
                <Box ref={contentWrapRef}>
                  {renderBlocks(section)}
                </Box>
              </Box>
                </>
              ) : (
                <>
                  {/* Title-only header slide: chapter with no direct body */}
                  <Box sx={{
                    position: 'absolute',
                    top: '5%',
                    right: '5%',
                    fontSize: 'clamp(12px, 1.6vh, 16px)',
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                    color: pc.dim,
                  }}>
                    {String(currentActiveIndex + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
                  </Box>
                  <Box sx={{
                    flex: 1,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                  }}>
                    <Box sx={{
                      width: 88,
                      height: 4,
                      background: BRAND.ACCENT,
                      mb: '28px',
                    }} />
                    <Box
                      data-mark-title="1"
                      sx={{
                        fontSize: 'clamp(40px, 8vh, 96px)',
                        fontWeight: 700,
                        lineHeight: 1.1,
                        letterSpacing: '-0.02em',
                        color: pc.title,
                      }}
                    >
                      {section.title}
                    </Box>
                  </Box>
                </>
              )}

              {/* Configurable footer band — replaces the old hardcoded footer.
                  Shown on both body and title-only slides (spec §5.2). */}
              <Box sx={{
                flexShrink: 0,
                mt: 'auto',
                pt: '12px',
              }}>
                <SlideBand template={footerTemplate} ctx={tokenCtx} pc={pc} />
              </Box>

              {/* "Section continues" indicator — only for scroll-based overflow
                  (non-split sections). Split sections navigate by page and show
                  the sub-page counter instead, so suppress it here. */}
              {moreBelow && !isSplit && (
                <Box
                  onClick={() => step(1)}
                  sx={{
                    position: 'absolute',
                    right: 44,
                    bottom: 36,
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    height: 30,
                    px: '12px',
                    cursor: 'pointer',
                    background: pc.stage,
                    border: `1px solid ${BRAND.ACCENT}`,
                    color: BRAND.ACCENT,
                    font: `600 11.5px 'Noto Sans', Arial, sans-serif`,
                  }}
                >
                  <South sx={{ fontSize: 16 }} />
                  Abschnitt geht weiter
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};
