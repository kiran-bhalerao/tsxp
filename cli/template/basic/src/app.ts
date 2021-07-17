import { App } from "@tsxp/core";
import { json, urlencoded } from "express";
import { Home } from "./controllers/home";

const app = new App({
  middlewares: [json(), urlencoded({ extended: true })],
  controllers: [Home],
});

app.listen();
