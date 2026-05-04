import { Router, type IRouter } from "express";
import { eq, and, ilike, sql } from "drizzle-orm";
import { db, testCasesTable } from "@workspace/db";
import {
  CreateTestCaseBody,
  CreateTestCaseParams,
  UpdateTestCaseBody,
  UpdateTestCaseParams,
  DeleteTestCaseParams,
  GetTestCaseParams,
  ListTestCasesParams,
  ListTestCasesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router({ mergeParams: true });

router.get("/projects/:projectId/test-cases", async (req, res) => {
  const { projectId } = ListTestCasesParams.parse({ projectId: Number(req.params.projectId) });
  const query = ListTestCasesQueryParams.parse({
    status: req.query["status"],
    priority: req.query["priority"],
    search: req.query["search"],
  });

  const conditions = [eq(testCasesTable.projectId, projectId)];
  if (query.status) conditions.push(eq(testCasesTable.status, query.status));
  if (query.priority) conditions.push(eq(testCasesTable.priority, query.priority));
  if (query.search) conditions.push(ilike(testCasesTable.title, `%${query.search}%`));

  const testCases = await db
    .select()
    .from(testCasesTable)
    .where(and(...conditions))
    .orderBy(testCasesTable.createdAt);

  res.json(testCases);
});

router.post("/projects/:projectId/test-cases", async (req, res) => {
  const { projectId } = CreateTestCaseParams.parse({ projectId: Number(req.params.projectId) });
  const body = CreateTestCaseBody.parse(req.body);

  const [testCase] = await db
    .insert(testCasesTable)
    .values({
      projectId,
      title: body.title,
      description: body.description,
      priority: body.priority ?? "medium",
      status: body.status ?? "design",
      labels: (body.labels as string[]) ?? [],
      steps: (body.steps as Array<{ order: number; name: string; action: string; expected: string }>) ?? [],
      automationStatus: body.automationStatus ?? "manual",
      application: body.application,
      classification: body.classification,
      preConditions: body.preConditions,
      designer: body.designer,
      testCategory: body.testCategory,
      testType: body.testType,
    })
    .returning();

  res.status(201).json(testCase);
});

router.get("/projects/:projectId/test-cases/:testCaseId", async (req, res) => {
  const { projectId, testCaseId } = GetTestCaseParams.parse({
    projectId: Number(req.params.projectId),
    testCaseId: Number(req.params.testCaseId),
  });

  const [testCase] = await db
    .select()
    .from(testCasesTable)
    .where(and(eq(testCasesTable.id, testCaseId), eq(testCasesTable.projectId, projectId)));

  if (!testCase) {
    res.status(404).json({ error: "not_found", message: "Test case not found" });
    return;
  }

  res.json(testCase);
});

router.patch("/projects/:projectId/test-cases/:testCaseId", async (req, res) => {
  const { projectId, testCaseId } = UpdateTestCaseParams.parse({
    projectId: Number(req.params.projectId),
    testCaseId: Number(req.params.testCaseId),
  });
  const body = UpdateTestCaseBody.parse(req.body);

  const [testCase] = await db
    .update(testCasesTable)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(testCasesTable.id, testCaseId), eq(testCasesTable.projectId, projectId)))
    .returning();

  if (!testCase) {
    res.status(404).json({ error: "not_found", message: "Test case not found" });
    return;
  }

  res.json(testCase);
});

router.delete("/projects/:projectId/test-cases/:testCaseId", async (req, res) => {
  const { projectId, testCaseId } = DeleteTestCaseParams.parse({
    projectId: Number(req.params.projectId),
    testCaseId: Number(req.params.testCaseId),
  });

  await db
    .delete(testCasesTable)
    .where(and(eq(testCasesTable.id, testCaseId), eq(testCasesTable.projectId, projectId)));

  res.status(204).send();
});

export default router;
