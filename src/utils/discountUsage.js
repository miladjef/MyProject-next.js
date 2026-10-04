import DiscountUsageModel from "@/models/DiscountUsage";

const consumeDiscountForUser = async ({ discount, userId, session = null }) => {
  const limit = Math.max(1, Number(discount.perUserLimit || 1));
  const opts = session ? { session } : {};
  const existing = await DiscountUsageModel.findOne({ discount: discount._id, user: userId }).session(session);
  if (existing) {
    const updated = await DiscountUsageModel.findOneAndUpdate(
      { _id: existing._id, count: { $lt: limit } },
      { $inc: { count: 1 } },
      { new: true, ...opts }
    );
    return Boolean(updated);
  }
  try {
    const entry = new DiscountUsageModel({ discount: discount._id, user: userId, count: 1 });
    await entry.save(opts);
    return true;
  } catch (error) {
    if (error?.code !== 11000) throw error;
    const updated = await DiscountUsageModel.findOneAndUpdate(
      { discount: discount._id, user: userId, count: { $lt: limit } },
      { $inc: { count: 1 } },
      { new: true, ...opts }
    );
    return Boolean(updated);
  }
};

const releaseDiscountForUser = async ({ discountId, userId, session = null }) => {
  if (!discountId || !userId) return;
  const opts = session ? { session } : {};
  const updated = await DiscountUsageModel.findOneAndUpdate(
    { discount: discountId, user: userId, count: { $gt: 0 } },
    { $inc: { count: -1 } },
    { new: true, ...opts }
  );
  if (updated?.count === 0) await DiscountUsageModel.deleteOne({ _id: updated._id }, opts);
};

export { consumeDiscountForUser, releaseDiscountForUser };
