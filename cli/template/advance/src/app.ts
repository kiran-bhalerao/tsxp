import { App } from '@tsxp/core'
import { Home } from 'src/controllers/home'

export const { app, listen } = new App({
  prefix: '/api',
  controllers: [Home]
})
