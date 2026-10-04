const activeProductFilter = {
  $or: [
    { status: "ACTIVE" },
    { status: { $exists: false } },
    { status: null },
  ],
};

export { activeProductFilter };
