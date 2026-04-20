import mongoose from "mongoose";
import { Cart } from "../../../models/apps/ecommerce/cart.models.js";
import { Product } from "../../../models/apps/ecommerce/product.models.js";
import { Wishlist } from "../../../models/apps/ecommerce/wishlist.models.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";

const getWishlistAggregate = async (userId) => {
  const result = await Wishlist.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(userId) } },
    { $unwind: { path: "$items", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "products",
        localField: "items.productId",
        foreignField: "_id",
        as: "items.product",
      },
    },
    { $addFields: { "items.product": { $first: "$items.product" } } },
    {
      $group: {
        _id: "$_id",
        items: {
          $push: {
            $cond: [
              { $ifNull: ["$items.productId", false] },
              { _id: "$items._id", product: "$items.product" },
              "$$REMOVE",
            ],
          },
        },
      },
    },
  ]);

  return result[0] ?? { _id: null, items: [] };
};

const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getWishlistAggregate(req.user._id);
  return res
    .status(200)
    .json(new ApiResponse(200, wishlist, "Wishlist fetched successfully"));
});

const toggleWishlistItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product does not exist");
  }

  let wishlist = await Wishlist.findOne({ owner: req.user._id });

  if (!wishlist) {
    wishlist = await Wishlist.create({ owner: req.user._id, items: [] });
  }

  const existingItem = wishlist.items.find(
    (item) => item.productId.toString() === productId
  );

  let message;
  if (existingItem) {
    wishlist.items = wishlist.items.filter(
      (item) => item.productId.toString() !== productId
    );
    message = "Removed from wishlist";
  } else {
    wishlist.items.push({ productId });
    message = "Added to wishlist";
  }

  await wishlist.save({ validateBeforeSave: false });

  const updatedWishlist = await getWishlistAggregate(req.user._id);
  return res.status(200).json(new ApiResponse(200, updatedWishlist, message));
});

const moveItemToCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product does not exist");
  }

  if (product.stock < 1) {
    throw new ApiError(400, "Product is out of stock");
  }

  const wishlist = await Wishlist.findOne({ owner: req.user._id });
  const inWishlist = wishlist?.items.some(
    (item) => item.productId.toString() === productId
  );

  if (!inWishlist) {
    throw new ApiError(400, "Product is not in wishlist");
  }

  // Add to cart
  const cart = await Cart.findOne({ owner: req.user._id });
  const existingCartItem = cart.items.find(
    (item) => item.productId.toString() === productId
  );
  if (existingCartItem) {
    existingCartItem.quantity += 1;
  } else {
    cart.items.push({ productId, quantity: 1 });
  }
  await cart.save({ validateBeforeSave: false });

  // Remove from wishlist
  wishlist.items = wishlist.items.filter(
    (item) => item.productId.toString() !== productId
  );
  await wishlist.save({ validateBeforeSave: false });

  const updatedWishlist = await getWishlistAggregate(req.user._id);
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedWishlist, "Item moved to cart successfully")
    );
});

export { getWishlist, toggleWishlistItem, moveItemToCart };
