import { Injectable } from '@angular/core';

/**
 * Keeps the open overlays (modal, drawer, popover, menu, tooltip, …) in
 * opening order so that a dismiss gesture — Escape, click outside — reaches
 * only the top-most one instead of closing every open layer at once.
 *
 * Every overlay pushes its id when it opens and removes it when it closes or
 * is destroyed. Internal to the library; not part of the public API.
 */
@Injectable({ providedIn: 'root' })
export class OverlayStackService {
  private readonly stack: string[] = [];

  /**
   * Events already consumed by an overlay. All overlays listen on `document`,
   * where listeners fire in registration order — not z-order — so by the time a
   * lower overlay's listener runs, the top one may already have closed and left
   * the stack, making the lower one "top" for the very same event.
   */
  private readonly claimed = new WeakSet<Event>();

  /** Register `id` as the new top-most overlay (re-pushing moves it to the top). */
  push(id: string): void {
    this.remove(id);
    this.stack.push(id);
  }

  remove(id: string): void {
    const index = this.stack.indexOf(id);
    if (index !== -1) this.stack.splice(index, 1);
  }

  isTop(id: string): boolean {
    return this.stack.length > 0 && this.stack[this.stack.length - 1] === id;
  }

  /**
   * Whether overlay `id` may act on this dismiss event. True only for the
   * top-most overlay and only once per event; the caller then closes and, for
   * keyboard events, stops propagation so nothing outside the stack sees it.
   */
  claim(id: string, event: Event): boolean {
    if (this.claimed.has(event) || !this.isTop(id)) return false;
    this.claimed.add(event);
    return true;
  }
}
