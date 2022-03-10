import request from "supertest"
import { app } from "../src/index"
import { createHmac } from "crypto"

describe("GET /", () => {
  it.only("It should has status code 200", async function () {
    expect.assertions(1)
    const response = await request(app).get("/")
    expect(response.status).toEqual(200)
  })
})

describe("GET /done", () => {
  it.only("It should has status code 200", async function () {
    expect.assertions(1)
    const response = await request(app).get("/done")
    expect(response.status).toEqual(200)
  })
})

describe("GET /welcome", () => {
  it.only("It should has status code 200", async function () {
    expect.assertions(1)
    const response = await request(app).get("/welcome")
    expect(response.status).toEqual(200)
  })
})

describe("GET /webhook", () => {
  it.only("Echoes back the challenge parameter", async function () {
    expect.assertions(2)
    const response = await request(app)
      .get("/webhook")
      .query({ challenge: "abc123" })
      .set("Accept", "text/plain")
    expect(response.status).toEqual(200)
    expect(response.text).toEqual("abc123")
  })

  it.only("Returns 403 error if no challenge parameter is passed", async function () {
    expect.assertions(1)
    const response = await request(app).get("/webhook").set("Accept", "text/plain")
    expect(response.status).toEqual(403)
  })
})

describe("POST /webhook", () => {
  it.only("Returns 200 if it's a valid request", async () => {
    expect.assertions(1)
    const data = JSON.stringify({
      list_folder: {
        accounts: ["acc1", "acc2"]
      }
    })

    const hash = createHmac("sha256", process.env.APP_SECRET || "")
      .update(data)
      .digest("hex")

    const response = await request(app).post("/webhook").set("X-Dropbox-Signature", hash).send(data)

    expect(response.status).toEqual(200)
  })

  it.only("Returns 403 if it's not a valid request", async () => {
    expect.assertions(1)
    const data = JSON.stringify({
      list_folder: {
        accounts: ["accId1", "accId2"]
      }
    })

    const response = await request(app)
      .post("/webhook")
      .set("X-Dropbox-Signature", "wrong-signature")
      .send(data)

    expect(response.status).toEqual(403)
  })
})
