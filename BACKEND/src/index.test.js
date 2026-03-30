const request = require("supertest");
const app     = require("../src/index");

jest.mock("pg", () => {
  const mPool = { query: jest.fn(), on: jest.fn() };
  return { Pool: jest.fn(() => mPool) };
});

const { Pool } = require("pg");
const pool = new Pool();
beforeEach(() => jest.clearAllMocks());

describe("GET /health", () => {
  it("returns ok when DB reachable", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
  it("returns 503 when DB down", async () => {
    pool.query.mockRejectedValueOnce(new Error("connection refused"));
    const res = await request(app).get("/health");
    expect(res.status).toBe(503);
  });
});

describe("GET /api/items", () => {
  it("returns items array", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id:1, name:"Widget" }] });
    const res = await request(app).get("/api/items");
    expect(res.status).toBe(200);
    expect(res.body[0].name).toBe("Widget");
  });
});

describe("POST /api/items", () => {
  it("creates item and returns 201", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id:2, name:"Gadget" }] });
    const res = await request(app).post("/api/items").send({ name:"Gadget" });
    expect(res.status).toBe(201);
  });
  it("returns 400 when name missing", async () => {
    const res = await request(app).post("/api/items").send({});
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/items/:id", () => {
  it("returns 204 on success", async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1 });
    expect((await request(app).delete("/api/items/1")).status).toBe(204);
  });
  it("returns 404 if not found", async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0 });
    expect((await request(app).delete("/api/items/999")).status).toBe(404);
  });
});