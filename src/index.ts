require("dotenv").config()
import fetch from "node-fetch"
import express from "express"
import nunjucks from "nunjucks"
import crypto from "crypto"
import path from "path"
import { Response, Request } from "express"
import { Dropbox, DropboxAuth } from "dropbox"
import { getUrl, accountsStore } from "./helpers"
import processMD from "./process-md"

const app = express()
app.use(express.raw({ type: "*/*" })) // raw data for
app.use(express.static(path.resolve(__dirname, "assets")))
app.set("view engine", "html")
app.set("views", path.join(__dirname, "../views"))

nunjucks.configure("views", {
  autoescape: true,
  express: app
})

const config = {
  fetch,
  clientId: process.env.APP_ID,
  clientSecret: process.env.APP_SECRET
}

const dbxAuth = new DropboxAuth(config)

app.get("/", (_req: Request, res: Response): void => {
  try {
    res.render("index.njk")
  } catch (err) {
    res.sendStatus(500)
    res.json({ message: err.message })
  }
})

app.get("/welcome", (req: Request, res: Response): void => {
  try {
    res.render("welcome.njk", {
      app_key: process.env.APP_ID,
      redirect_url: getUrl(req.hostname, "/auth"),
      webhook_url: getUrl(req.hostname, "/webhook"),
      home_url: getUrl(req.hostname)
    })
  } catch (err) {
    res.sendStatus(500)
    res.json({ message: err.message })
  }
})

app.get("/login", (req: Request, res: Response): void => {
  try {
    dbxAuth
      .getAuthenticationUrl(
        getUrl(req.hostname, "/auth"),
        undefined,
        "code",
        "offline",
        undefined,
        "none",
        false
      )
      .then((authUrl) => {
        res.writeHead(302, { Location: authUrl as string })
        res.end()
      })
  } catch (err) {
    res.sendStatus(500)
    res.json({ message: err.message })
  }
})

app.get("/auth", (req: Request, res: Response) => {
  const { code } = req.query

  dbxAuth
    .getAccessTokenFromCode(getUrl(req.hostname, "/auth"), code as string)
    .then((token) => {
      let newToken = token as Record<string, any>
      dbxAuth.setRefreshToken(newToken.result.refresh_token)
      const dbx = new Dropbox({ accessToken: newToken.result.access_token })
      dbx
        .usersGetCurrentAccount()
        .then((response) => {
          accountsStore[response.result.account_id] = newToken.result.access_token
          res.writeHead(302, { Location: "/done" })
          res.end()
        })
        .catch((error) => {
          console.error(error)
        })
    })
    .catch((error) => {
      console.log(error)
    })
})

app.get("/done", (_req: Request, res: Response): void => {
  try {
    res.render("done.njk")
  } catch (err) {
    res.sendStatus(500)
    res.json({ message: err.message })
  }
})

app.get("/webhook", (req: Request, res: Response): void => {
  try {
    if (req.query.challenge) {
      res.set("Content-Type", "text/plain")
      res.set("X-Content-Type-Options", "nosniff")
      res.send(req.query.challenge)
    } else {
      res.sendStatus(403)
    }
  } catch (err) {
    res.sendStatus(500)
    res.json({ message: err.message })
  }
})

app.post("/webhook", (req: Request, res: Response): void => {
  try {
    const signature = req.header("X-Dropbox-Signature")
    const hash = crypto
      .createHmac("sha256", process.env.APP_SECRET || "")
      .update(req.body)
      .digest("hex")
    if (!(signature === hash)) {
      res.sendStatus(403)
    } else {
      const json = JSON.parse(req.body)
      for (const account of json["list_folder"]["accounts"]) {
        processMD(account)
      }
      res.send("")
    }
  } catch (err) {
    res.sendStatus(500)
    console.log(err.message)
    res.json({ message: err.message })
  }
})

const port = process.env.PORT

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
})

export { app }
