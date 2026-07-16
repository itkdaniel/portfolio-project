# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/routers/agent.py
# AI agent pipeline routes: data-sources, scrape, process, train.
# =============================================================================

from fastapi import APIRouter, Depends

from src.database import DBSession
from src.models.user import User
from src.routers.users import get_current_user
from src.schemas.agent import (
    DataSourceOut,
    FeatureSetOut,
    ProcessIn,
    ScrapeIn,
    ScrapeJobOut,
    TrainIn,
    TrainingRunOut,
)
from src.services.agent_service import AgentService

router = APIRouter()


@router.get("/data-sources", response_model=list[DataSourceOut], summary="List data sources")
async def list_data_sources(
    db: DBSession = None,
    _user: User = Depends(get_current_user),
) -> list[DataSourceOut]:
    svc = AgentService(db)
    await svc.ensure_data_sources_seeded()
    sources = await svc.list_data_sources()
    return [DataSourceOut.model_validate(s) for s in sources]


@router.post("/scrape", response_model=ScrapeJobOut, summary="Run a scrape job")
async def run_scrape(
    body: ScrapeIn,
    db: DBSession = None,
    user: User = Depends(get_current_user),
) -> ScrapeJobOut:
    svc = AgentService(db)
    await svc.ensure_data_sources_seeded()
    job = await svc.run_scrape(body.source, body.path, user)
    return ScrapeJobOut.model_validate(job)


@router.get("/scrape", response_model=list[ScrapeJobOut], summary="List scrape jobs")
async def list_scrape_jobs(
    db: DBSession = None,
    user: User = Depends(get_current_user),
) -> list[ScrapeJobOut]:
    svc = AgentService(db)
    jobs = await svc.list_scrape_jobs(user)
    return [ScrapeJobOut.model_validate(j) for j in jobs]


@router.post("/process", response_model=FeatureSetOut, summary="Process scraped data")
async def run_process(
    body: ProcessIn,
    db: DBSession = None,
    user: User = Depends(get_current_user),
) -> FeatureSetOut:
    svc = AgentService(db)
    fs = await svc.run_process(body.scrape_job_id, body.feature_names, user)
    return FeatureSetOut.model_validate(fs)


@router.get("/feature-sets", response_model=list[FeatureSetOut], summary="List feature sets")
async def list_feature_sets(
    db: DBSession = None,
    user: User = Depends(get_current_user),
) -> list[FeatureSetOut]:
    svc = AgentService(db)
    sets = await svc.list_feature_sets(user)
    return [FeatureSetOut.model_validate(s) for s in sets]


@router.post("/train", response_model=TrainingRunOut, summary="Run training")
async def run_train(
    body: TrainIn,
    db: DBSession = None,
    user: User = Depends(get_current_user),
) -> TrainingRunOut:
    svc = AgentService(db)
    run = await svc.run_train(body.feature_set_id, user)
    return TrainingRunOut.model_validate(run)


@router.get("/training-runs", response_model=list[TrainingRunOut], summary="List training runs")
async def list_training_runs(
    db: DBSession = None,
    user: User = Depends(get_current_user),
) -> list[TrainingRunOut]:
    svc = AgentService(db)
    runs = await svc.list_training_runs(user)
    return [TrainingRunOut.model_validate(r) for r in runs]
