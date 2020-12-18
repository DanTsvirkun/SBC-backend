import mongoose from "mongoose";
import supertest, { Response } from "supertest";
import { Application } from "express";
import {
  IUser,
  IUserPopulated,
  IProject,
  IProjectPopulated,
} from "../../helpers/typescript-helpers/interfaces";
import Server from "../../server/server";
import UserModel from "../user/user.model";
import SessionModel from "../session/session.model";
import ProjectModel from "../project/project.model";

describe("Project router test suite", () => {
  let app: Application;
  let response: Response;
  let secondResponse: Response;
  let createdUser: IUser | IUserPopulated | null;
  let createdProject: IProject | IProjectPopulated | null;
  let accessToken: string;

  beforeAll(async () => {
    app = new Server().startForTesting();
    const url = `mongodb://127.0.0.1/project`;
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
    createdUser = await UserModel.findOne({ _id: response.body.id });
  });

  afterAll(async () => {
    await UserModel.deleteOne({ email: response.body.email });
    await SessionModel.deleteOne({ _id: secondResponse.body.sid });
    await mongoose.connection.close();
  });

  describe("POST /project", () => {
    let response: Response;
    let updatedUser: IUser | IUserPopulated | null;

    const validReqBody = {
      title: "Test",
      description: "Test",
    };

    const invalidReqBody = {
      title: "Test",
    };

    it("Init endpoint testing", () => {
      expect(true).toBe(true);
    });

    context("With validReqBody", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .post("/project")
          .set("Authorization", `Bearer ${accessToken}`)
          .send(validReqBody);
        createdProject = await ProjectModel.findOne({ _id: response.body.id });
        updatedUser = await UserModel.findOne({
          _id: (createdUser as IUser)._id,
        });
      });

      it("Should return a 201 status code", () => {
        expect(response.status).toBe(201);
      });

      it("Should return an expected result", () => {
        expect(response.body).toEqual({
          title: validReqBody.title,
          description: validReqBody.description,
          id: (createdProject as IProject)._id.toString(),
        });
      });

      it("Should create a new project in DB", () => {
        expect(createdProject).toBeTruthy();
      });

      it("Should add a new project to user in DB", () => {
        expect((updatedUser as IUser).projects[0]).toEqual(
          (createdProject as IProject)._id
        );
      });
    });

    context("With invalidReqBody (no 'description' provided)", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .post("/project")
          .set("Authorization", `Bearer ${accessToken}`)
          .send(invalidReqBody);
      });

      it("Should return a 400 status code", () => {
        expect(response.status).toBe(400);
      });

      it("Should say that 'description' is required", () => {
        expect(response.body.message).toBe('"description" is required');
      });
    });

    context("With invalidReqBody (no 'description' provided)", () => {
      beforeAll(async () => {
        response = await supertest(app)
          .post("/project")
          .set("Authorization", `Bearer ${accessToken}`)
          .send(invalidReqBody);
      });

      it("Should return a 400 status code", () => {
        expect(response.status).toBe(400);
      });

      it("Should say that 'description' is required", () => {
        expect(response.body.message).toBe('"description" is required');
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
          .post("/project")
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
  });
});
