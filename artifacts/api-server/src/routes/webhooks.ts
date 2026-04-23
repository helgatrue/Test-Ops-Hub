import { Router, type IRouter } from "express";
import { db, testRunsTable, testResultsTable, testCasesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GithubWebhookBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/webhooks/github", async (req, res) => {
  const body = GithubWebhookBody.parse(req.body);

  const resultsData = body.results as Array<{
    testCaseId: number;
    status: string;
    duration?: number;
    errorMessage?: string;
  }>;

  const passed = resultsData.filter((r) => r.status === "passed").length;
  const failed = resultsData.filter((r) => r.status === "failed").length;
  const skipped = resultsData.filter((r) => r.status === "skipped").length;
  const totalDuration = resultsData.reduce((acc, r) => acc + (r.duration ?? 0), 0);
  const finalStatus = failed > 0 ? "failed" : "passed";

  const [run] = await db
    .insert(testRunsTable)
    .values({
      projectId: body.projectId,
      name: body.runName,
      branch: body.branch,
      commitHash: body.commitHash,
      commitMessage: body.commitMessage,
      triggeredBy: body.triggeredBy,
      ciProvider: "github",
      status: finalStatus,
      totalTests: resultsData.length,
      passedTests: passed,
      failedTests: failed,
      skippedTests: skipped,
      blockedTests: 0,
      duration: totalDuration || null,
      startedAt: new Date(),
      finishedAt: new Date(),
    })
    .returning();

  if (resultsData.length > 0) {
    await db.insert(testResultsTable).values(
      resultsData.map((r) => ({
        testRunId: run.id,
        testCaseId: r.testCaseId,
        status: r.status,
        duration: r.duration,
        errorMessage: r.errorMessage,
        retries: 0,
      }))
    );
  }

  res.json({
    success: true,
    testRunId: run.id,
    message: `Test run created with ${resultsData.length} results (${passed} passed, ${failed} failed, ${skipped} skipped)`,
  });
});

export default router;
