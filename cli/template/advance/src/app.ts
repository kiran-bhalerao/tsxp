import { App } from '@tsxp/core'
import { json, urlencoded } from 'express'
import { Admin } from 'src/controllers/admin'
import { Home } from 'src/controllers/home'

export const { app, listen } = new App({
  prefix: '/api',
  middlewares: [json(), urlencoded({ extended: true })],
  controllers: [Home, Admin],
  // if you dont wanna do "Auth with context option", remove 👇
  // or you can uncomment the below line and hover over it to see docs
  // context(req) {}
})
