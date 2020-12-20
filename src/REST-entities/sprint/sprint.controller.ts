import { Request, Response } from "express";
import { DateTime } from "luxon";
import {
  IUser,
  IProject,
  IProjectPopulated,
  ISprintPopulated,
} from "../../helpers/typescript-helpers/interfaces";
import SprintModel from "./sprint.model";
import ProjectModel from "../project/project.model";

export const addSprint = async (req: Request, res: Response) => {
  const user = req.user;
  const { title, endDate, duration } = req.body;
  const { projectId } = req.params;
  const project = await ProjectModel.findById(projectId);
  if (
    !project ||
    !(user as IUser).projects.find(
      (userProjectId) => userProjectId.toString() === projectId
    )
  ) {
    return res.status(404).send({ message: "Project not found" });
  }
  const endDateArr = endDate.split("-");
  const endDateObj = DateTime.local(
    Number(endDateArr[0]),
    Number(endDateArr[1]),
    Number(endDateArr[2])
  );
  const startDate = endDateObj.minus({ days: duration - 1 }).toLocaleString();
  const sprint = await SprintModel.create({
    title,
    startDate,
    endDate,
    duration,
    projectId,
    tasks: [],
  });
  (project as IProjectPopulated).sprints.push(sprint as ISprintPopulated);
  await (project as IProject).save();
  return res.status(201).send({
    title: sprint.title,
    startDate: sprint.startDate,
    endDate: sprint.endDate,
    duration: sprint.duration,
    id: sprint._id,
  });
};
