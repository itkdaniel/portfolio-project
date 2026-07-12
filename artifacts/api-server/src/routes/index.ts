import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storageRouter from "./storage";
import usersRouter from "./users";
import profileRouter from "./profile";
import agentRouter from "./agent";
import testsRouter from "./tests";
import knowledgeGraphRouter from "./knowledgeGraph";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(usersRouter);
router.use(profileRouter);
router.use(agentRouter);
router.use(testsRouter);
router.use(knowledgeGraphRouter);

export default router;
