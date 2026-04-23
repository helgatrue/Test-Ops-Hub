import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import testCasesRouter from "./test-cases";
import testRunsRouter from "./test-runs";
import testResultsRouter from "./test-results";
import dashboardRouter from "./dashboard";
import webhooksRouter from "./webhooks";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(testCasesRouter);
router.use(testRunsRouter);
router.use(testResultsRouter);
router.use(dashboardRouter);
router.use(webhooksRouter);

export default router;
