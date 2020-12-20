import { Request, Response } from "express";
import { DateTime } from "luxon";
import {
  IUser,
  ISprintPopulated,
} from "../../helpers/typescript-helpers/interfaces";
import SprintModel from "../sprint/sprint.model";
import TaskModel from "./task.model";

export const addTask = async (req: Request, res: Response) => {
  const user = req.user;
  const { title, hoursPlanned } = req.body;
  const { sprintId } = req.params;
  const sprint = await SprintModel.findOne({ _id: sprintId });
  if (
    !sprint ||
    !(user as IUser).projects.find(
      (projectId) => projectId.toString() === sprint.projectId.toString()
    )
  ) {
    return res.status(404).send({ message: "Sprint not found" });
  }
  const hoursWastedPerDay: {
    currentDay: string;
    singleHoursWasted: number;
  }[] = [];
  const startDateArr = sprint.startDate.split("-");
  const startDateObj = DateTime.local(
    Number(startDateArr[0]),
    Number(startDateArr[1]),
    Number(startDateArr[2])
  );
  for (let i = 0; i < sprint.duration; i++) {
    hoursWastedPerDay.push({
      currentDay: startDateObj.plus({ days: i }).toLocaleString(),
      singleHoursWasted: 0,
    });
  }
  const task = await TaskModel.create({
    title,
    hoursPlanned,
    hoursWasted: 0,
    hoursWastedPerDay,
  });
  (sprint as ISprintPopulated).tasks.push(task);
  await sprint.save();
  return res.status(201).send({
    title,
    hoursPlanned,
    hoursWasted: 0,
    id: task._id,
    hoursWastedPerDay,
  });
};
