import { Router } from "express";
import mongoose from "mongoose";
import Joi from "joi";
import { authorize } from "../../auth/auth.controller";
import tryCatchWrapper from "../../helpers/function-helpers/try-catch-wrapper";
import validate from "../../helpers/function-helpers/validate";
import { addSprint } from "./sprint.controller";

const addSprintSchema = Joi.object({
  title: Joi.string().required(),
  endDate: Joi.string()
    .custom((value, helpers) => {
      const dateRegex = /^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/;
      const isValidDate = dateRegex.test(value);
      if (!isValidDate) {
        return helpers.message({
          custom: "Invalid 'date'. Please, use YYYY-MM-DD string format",
        });
      }
      return value;
    })
    .required(),
  duration: Joi.number().required().min(1),
});

const addSprintIdSchema = Joi.object({
  projectId: Joi.string()
    .custom((value, helpers) => {
      const isValidObjectId = mongoose.Types.ObjectId.isValid(value);
      if (!isValidObjectId) {
        return helpers.message({
          custom: "Invalid 'projectId'. Must be a MongoDB ObjectId",
        });
      }
      return value;
    })
    .required(),
});

const router = Router();

router.post(
  "/:projectId",
  tryCatchWrapper(authorize),
  validate(addSprintIdSchema, "params"),
  validate(addSprintSchema),
  tryCatchWrapper(addSprint)
);

export default router;
