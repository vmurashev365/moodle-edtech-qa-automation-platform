import type { Page } from 'playwright';

function installClickVisualizerInPage(): void {
  const windowWithFlag = window as Window & { __moodleQaClickVisualizerInstalled?: boolean };

  if (windowWithFlag.__moodleQaClickVisualizerInstalled) {
    return;
  }

  windowWithFlag.__moodleQaClickVisualizerInstalled = true;

  const style = document.createElement('style');
  style.setAttribute('data-moodle-qa-click-visualizer', 'true');
  style.textContent = `
    .moodle-qa-cursor-ring {
      position: fixed;
      width: 30px;
      height: 30px;
      margin-left: -15px;
      margin-top: -15px;
      border: 3px solid #ff2f6d;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.82);
      box-shadow: 0 0 0 4px rgba(255, 47, 109, 0.22), 0 10px 26px rgba(15, 23, 42, 0.22);
      pointer-events: none;
      z-index: 2147483647;
      transform: translate(-100px, -100px);
      transition: transform 80ms linear, opacity 120ms ease, background 120ms ease;
      opacity: 0.98;
      mix-blend-mode: normal;
    }

    .moodle-qa-cursor-ring[data-down='true'] {
      background: rgba(255, 47, 109, 0.25);
      transform: translate(var(--qa-cursor-x), var(--qa-cursor-y)) scale(0.82);
    }

    .moodle-qa-click-ripple {
      position: fixed;
      width: 18px;
      height: 18px;
      margin-left: -9px;
      margin-top: -9px;
      border: 4px solid #ff2f6d;
      border-radius: 999px;
      pointer-events: none;
      z-index: 2147483646;
      animation: moodle-qa-click-ripple 900ms ease-out forwards;
    }

    .moodle-qa-target-highlight {
      position: fixed;
      border: 4px solid #22c55e;
      border-radius: 8px;
      background: rgba(34, 197, 94, 0.12);
      box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.22), 0 14px 34px rgba(15, 23, 42, 0.24);
      pointer-events: none;
      z-index: 2147483645;
      opacity: 0;
      transform: scale(0.96);
      transition: opacity 120ms ease, transform 120ms ease;
    }

    .moodle-qa-target-highlight[data-visible='true'] {
      opacity: 1;
      transform: scale(1);
    }

    .moodle-qa-target-label {
      position: fixed;
      max-width: min(420px, calc(100vw - 24px));
      padding: 6px 10px;
      border-radius: 6px;
      background: #0f172a;
      color: #ffffff;
      font: 700 14px/1.25 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      letter-spacing: 0;
      box-shadow: 0 10px 28px rgba(15, 23, 42, 0.28);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      pointer-events: none;
      z-index: 2147483647;
      opacity: 0;
      transition: opacity 120ms ease;
    }

    .moodle-qa-target-label[data-visible='true'] {
      opacity: 1;
    }

    @keyframes moodle-qa-click-ripple {
      from {
        opacity: 0.95;
        transform: scale(0.4);
      }
      to {
        opacity: 0;
        transform: scale(3.8);
      }
    }
  `;

  const cursor = document.createElement('div');
  cursor.className = 'moodle-qa-cursor-ring';
  cursor.setAttribute('aria-hidden', 'true');

  const targetHighlight = document.createElement('div');
  targetHighlight.className = 'moodle-qa-target-highlight';
  targetHighlight.setAttribute('aria-hidden', 'true');

  const targetLabel = document.createElement('div');
  targetLabel.className = 'moodle-qa-target-label';
  targetLabel.setAttribute('aria-hidden', 'true');

  document.documentElement.append(style, targetHighlight, targetLabel, cursor);

  let highlightTimer: number | undefined;

  function moveCursor(x: number, y: number): void {
    cursor.style.setProperty('--qa-cursor-x', `${x}px`);
    cursor.style.setProperty('--qa-cursor-y', `${y}px`);
    cursor.style.transform = `translate(${x}px, ${y}px)`;
  }

  function showRipple(x: number, y: number, target: EventTarget | null): void {
    const ripple = document.createElement('div');
    ripple.className = 'moodle-qa-click-ripple';
    ripple.setAttribute('aria-hidden', 'true');
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    document.documentElement.append(ripple);
    window.setTimeout(() => ripple.remove(), 950);
    showTargetHighlight(target);
  }

  function showTargetHighlight(target: EventTarget | null): void {
    const element = resolveClickableElement(target);

    if (!element) {
      return;
    }

    const rect = element.getBoundingClientRect();

    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const padding = 6;
    const left = Math.max(6, rect.left - padding);
    const top = Math.max(6, rect.top - padding);
    const right = Math.min(window.innerWidth - 6, rect.right + padding);
    const bottom = Math.min(window.innerHeight - 6, rect.bottom + padding);

    targetHighlight.style.left = `${left}px`;
    targetHighlight.style.top = `${top}px`;
    targetHighlight.style.width = `${Math.max(12, right - left)}px`;
    targetHighlight.style.height = `${Math.max(12, bottom - top)}px`;
    targetHighlight.dataset.visible = 'true';

    const label = buildTargetLabel(element);
    targetLabel.textContent = label ? `Click: ${label}` : 'Click target';
    targetLabel.style.left = `${Math.min(left, window.innerWidth - 440)}px`;
    targetLabel.style.top = `${Math.max(6, top - 36)}px`;
    targetLabel.dataset.visible = 'true';

    if (highlightTimer !== undefined) {
      window.clearTimeout(highlightTimer);
    }

    highlightTimer = window.setTimeout(() => {
      targetHighlight.dataset.visible = 'false';
      targetLabel.dataset.visible = 'false';
    }, 1200);
  }

  function resolveClickableElement(target: EventTarget | null): HTMLElement | undefined {
    if (!(target instanceof Element)) {
      return undefined;
    }

    const selector = [
      'button',
      'a[href]',
      'input',
      'textarea',
      'select',
      'label',
      '[role="button"]',
      '[role="link"]',
      '[role="menuitem"]',
      '[role="tab"]',
      '[role="checkbox"]',
      '[role="radio"]',
      '[role="switch"]',
      '[role="option"]',
      '[aria-label]',
      '[title]',
      '[data-action]',
      '[data-region]',
      '[data-toggle]'
    ].join(',');

    const element = target.closest(selector);

    return element instanceof HTMLElement ? element : target instanceof HTMLElement ? target : undefined;
  }

  function buildTargetLabel(element: HTMLElement): string {
    const label =
      element.getAttribute('aria-label') ??
      element.getAttribute('title') ??
      element.getAttribute('value') ??
      element.textContent ??
      element.getAttribute('name') ??
      element.id;

    return (label ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
  }

  window.addEventListener(
    'pointermove',
    (event) => {
      moveCursor(event.clientX, event.clientY);
    },
    { passive: true }
  );

  window.addEventListener(
    'pointerdown',
    (event) => {
      moveCursor(event.clientX, event.clientY);
      cursor.dataset.down = 'true';
      showRipple(event.clientX, event.clientY, event.target);
    },
    { passive: true }
  );

  window.addEventListener(
    'click',
    (event) => {
      showTargetHighlight(event.target);
    },
    { passive: true, capture: true }
  );

  window.addEventListener(
    'pointerup',
    (event) => {
      moveCursor(event.clientX, event.clientY);
      cursor.dataset.down = 'false';
    },
    { passive: true }
  );
}

export async function installClickVisualizer(page: Page): Promise<void> {
  await page.addInitScript(installClickVisualizerInPage);
  await page.evaluate(installClickVisualizerInPage).catch(() => undefined);
}
