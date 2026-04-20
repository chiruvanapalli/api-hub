import { Router } from "express";
import {
  cancelOrder,
  generatePaypalOrder,
  generateRazorpayOrder,
  getMyOrders,
  getOrderById,
  getOrderListAdmin,
  updateOrderStatus,
  verifyPaypalPayment,
  verifyRazorpayPayment,
} from "../../../controllers/apps/ecommerce/order.controllers.js";
import {
  verifyPermission,
  verifyJWT,
} from "../../../middlewares/auth.middlewares.js";
import {
  orderUpdateStatusValidator,
  verifyPaypalPaymentValidator,
  verifyRazorpayPaymentValidator,
} from "../../../validators/apps/ecommerce/order.validators.js";
import { validate } from "../../../validators/validate.js";
import { UserRolesEnum } from "../../../constants.js";
import {
  mongoIdPathVariableValidator,
  mongoIdRequestBodyValidator,
} from "../../../validators/common/mongodb.validators.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/provider/razorpay")
  .post(
    mongoIdRequestBodyValidator("addressId"),
    validate,
    generateRazorpayOrder
  );
router
  .route("/provider/paypal")
  .post(
    mongoIdRequestBodyValidator("addressId"),
    validate,
    generatePaypalOrder
  );

router
  .route("/provider/razorpay/verify-payment")
  .post(verifyRazorpayPaymentValidator(), validate, verifyRazorpayPayment);

router
  .route("/provider/paypal/verify-payment")
  .post(verifyPaypalPaymentValidator(), validate, verifyPaypalPayment);

router.route("/").get(getMyOrders);

router
  .route("/:orderId")
  .get(mongoIdPathVariableValidator("orderId"), validate, getOrderById);

router
  .route("/:orderId/cancel")
  .patch(mongoIdPathVariableValidator("orderId"), validate, cancelOrder);

router
  .route("/list/admin")
  .get(verifyPermission([UserRolesEnum.ADMIN]), getOrderListAdmin);
router
  .route("/status/:orderId")
  .patch(
    verifyPermission([UserRolesEnum.ADMIN]),
    mongoIdPathVariableValidator("orderId"),
    orderUpdateStatusValidator(),
    validate,
    updateOrderStatus
  );

export default router;
