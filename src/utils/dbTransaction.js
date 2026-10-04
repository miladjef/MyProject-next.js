import mongoose from "mongoose";
import connectToDB from "@/configs/db";

const transactionCapable = () => {
  const type = mongoose.connection?.client?.topology?.description?.type || "";
  return type === "ReplicaSetWithPrimary" || type === "Sharded";
};

const runWithTransaction = async (work, fallback) => {
  await connectToDB();
  if (!transactionCapable()) {
    if (fallback) return fallback();
    return work(null);
  }

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    }, {
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" },
    });
    return result;
  } finally {
    await session.endSession();
  }
};

export { runWithTransaction, transactionCapable };
