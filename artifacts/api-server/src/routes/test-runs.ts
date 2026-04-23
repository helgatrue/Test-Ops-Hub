import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, testRunsTable, testCasesTable, testResultsTable } from "@workspace/db";
import {
  CreateTestRunBody,
  CreateTestRunParams,
  UpdateTestRunBody,
  UpdateTestRunParams,
  DeleteTestRunParams,
  GetTestRunParams,
  ListTestRunsParams,
  ListTestRunsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router({ mergeParams: true });

router.get("/projects/:projectId/test-runs", async (req, res) => {
  const { projectId } = ListTestRunsParams.parse({ projectId: Number(req.params.projectId) });
  const query = ListTestRunsQueryParams.parse({
    status: req.query["status"],
  });

  const conditions = [eq(testRunsTable.projectId, projectId)];
  if (query.status) conditions.push(eq(testRunsTable.status, query.status));

  const runs = await db
    .select()
    .from(testRunsTable)
    .where(and(...conditions))
    .orderBy(testRunsTable.createdAt);

  res.json(runs);
});

router.post("/projects/:projectId/test-runs", async (req, res) => {
  const { projectId } = CreateTestRunParams.parse({ projectId: Number(req.params.projectId) });
  const body = CreateTestRunBody.parse(req.body);

  const testCaseIds: number[] = (body.testCaseIds as number[]) ?? [];

  const [run] = await db
    .insert(testRunsTable)
    .values({
      projectId,
      name: body.name,
      branch: body.branch,
      commitHash: body.commitHash,
      commitMessage: body.commitMessage,
      triggeredBy: body.triggeredBy,
      ciProvider: body.ciProvider,
      status: "pending",
      totalTests: testCaseIds.length,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      blockedTests: 0,
    })
    .returning();

  if (testCaseIds.length > 0) {
    await db.insert(testResultsTable).values(
      testCaseIds.map((tcId) => ({
        testRunId: run.id,
        testCaseId: tcId,
        status: "pending",
        retries: 0,
      }))
    );
  }

  res.status(201).json(run);
});

router.get("/projects/:projectId/test-runs/:testRunId", async (req, res) => {
  const { projectId, testRunId } = GetTestRunParams.parse({
    projectId: Number(req.params.projectId),
    testRunId: Number(req.params.testRunId),
  });

  const [run] = await db
    .select()
    .from(testRunsTable)
    .where(and(eq(testRunsTable.id, testRunId), eq(testRunsTable.projectId, projectId)));

  if (!run) {
    res.status(404).json({ error: "not_found", message: "Test run not found" });
    return;
  }

  const results = await db
    .select({
      id: testResultsTable.id,
      testRunId: testResultsTable.testRunId,
      testCaseId: testResultsTable.testCaseId,
      testCaseTitle: testCasesTable.title,
      status: testResultsTable.status,
      errorMessage: testResultsTable.errorMessage,
      stackTrace: testResultsTable.stackTrace,
      duration: testResultsTable.duration,
      retries: testResultsTable.retries,
      createdAt: testResultsTable.createdAt,
      updatedAt: testResultsTable.updatedAt,
    })
    .from(testResultsTable)
    .leftJoin(testCasesTable, eq(testResultsTable.testCaseId, testCasesTable.id))
    .where(eq(testResultsTable.testRunId, testRunId));

  res.json({ ...run, results });
});

router.patch("/projects/:projectId/test-runs/:testRunId", async (req, res) => {
  const { projectId, testRunId } = UpdateTestRunParams.parse({
    projectId: Number(req.params.projectId),
    testRunId: Number(req.params.testRunId),
  });
  const body = UpdateTestRunBody.parse(req.body);

  const [run] = await db
    .update(testRunsTable)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(testRunsTable.id, testRunId), eq(testRunsTable.projectId, projectId)))
    .returning();

  if (!run) {
    res.status(404).json({ error: "not_found", message: "Test run not found" });
    return;
  }

  res.json(run);
});

router.delete("/projects/:projectId/test-runs/:testRunId", async (req, res) => {
  const { projectId, testRunId } = DeleteTestRunParams.parse({
    projectId: Number(req.params.projectId),
    testRunId: Number(req.params.testRunId),
  });

  await db
    .delete(testRunsTable)
    .where(and(eq(testRunsTable.id, testRunId), eq(testRunsTable.projectId, projectId)));

  res.status(204).send();
});

export default router;
