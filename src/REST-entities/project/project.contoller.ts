import ProjectModel from "./project.model";
import { Request, Response } from "express";
import {
  IUser,
  IUserPopulated,
  IProjectPopulated,
} from "../../helpers/typescript-helpers/interfaces";

export const addProject = async (req: Request, res: Response) => {
  const user = req.user;
  const { title, description } = req.body;
  const project = await ProjectModel.create({
    title,
    description,
    members: [],
    sprints: [],
  });
  (user as IUserPopulated).projects.push(project as IProjectPopulated);
  await (user as IUser).save();
  res.status(201).send({
    title: project.title,
    description: project.description,
    id: project._id,
  });
};
