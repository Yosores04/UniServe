// One in-flight read and one write at a time. Polling and post-write refreshes
// share this coordinator so an older response cannot overwrite a newer one.
export function createWorkspaceSync<T>(
  read: (signal: AbortSignal) => Promise<T>,
  onData: (data: T) => void,
  onError: (error: Error) => void,
) {
  let disposed = false;
  let writing = false;
  let activeRead: Promise<void> | undefined;
  const controller = new AbortController();

  function refresh(): Promise<void> {
    if (disposed) return Promise.resolve();
    if (activeRead) return activeRead;
    activeRead = (async () => {
      try {
        const data = await read(controller.signal);
        if (!disposed) onData(data);
      } catch (error) {
        if (!disposed) onError(error instanceof Error ? error : new Error("Connection lost. Retrying…"));
      } finally {
        activeRead = undefined;
      }
    })();
    return activeRead;
  }

  return {
    refresh,
    async mutate(write: () => Promise<unknown>): Promise<boolean> {
      if (disposed || writing) return false;
      writing = true;
      try {
        await write();
        // Let a pre-write snapshot finish, then read the committed state.
        await activeRead;
        await refresh();
        return !disposed;
      } catch (error) {
        if (!disposed) onError(error instanceof Error ? error : new Error("The change could not be saved."));
        // A dropped response does not prove a write failed. Read saved state
        // before allowing the user to decide whether to submit again.
        await activeRead;
        await refresh();
        return false;
      } finally {
        writing = false;
      }
    },
    dispose() { disposed = true; controller.abort(); },
  };
}
