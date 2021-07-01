import { Controller, Get } from "@tsxp/core";
import { Request, Response } from "express";

@Controller("/home")
export class Home {
  constructor() {}

  @Get("/")
  async home(_req: Request, res: Response) {
    return res.send("Welcome home!");
  }
}
