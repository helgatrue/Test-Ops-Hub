import { Router, type IRouter } from "express";
import { eq, sql, count, avg, and, gte } from "drizzle-orm";
import { db, projectsTable, testCasesTable, testRunsTable, testResultsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res) => {
  const [projectCount] = await db.select({ count: count() }).from(projectsTable);
  const [testCaseCount] = await db.select({ count: count() }).from(testCasesTable);
  const [runCount] = await db.select({ count: count() }).from(testRunsTable);
  const [activeRuns] = await db
    .select({ count: count() })
    .from(testRunsTable)
    .where(eq(testRunsTable.status, "running"));

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [passedLast7] = await db
    .select({ count: count() })
    .from(testRunsTable)
    .where(and(eq(testRunsTable.status, "passed"), gte(testRunsTable.createdAt, sevenDaysAgo)));

  const [failedLast7] = await db
    .select({ count: count() })
    .from(testRunsTable)
    .where(and(eq(testRunsTable.status, "failed"), gte(testRunsTable.createdAt, sevenDaysAgo)));

  const completedRuns = await db
    .select({ passedTests: testRunsTable.passedTests, totalTests: testRunsTable.totalTests })
    .from(testRunsTable)
    .where(
      sql`${testRunsTable.status} IN ('passed', 'failed') AND ${testRunsTable.totalTests} > 0`
    );

  const overallPassRate =
    completedRuns.length > 0
      ? completedRuns.reduce((acc, r) => acc + (r.passedTests / r.totalTests) * 100, 0) /
        completedRuns.length
      : 0;

  const [avgDuration] = await db
    .select({ avg: avg(testRunsTable.duration) })
    .from(testRunsTable)
    .where(sql`${testRunsTable.duration} IS NOT NULL`);

  res.json({
    totalProjects: Number(projectCount?.count ?? 0),
    totalTestCases: Number(testCaseCount?.count ?? 0),
    totalRuns: Number(runCount?.count ?? 0),
    activeRuns: Number(activeRuns?.count ?? 0),
    overallPassRate: Math.round(overallPassRate * 10) / 10,
    passedLast7Days: Number(passedLast7?.count ?? 0),
    failedLast7Days: Number(failedLast7?.count ?? 0),
    avgDuration: avgDuration?.avg ? Math.round(Number(avgDuration.avg)) : null,
  });
});

router.get("/dashboard/recent-runs", async (req, res) => {
  const limit = Math.min(Number(req.query["limit"] ?? 10), 50);

  const runs = await db
    .select({
      id: testRunsTable.id,
      name: testRunsTable.name,
      projectId: testRunsTable.projectId,
      projectName: projectsTable.name,
      status: testRunsTable.status,
      totalTests: testRunsTable.totalTests,
      passedTests: testRunsTable.passedTests,
      failedTests: testRunsTable.failedTests,
      duration: testRunsTable.duration,
      createdAt: testRunsTable.createdAt,
    })
    .from(testRunsTable)
    .leftJoin(projectsTable, eq(testRunsTable.projectId, projectsTable.id))
    .orderBy(sql`${testRunsTable.createdAt} desc`)
    .limit(limit);

  res.json(runs);
});

router.get("/dashboard/pass-rate-trend", async (_req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const runs = await db
    .select({
      date: sql<string>`DATE(${testRunsTable.createdAt})`,
      passedTests: testRunsTable.passedTests,
      totalTests: testRunsTable.totalTests,
    })
    .from(testRunsTable)
    .where(
      and(
        gte(testRunsTable.createdAt, thirtyDaysAgo),
        sql`${testRunsTable.status} IN ('passed', 'failed')`
      )
    );

  const byDate = new Map<string, { total: number; passed: number; runs: number }>();

  for (const run of runs) {
    const d = run.date;
    if (!byDate.has(d)) byDate.set(d, { total: 0, passed: 0, runs: 0 });
    const entry = byDate.get(d)!;
    entry.total += run.totalTests;
    entry.passed += run.passedTests;
    entry.runs += 1;
  }

  const trend = Array.from(byDate.entries())
    .map(([date, v]) => ({
      date,
      passRate: v.total > 0 ? Math.round((v.passed / v.total) * 1000) / 10 : 0,
      totalRuns: v.runs,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  res.json(trend);
});

router.get("/dashboard/top-failing-tests", async (req, res) => {
  const limit = Math.min(Number(req.query["limit"] ?? 5), 20);

  const rows = await db
    .select({
      testCaseId: testResultsTable.testCaseId,
      testCaseTitle: testCasesTable.title,
      projectId: testCasesTable.projectId,
      projectName: projectsTable.name,
      failureCount: count(),
      lastFailedAt: sql<Date>`MAX(${testResultsTable.createdAt})`,
    })
    .from(testResultsTable)
    .leftJoin(testCasesTable, eq(testResultsTable.testCaseId, testCasesTable.id))
    .leftJoin(projectsTable, eq(testCasesTable.projectId, projectsTable.id))
    .where(eq(testResultsTable.status, "failed"))
    .groupBy(
      testResultsTable.testCaseId,
      testCasesTable.title,
      testCasesTable.projectId,
      projectsTable.name
    )
    .orderBy(sql`count(*) desc`)
    .limit(limit);

  res.json(rows);
});

export default router;
