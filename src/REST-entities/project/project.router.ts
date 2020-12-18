import { Router } from "express";
import Joi from "joi";
import { authorize } from "./../../auth/auth.controller";
import tryCatchWrapper from "../../helpers/function-helpers/try-catch-wrapper";
import validate from "../../helpers/function-helpers/validate";
import { addProject } from "./project.contoller";

const addProjectSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
});

const router = Router();

router.post(
  "/",
  tryCatchWrapper(authorize),
  validate(addProjectSchema),
  tryCatchWrapper(addProject)
);

export default router;
