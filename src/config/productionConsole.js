if (import.meta.env.PROD) {
  ["log", "info", "warn", "error", "debug", "trace"].forEach((method) => {
    console[method] = () => {};
  });
}
