import { Router } from "express";
import itemController from "../controllers/items";
import { authenticate } from "../middlewares/auth";
import { itemValidation } from "../middlewares/validate";

const router = Router();

router.get("/", itemValidation.list, itemController.list.bind(itemController));

router.get(
  "/mine",
  authenticate,
  itemController.listUserItems.bind(itemController),
);

router.get(
  "/:id",
  itemValidation.idParam,
  itemController.get.bind(itemController),
);

router.post(
  "/",
  authenticate,
  itemValidation.create,
  itemController.create.bind(itemController),
);

router.patch(
  "/:id",
  authenticate,
  itemValidation.idParam,
  itemValidation.update,
  itemController.update.bind(itemController),
);

router.put(
  "/:id",
  authenticate,
  itemValidation.idParam,
  itemValidation.update,
  itemController.update.bind(itemController),
);

router.patch(
  "/:id/resolve",
  authenticate,
  itemValidation.idParam,
  itemController.resolve.bind(itemController),
);

router.delete(
  "/:id",
  authenticate,
  itemValidation.idParam,
  itemController.delete.bind(itemController),
);

export default router;
