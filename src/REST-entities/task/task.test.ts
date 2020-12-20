import mongoose from "mongoose";
import supertest, { Response } from "supertest";
import { Application } from "express";
import {
  IProject,
  IProjectPopulated,
  ISprint,
  ISprintPopulated,
  ITask,
} from "../../helpers/typescript-helpers/interfaces";
import Server from "../../server/server";
import UserModel from "../user/user.model";
import SessionModel from "../session/session.model";
import ProjectModel from "../project/project.model";
import SprintModel from "../sprint/sprint.model";
import TaskModel from "../task/task.model";

describe("Task router test suite", () => {
  let app: Application;
  let response: Response;
  let secondResponse: Response;
  let thirdResponse: Response;
  let fourthResponse: Response;
  let fifthResponse: Response;
  let createdSprint: ISprint | ISprintPopulated | null;
  let createdProject: IProject | IProjectPopulated | null;
  let updatedSprint: ISprint | ISprintPopulated | null;
  let createdTask: ITask | null;
  let accessToken: string;
  let secondAccessToken: string;

  beforeAll(async () => {
    app = new Server().startForTesting();
    const url = `mongodb://127.0.0.1/task`;
    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    });
    response = await supertest(app)
      .post("/auth/register")
      .send({ email: "test@email.com", password: "qwerty123" });
    secondResponse = await supertest(app)
      .post("/auth/login")
      .send({ email: "test@email.com", password: "qwerty123" });
    accessToken = secondResponse.body.accessToken;
    thirdResponse = await supertest(app)
      .post("/project")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Test", description: "Test" });
    createdProject = await ProjectModel.findOne({ _id: thirdResponse.body.id });
    fourthResponse = await supertest(app)
      .post(`/sprint/${(createdProject as IProject)._id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Test", endDate: "2020-12-31", duration: 3 });
    createdSprint = await SprintModel.findOne({ _id: fourthResponse.body.id });
    await supertest(app)
      .post("/auth/register")
      .send({ email: "testt@email.com", password: "qwerty123" });
    fifthResponse = await supertest(app)
      .post("/auth/login")
      .send({ email: "testt@email.com", password: "qwerty123" });
    secondAccessToken = fifthResponse.body.accessToken;
  });

  afterAll(async () => {
    await UserModel.deleteOne({ email: response.body.email });
    await SessionModel.deleteOne({ _id: secondResponse.body.sid });
    await ProjectModel.deleteOne({
      _id: thirdResponse.body.id,
    });
    await SprintModel.deleteOne({
      _id: fourthResponse.body.id,
    });
    await mongoose.connection.close();
  });

  describe("POST /task", () => {
    let response: Response;

    const validReqBody = {
      title: "Test",
      hoursPlanned: 1,
    };

    const invalidReqBody = {
      title: "Test",
    };

    const secondInvalidReqBody = {
      title: "Test",
      hoursPlanned: 0,
    };

    it("Init endpoint testing", () => {
      expect(true).toBe(true);
    });

    context("With validReqBody", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .post(`/task/${(createdSprint as ISprint)._id}`)
          .set("Authorization", `Bearer ${accessToken}`)
          .send(validReqBody);
        createdTask = await TaskModel.findOne({ _id: response.body.id });
        updatedSprint = await SprintModel.findOne({
          _id: (createdSprint as ISprint)._id,
        });
      });

      it("Should return a 201 status code", () => {
        expect(response.status).toBe(201);
      });

      it("Should return an expected result", () => {
        expect(response.body).toEqual({
          title: validReqBody.title,
          hoursPlanned: validReqBody.hoursPlanned,
          hoursWasted: 0,
          hoursWastedPerDay: [
            { currentDay: "2020-12-29", singleHoursWasted: 0 },
            { currentDay: "2020-12-30", singleHoursWasted: 0 },
            { currentDay: "2020-12-31", singleHoursWasted: 0 },
          ],
          id: (createdTask as ITask)._id.toString(),
        });
      });

      it("Should create a new task in DB", () => {
        expect(createdTask).toBeTruthy();
      });

      it("Should add a new task to sprint in DB", () => {
        expect((updatedSprint as ISprint).tasks[0]).toEqual(
          (createdTask as ITask)._id
        );
      });
    });

    context("With invalidReqBody (no 'hoursPlanned' provided)", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .post(`/task/${(createdSprint as ISprint)._id}`)
          .set("Authorization", `Bearer ${accessToken}`)
          .send(invalidReqBody);
      });

      it("Should return a 400 status code", () => {
        expect(response.status).toBe(400);
      });

      it("Should say that 'hoursPlanned' is required", () => {
        expect(response.body.message).toBe('"hoursPlanned" is required');
      });
    });

    context("With secondInvalidReqBody ('hoursPlanned' is below 1)", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .post(`/task/${(createdSprint as ISprint)._id}`)
          .set("Authorization", `Bearer ${accessToken}`)
          .send(secondInvalidReqBody);
      });

      it("Should return a 400 status code", () => {
        expect(response.status).toBe(400);
      });

      it("Should say that 'hoursPlanned' must be greater than or equal to 1", () => {
        expect(response.body.message).toBe(
          '"hoursPlanned" must be greater than or equal to 1'
        );
      });
    });

    context("Without providing 'accessToken'", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .post(`/task/${(createdSprint as ISprint)._id}`)
          .send(validReqBody);
      });

      it("Should return a 400 status code", () => {
        expect(response.status).toBe(400);
      });

      it("Should say that token wasn't provided", () => {
        expect(response.body.message).toBe("No token provided");
      });
    });

    context("With invalid 'accessToken'", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .post(`/task/${(createdSprint as ISprint)._id}`)
          .set("Authorization", `Bearer qwerty123`)
          .send(validReqBody);
      });

      it("Should return a 401 status code", () => {
        expect(response.status).toBe(401);
      });

      it("Should return an unauthorized status", () => {
        expect(response.body.message).toBe("Unauthorized");
      });
    });

    context("With invalid 'sprintId'", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .post(`/task/qwerty123`)
          .set("Authorization", `Bearer ${accessToken}`)
          .send(validReqBody);
      });

      it("Should return a 400 status code", () => {
        expect(response.status).toBe(400);
      });

      it("Should say that 'sprintId' is invalid", () => {
        expect(response.body.message).toBe(
          "Invalid 'sprintId'. Must be a MongoDB ObjectId"
        );
      });
    });

    context("With another account", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .post(`/task/${(createdSprint as ISprint)._id}`)
          .set("Authorization", `Bearer ${secondAccessToken}`)
          .send(validReqBody);
      });

      it("Should return a 404 status code", () => {
        expect(response.status).toBe(404);
      });

      it("Should say that sprint wasn't found", () => {
        expect(response.body.message).toBe("Sprint not found");
      });
    });
  });
});
