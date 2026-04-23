import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, testResultsTable, testRunsTable, testCasesTable } from "@workspace/db";
import {
  CreateTestResultBody,
  CreateTestResultParams,
  UpdateTestResultBody,
  UpdateTestResultParams,
  ListTestResultsParams,
  ListTestResultsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router({ mergeParams: true });

router.get("/projects/:projectId/test-runs/:testRunId/results", async (req, res) => {
  const { projectId, testRunId } = ListTestResultsParams.parse({
    projectId: Number(req.params.projectId),
    testRunId: Number(req.params.testRunId),
  });
  const query = ListTestResultsQueryParams.parse({
    status: req.query["status"],
  });

  const conditions = [eq(testResultsTable.testRunId, testRunId)];
  if (query.status) conditions.push(eq(testResultsTable.status, query.status));

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
    .where(and(...conditions));

  res.json(results);
});

router.post("/projects/:projectId/test-runs/:testRunId/results", async (req, res) => {
  const { projectId, testRunId } = CreateTestResultParams.parse({
    projectId: Number(req.params.projectId),
    testRunId: Number(req.params.testRunId),
  });
  const body = CreateTestResultBody.parse(req.body);

  const [result] = await db
    .insert(testResultsTable)
    .values({
      testRunId,
      testCaseId: body.testCaseId,
      status: body.status ?? "pending",
      errorMessage: body.errorMessage,
      stackTrace: body.stackTrace,
      duration: body.duration,
      retries: body.retries ?? 0,
    })
    .returning();

  const [tc] = await db
    .select({ title: testCasesTable.title })
    .from(testCasesTable)
    .where(eq(testCasesTable.id, result.testCaseId));

  await updateRunCounts(testRunId);

  res.status(201).json({ ...result, testCaseTitle: tc?.title ?? "" });
});

router.patch("/projects/:projectId/test-runs/:testRunId/results/:resultId", async (req, res) => {
  const { projectId, testRunId, resultId } = UpdateTestResultParams.parse({
    projectId: Number(req.params.projectId),
    testRunId: Number(req.params.testRunId),
    resultId: Number(req.params.resultId),
  });
  const body = UpdateTestResultBody.parse(req.body);

  const [result] = await db
    .update(testResultsTable)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(testResultsTable.id, resultId))
    .returning();

  if (!result) {
    res.status(404).json({ error: "not_found", message: "Test result not found" });
    return;
  }

  const [tc] = await db
    .select({ title: testCasesTable.title })
    .from(testCasesTable)
    .where(eq(testCasesTable.id, result.testCaseId));

  await updateRunCounts(testRunId);

  res.json({ ...result, testCaseTitle: tc?.title ?? "" });
});

async function updateRunCounts(testRunId: number) {
  const results = await db
    .select({ status: testResultsTable.status })
    .from(testResultsTable)
    .where(eq(testResultsTable.testRunId, testRunId));

  const counts = {
    totalTests: results.length,
    passedTests: results.filter((r) => r.status === "passed").length,
    failedTests: results.filter((r) => r.status === "failed").length,
    skippedTests: results.filter((r) => r.status === "skipped").length,
    blockedTests: results.filter((r) => r.status === "blocked").length,
  };

  const allDone = results.every((r) => r.status !== "pending");
  const hasFailed = counts.failedTests > 0;
  const status = allDone ? (hasFailed ? "failed" : "passed") : undefined;

  await db
    .update(testRunsTable)
    .set({ ...counts, ...(status ? { status } : {}), updatedAt: new Date() })
    .where(eq(testRunsTable.id, testRunId));
}

export default router;
