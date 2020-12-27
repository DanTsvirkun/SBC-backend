import { Router } from "express";
import mongoose from "mongoose";
import Joi from "joi";
import { authorize } from "../../auth/auth.controller";
import tryCatchWrapper from "../../helpers/function-helpers/try-catch-wrapper";
import validate from "../../helpers/function-helpers/validate";
import {
  addTask,
  loadTasks,
  changeWastedHours,
  deleteTask,
} from "./task.controller";

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

const taskIdSchema = Joi.object({
  taskId: Joi.string()
    .custom((value, helpers) => {
      const isValidObjectId = mongoose.Types.ObjectId.isValid(value);
      if (!isValidObjectId) {
        return helpers.message({
          custom: "Invalid 'taskId'. Must be a MongoDB ObjectId",
        });
      }
      return value;
    })
    .required(),
});

const taskQuerySchema = Joi.object({
  search: Joi.string(),
});

const taskHoursSchema = Joi.object({
  date: Joi.string()
    .custom((value, helpers) => {
      const dateRegex = /^\d{4}\-([1-9]|1[012])\-([1-9]|[12][0-9]|3[01])$/;
      const isValidDate = dateRegex.test(value);
      if (!isValidDate) {
        return helpers.message({
          custom: "Invalid 'date'. Please, use YYYY-MM-DD string format",
        });
      }
      return value;
    })
    .required(),
  hours: Joi.number().required().min(0).max(8),
});

const router = Router();

router.post(
  "/:sprintId",
  tryCatchWrapper(authorize),
  validate(addTaskIdSchema, "params"),
  validate(addTaskSchema),
  tryCatchWrapper(addTask)
);
router.get(
  "/:sprintId",
  tryCatchWrapper(authorize),
  validate(addTaskIdSchema, "params"),
  validate(taskQuerySchema, "query"),
  tryCatchWrapper(loadTasks)
);
router.patch(
  "/:taskId",
  tryCatchWrapper(authorize),
  validate(taskIdSchema, "params"),
  validate(taskHoursSchema),
  tryCatchWrapper(changeWastedHours)
);
router.delete(
  "/:taskId",
  tryCatchWrapper(authorize),
  validate(taskIdSchema, "params"),
  tryCatchWrapper(deleteTask)
);

export default router;
