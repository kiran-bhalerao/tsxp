import { App } from "@tsxp/core";
import { Home } from "./controllers/home";

const app = new App({
  controllers: [Home],
});

app.listen();
