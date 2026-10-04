import { isValidObjectId } from "mongoose";
import connectToDB from "@/configs/db";
import OrderModel from "@/models/Order";
import PaymentModel from "@/models/Payment";
import ProductModel from "@/models/Product";
import DiscountModel from "@/models/Discount";
import { authUser, authAdmin } from "@/utils/serverHelpers";

export async function GET(_req, { params }) {
  await connectToDB();
  const user = await authUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!isValidObjectId(id)) return Response.json({ message: "Invalid order id" }, { status: 400 });
  const filter = user.role === "ADMIN" ? { _id: id } : { _id: id, user: user._id };
  const order = await OrderModel.findOne(filter).lean();
  if (!order) return Response.json({ message: "Order not found" }, { status: 404 });
  return Response.json(order);
}

export async function PATCH(req, { params }) {
  await connectToDB();
  const admin = await authAdmin();
  if (!admin) return Response.json({ message: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (!isValidObjectId(id)) return Response.json({ message: "Invalid order id" }, { status: 400 });

  const { status, paymentStatus, paymentReference = "" } = await req.json();
  const allowedStatus = ["PENDING", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"];
  const allowedPayment = ["UNPAID", "PENDING", "PAID", "FAILED", "REFUNDED"];
  if (status && !allowedStatus.includes(status)) return Response.json({ message: "Invalid order status" }, { status: 400 });
  if (paymentStatus && !allowedPayment.includes(paymentStatus)) return Response.json({ message: "Invalid payment status" }, { status: 400 });

  const order = await OrderModel.findById(id);
  if (!order) return Response.json({ message: "Order not found" }, { status: 404 });
  const wasCancelled = order.status === "CANCELLED";
  if (wasCancelled && status && status !== "CANCELLED") {
    return Response.json({ message: "Cancelled orders cannot be reopened" }, { status: 409 });
  }

  if (status === "CANCELLED" && !wasCancelled) {
    for (const item of order.items) {
      await ProductModel.updateOne({ _id: item.product, inventoryTracked: true }, { $inc: { stock: item.count } });
    }
    if (order.discountCode) {
      await DiscountModel.updateOne({ code: order.discountCode, uses: { $gt: 0 } }, { $inc: { uses: -1 } });
    }
  }

  if (status) order.status = status;
  if (paymentStatus) order.paymentStatus = paymentStatus;
  await order.save();

  if (paymentStatus) {
    await PaymentModel.findOneAndUpdate(
      { order: order._id },
      { $set: { status: paymentStatus === "UNPAID" ? "PENDING" : paymentStatus, reference: String(paymentReference || "").slice(0, 180) } },
      { new: true }
    );
  }

  return Response.json({ message: "Order updated successfully" });
}
