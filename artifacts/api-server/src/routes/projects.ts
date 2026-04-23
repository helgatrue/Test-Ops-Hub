import { Router, type IRouter } from "express";
import { eq, count, sql } from "drizzle-orm";
import { db, projectsTable, testCasesTable, testRunsTable } from "@workspace/db";
import {
  CreateProjectBody,
  UpdateProjectBody,
  GetProjectParams,
  UpdateProjectParams,
  DeleteProjectParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/projects", async (req, res) => {
  const projects = await db.select().from(projectsTable).orderBy(projectsTable.createdAt);

  const results = await Promise.all(
    projects.map(async (p) => {
      const [tcCount] = await db
        .select({ count: count() })
        .from(testCasesTable)
        .where(eq(testCasesTable.projectId, p.id));

      const [runCount] = await db
        .select({ count: count() })
        .from(testRunsTable)
        .where(eq(testRunsTable.projectId, p.id));

      const [lastRun] = await db
        .select({ createdAt: testRunsTable.createdAt })
        .from(testRunsTable)
        .where(eq(testRunsTable.projectId, p.id))
        .orderBy(sql`${testRunsTable.createdAt} desc`)
        .limit(1);

      return {
        ...p,
        totalTestCases: Number(tcCount?.count ?? 0),
        totalRuns: Number(runCount?.count ?? 0),
        lastRunAt: lastRun?.createdAt ?? null,
      };
    })
  );

  res.json(results);
});

router.post("/projects", async (req, res) => {
  const body = CreateProjectBody.parse(req.body);
  const [project] = await db
    .insert(projectsTable)
    .values(body)
    .returning();

  res.status(201).json({
    ...project,
    totalTestCases: 0,
    totalRuns: 0,
    lastRunAt: null,
  });
});

router.get("/projects/:projectId", async (req, res) => {
  const { projectId } = GetProjectParams.parse({ projectId: Number(req.params.projectId) });

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId));

  if (!project) {
    res.status(404).json({ error: "not_found", message: "Project not found" });
    return;
  }

  const [tcCount] = await db
    .select({ count: count() })
    .from(testCasesTable)
    .where(eq(testCasesTable.projectId, projectId));

  const [runCount] = await db
    .select({ count: count() })
    .from(testRunsTable)
    .where(eq(testRunsTable.projectId, projectId));

  const [lastRun] = await db
    .select({ createdAt: testRunsTable.createdAt })
    .from(testRunsTable)
    .where(eq(testRunsTable.projectId, projectId))
    .orderBy(sql`${testRunsTable.createdAt} desc`)
    .limit(1);

  res.json({
    ...project,
    totalTestCases: Number(tcCount?.count ?? 0),
    totalRuns: Number(runCount?.count ?? 0),
    lastRunAt: lastRun?.createdAt ?? null,
  });
});

router.patch("/projects/:projectId", async (req, res) => {
  const { projectId } = UpdateProjectParams.parse({ projectId: Number(req.params.projectId) });
  const body = UpdateProjectBody.parse(req.body);

  const [project] = await db
    .update(projectsTable)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(projectsTable.id, projectId))
    .returning();

  if (!project) {
    res.status(404).json({ error: "not_found", message: "Project not found" });
    return;
  }

  const [tcCount] = await db
    .select({ count: count() })
    .from(testCasesTable)
    .where(eq(testCasesTable.projectId, projectId));

  const [runCount] = await db
    .select({ count: count() })
    .from(testRunsTable)
    .where(eq(testRunsTable.projectId, projectId));

  res.json({
    ...project,
    totalTestCases: Number(tcCount?.count ?? 0),
    totalRuns: Number(runCount?.count ?? 0),
    lastRunAt: null,
  });
});

router.delete("/projects/:projectId", async (req, res) => {
  const { projectId } = DeleteProjectParams.parse({ projectId: Number(req.params.projectId) });

  await db.delete(projectsTable).where(eq(projectsTable.id, projectId));
  res.status(204).send();
});

export default router;
