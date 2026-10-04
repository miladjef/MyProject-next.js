const safeDecodeURIComponent = (value) => {
  const raw = String(value ?? "");
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

export { safeDecodeURIComponent };
