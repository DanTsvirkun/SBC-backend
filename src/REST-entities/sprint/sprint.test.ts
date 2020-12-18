import mongoose from "mongoose";
import supertest, { Response } from "supertest";
import { Application } from "express";
import {
  IProject,
  IProjectPopulated,
  ISprint,
  ISprintPopulated,
} from "../../helpers/typescript-helpers/interfaces";
import Server from "../../server/server";
import UserModel from "../user/user.model";
import SessionModel from "../session/session.model";
import ProjectModel from "../project/project.model";
import SprintModel from "../sprint/sprint.model";

describe("Sprint router test suite", () => {
  let app: Application;
  let response: Response;
  let secondResponse: Response;
  let thirdResponse: Response;
  let fourthResponse: Response;
  let createdSprint: ISprint | ISprintPopulated | null;
  let createdProject: IProject | IProjectPopulated | null;
  let accessToken: string;
  let secondAccessToken: string;

  beforeAll(async () => {
    app = new Server().startForTesting();
    const url = `mongodb://127.0.0.1/sprint`;
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
    await supertest(app)
      .post("/auth/register")
      .send({ email: "testt@email.com", password: "qwerty123" });
    fourthResponse = await supertest(app)
      .post("/auth/login")
      .send({ email: "testt@email.com", password: "qwerty123" });
    secondAccessToken = fourthResponse.body.accessToken;
    createdProject = await ProjectModel.findOne({ _id: thirdResponse.body.id });
  });

  afterAll(async () => {
    await UserModel.deleteOne({ email: response.body.email });
    await SessionModel.deleteOne({ _id: secondResponse.body.sid });
    await ProjectModel.deleteOne({
      _id: thirdResponse.body.id,
    });
    await mongoose.connection.close();
  });

  describe("POST /sprint", () => {
    let response: Response;
    let updatedProject: IProject | IProjectPopulated | null;

    const validReqBody = {
      title: "Test",
      endDate: "2020-12-31",
      duration: 1,
    };

    const invalidReqBody = {
      title: "Test",
      endDate: "2020-12-31",
    };

    const secondInvalidReqBody = {
      title: "Test",
      endDate: "2020-13-31",
      duration: 1,
    };

    const thirdInvalidReqBody = {
      title: "Test",
      endDate: "2020-12-31",
      duration: 0,
    };

    it("Init endpoint testing", () => {
      expect(true).toBe(true);
    });

    context("With validReqBody", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .post(`/sprint/${(createdProject as IProject)._id}`)
          .set("Authorization", `Bearer ${accessToken}`)
          .send(validReqBody);
        createdSprint = await SprintModel.findOne({ _id: response.body.id });
        updatedProject = await ProjectModel.findOne({
          _id: (createdProject as IProject)._id,
        });
      });

      it("Should return a 201 status code", () => {
        expect(response.status).toBe(201);
      });

      it("Should return an expected result", () => {
        expect(response.body).toEqual({
          title: validReqBody.title,
          endDate: validReqBody.endDate,
          duration: validReqBody.duration,
          startDate: "2020-12-30",
          id: (createdSprint as ISprint)._id.toString(),
        });
      });

      it("Should create a new sprint in DB", () => {
        expect(createdSprint).toBeTruthy();
      });

      it("Should add a new sprint to project in DB", () => {
        expect((updatedProject as IProject).sprints[0]).toEqual(
          (createdSprint as ISprint)._id
        );
      });
    });

    context("With invalidReqBody (no 'duration' provided)", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .post(`/sprint/${(createdProject as IProject)._id}`)
          .set("Authorization", `Bearer ${accessToken}`)
          .send(invalidReqBody);
      });

      it("Should return a 400 status code", () => {
        expect(response.status).toBe(400);
      });

      it("Should say that 'duration' is required", () => {
        expect(response.body.message).toBe('"duration" is required');
      });
    });

    context("With secondInvalidReqBody (no 'duration' provided)", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .post(`/sprint/${(createdProject as IProject)._id}`)
          .set("Authorization", `Bearer ${accessToken}`)
          .send(secondInvalidReqBody);
      });

      it("Should return a 400 status code", () => {
        expect(response.status).toBe(400);
      });

      it("Should say that 'date' is invalid", () => {
        expect(response.body.message).toBe(
          "Invalid 'date'. Please, use YYYY-MM-DD string format"
        );
      });
    });

    context("With thirdInvalidReqBody ('duration' is below 1)", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .post(`/sprint/${(createdProject as IProject)._id}`)
          .set("Authorization", `Bearer ${accessToken}`)
          .send(thirdInvalidReqBody);
      });

      it("Should return a 400 status code", () => {
        expect(response.status).toBe(400);
      });

      it("Should say that 'duration' must be greater than or equal to 1", () => {
        expect(response.body.message).toBe(
          '"duration" must be greater than or equal to 1'
        );
      });
    });

    context("Without providing 'accessToken'", () => {
      beforeAll(async () => {
        response = await supertest(app).post("/project").send(validReqBody);
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
          .post(`/sprint/${(createdProject as IProject)._id}`)
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

    context("With invalid 'projectId'", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .post(`/sprint/qwerty123`)
          .set("Authorization", `Bearer ${accessToken}`)
          .send(validReqBody);
      });

      it("Should return a 400 status code", () => {
        expect(response.status).toBe(400);
      });

      it("Should say that 'projectId' is invalid", () => {
        expect(response.body.message).toBe(
          "Invalid 'projectId'. Must be a MongoDB ObjectId"
        );
      });
    });

    context("With another account", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .post(`/sprint/${(createdProject as IProject)._id}`)
          .set("Authorization", `Bearer ${secondAccessToken}`)
          .send(validReqBody);
      });

      it("Should return a 404 status code", () => {
        expect(response.status).toBe(404);
      });

      it("Should say that project wasn't found", () => {
        expect(response.body.message).toBe("Project not found");
      });
    });
  });
});
