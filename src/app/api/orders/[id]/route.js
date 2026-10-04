import { isValidObjectId } from "mongoose";
import connectToDB from "@/configs/db";
import OrderModel from "@/models/Order";
import PaymentModel from "@/models/Payment";
import ProductModel from "@/models/Product";
import DiscountModel from "@/models/Discount";
import { authUser, authAdmin } from "@/utils/serverHelpers";
import { runWithTransaction } from "@/utils/dbTransaction";
import { canTransitionOrder, canTransitionPayment, validateOrderPaymentPair } from "@/utils/orderState.mjs";
import { safeServerError } from "@/utils/apiError";
import { releaseDiscountForUser } from "@/utils/discountUsage";

export async function GET(_req, { params }) {
  try {
    await connectToDB();
    const user = await authUser();
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    if (!isValidObjectId(id)) return Response.json({ message: "Invalid order id" }, { status: 400 });
    const filter = user.role === "ADMIN" ? { _id: id } : { _id: id, user: user._id };
    const order = await OrderModel.findOne(filter).lean();
    if (!order) return Response.json({ message: "Order not found" }, { status: 404 });
    return Response.json(order);
  } catch (err) {
    return safeServerError(err, "orders.get");
  }
}

export async function PATCH(req, { params }) {
  try {
    await connectToDB();
    const admin = await authAdmin();
    if (!admin) return Response.json({ message: "Forbidden" }, { status: 403 });
    const { id } = await params;
    if (!isValidObjectId(id)) return Response.json({ message: "Invalid order id" }, { status: 400 });

    const { status, paymentStatus, paymentReference = "", trackingCode, note = "" } = await req.json();
    const allowedStatus = ["PENDING", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"];
    const allowedPayment = ["UNPAID", "PENDING", "PAID", "FAILED", "REFUNDED"];
    if (status && !allowedStatus.includes(status)) return Response.json({ message: "Invalid order status" }, { status: 400 });
    if (paymentStatus && !allowedPayment.includes(paymentStatus)) return Response.json({ message: "Invalid payment status" }, { status: 400 });

    const updated = await runWithTransaction(async (session) => {
      const order = await OrderModel.findById(id).session(session);
      if (!order) return null;
      const nextStatus = status || order.status;
      const nextPayment = paymentStatus || order.paymentStatus;
      if (!canTransitionOrder(order.status, nextStatus)) throw Object.assign(new Error("Invalid order status transition"), { statusCode: 409 });
      if (!canTransitionPayment(order.paymentStatus, nextPayment)) throw Object.assign(new Error("Invalid payment status transition"), { statusCode: 409 });
      if (!validateOrderPaymentPair(nextStatus, nextPayment, order.paymentMethod)) throw Object.assign(new Error("Order and payment statuses are inconsistent"), { statusCode: 409 });

      const cancelling = nextStatus === "CANCELLED" && order.status !== "CANCELLED";
      if (cancelling) {
        for (const item of order.items) {
          await ProductModel.updateOne({ _id: item.product, inventoryTracked: true }, { $inc: { stock: item.count } }, session ? { session } : {});
        }
        if (order.discountCode) {
          const discount = await DiscountModel.findOneAndUpdate({ code: order.discountCode, uses: { $gt: 0 } }, { $inc: { uses: -1 } }, { new: true, ...(session ? { session } : {}) });
          if (discount) await releaseDiscountForUser({ discountId: discount._id, userId: order.user, session });
        }
      }

      order.status = nextStatus;
      order.paymentStatus = nextPayment;
      if (trackingCode !== undefined) order.trackingCode = String(trackingCode || "").trim().slice(0, 120);
      order.statusHistory.push({ status: nextStatus, paymentStatus: nextPayment, changedBy: admin._id, note: String(note || "").trim().slice(0, 500) });
      await order.save(session ? { session } : {});

      if (paymentStatus) {
        const mapped = paymentStatus === "UNPAID" ? "PENDING" : paymentStatus;
        await PaymentModel.findOneAndUpdate(
          { order: order._id },
          { $set: { status: mapped, reference: String(paymentReference || "").slice(0, 180) } },
          { new: true, ...(session ? { session } : {}) }
        );
      }
      return order.toObject();
    });

    if (!updated) return Response.json({ message: "Order not found" }, { status: 404 });
    return Response.json({ message: "Order updated successfully", order: updated });
  } catch (err) {
    if (err?.statusCode) return Response.json({ message: err.message }, { status: err.statusCode });
    return safeServerError(err, "orders.update");
  }
}
