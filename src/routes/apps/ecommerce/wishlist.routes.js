import { Router } from "express";
import {
  getWishlist,
  moveItemToCart,
  toggleWishlistItem,
} from "../../../controllers/apps/ecommerce/wishlist.controllers.js";
import { verifyJWT } from "../../../middlewares/auth.middlewares.js";
import { mongoIdPathVariableValidator } from "../../../validators/common/mongodb.validators.js";
import { validate } from "../../../validators/validate.js";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getWishlist);

router
  .route("/item/:productId")
  .post(
    mongoIdPathVariableValidator("productId"),
    validate,
    toggleWishlistItem
  );

router
  .route("/item/:productId/move-to-cart")
  .post(mongoIdPathVariableValidator("productId"), validate, moveItemToCart);

export default router;
