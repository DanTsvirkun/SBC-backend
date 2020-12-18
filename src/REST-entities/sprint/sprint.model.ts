import mongoose, { Schema } from "mongoose";
import {
  ISprint,
  ISprintPopulated,
} from "../../helpers/typescript-helpers/interfaces";

const sprintSchema = new Schema({
  title: String,
  duration: Number,
  startDate: String,
  endDate: String,
  tasks: [{ type: mongoose.Types.ObjectId, ref: "Task" }],
});

export default mongoose.model<ISprint | ISprintPopulated>(
  "Sprint",
  sprintSchema
);
