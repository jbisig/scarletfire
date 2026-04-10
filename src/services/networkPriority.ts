/**
 * Network Priority
 *
 * Lightweight coordination so background prefetches yield to user-initiated
 * network requests. User-facing code (e.g. ShowsContext.getShowDetail) wraps
 * its request with begin/end, and background workers (e.g. radio prefetch)
 * await waitForIdle() between batches.
 */
class NetworkPriority {
  private userFetchCount = 0;
  private waiters: Array<() => void> = [];

  beginUserFetch(): void {
    this.userFetchCount++;
  }

  endUserFetch(): void {
    this.userFetchCount = Math.max(0, this.userFetchCount - 1);
    if (this.userFetchCount === 0 && this.waiters.length > 0) {
      const pending = this.waiters;
      this.waiters = [];
      pending.forEach(fn => fn());
    }
  }

  /**
   * Resolves when no user fetches are in flight, or after timeoutMs
   * (whichever comes first). The timeout prevents a stuck user request
   * from starving background work indefinitely.
   */
  async waitForIdle(timeoutMs: number = 3000): Promise<void> {
    if (this.userFetchCount === 0) return;
    return new Promise(resolve => {
      const timer = setTimeout(() => {
        const index = this.waiters.indexOf(onIdle);
        if (index >= 0) this.waiters.splice(index, 1);
        resolve();
      }, timeoutMs);
      const onIdle = () => {
        clearTimeout(timer);
        resolve();
      };
      this.waiters.push(onIdle);
    });
  }
}

export const networkPriority = new NetworkPriority();
