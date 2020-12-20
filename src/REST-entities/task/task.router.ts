import { Router } from "express";
import mongoose from "mongoose";
import Joi from "joi";
import { authorize } from "../../auth/auth.controller";
import tryCatchWrapper from "../../helpers/function-helpers/try-catch-wrapper";
import validate from "../../helpers/function-helpers/validate";
import { addTask } from "./task.controller";

const addTaskSchema = Joi.object({
  title: Joi.string().required(),
  hoursPlanned: Joi.number().required().min(1).max(8),
});

const addTaskIdSchema = Joi.object({
  sprintId: Joi.string()
    .custom((value, helpers) => {
      const isValidObjectId = mongoose.Types.ObjectId.isValid(value);
      if (!isValidObjectId) {
        return helpers.message({
          custom: "Invalid 'sprintId'. Must be a MongoDB ObjectId",
        });
      }
      return value;
    })
    .required(),
});

const router = Router();

router.post(
  "/:sprintId",
  tryCatchWrapper(authorize),
  validate(addTaskIdSchema, "params"),
  validate(addTaskSchema),
  tryCatchWrapper(addTask)
);

export default router;
