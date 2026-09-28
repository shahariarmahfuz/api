from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter
from app.modules.manifest import ApiModuleManifest
from app.repositories.registry_repository import RegistryRepository
from app.models.api_registry import ApiRegistry
from app.core.logging import logger


class ModuleRegistry:
    """Central registry for dynamically registered modular APIs."""

    def __init__(self):
        self._manifests: Dict[str, ApiModuleManifest] = {}
        self._routers: Dict[str, APIRouter] = {}

    def register(self, manifest: ApiModuleManifest, router: Optional[APIRouter] = None) -> None:
        """Register a new API module into the platform."""
        self._manifests[manifest.slug] = manifest
        if router:
            self._routers[manifest.slug] = router
        logger.info(f"Registered API module: {manifest.name} ({manifest.slug}) -> {manifest.endpoint}")

    def get_manifests(self) -> List[ApiModuleManifest]:
        return list(self._manifests.values())

    def get_manifest(self, slug: str) -> Optional[ApiModuleManifest]:
        return self._manifests.get(slug)

    def get_routers(self) -> List[APIRouter]:
        return list(self._routers.values())

    async def sync_to_database(self, db: AsyncSession) -> None:
        """
        Synchronize registered code manifests with the PostgreSQL api_registry table.
        Ensures all declared API modules exist in the database with their current metadata.
        """
        repo = RegistryRepository(db)
        for manifest in self._manifests.values():
            existing = await repo.get_by_slug(manifest.slug)
            if not existing:
                model = ApiRegistry(
                    name=manifest.name,
                    slug=manifest.slug,
                    description=manifest.description,
                    category=manifest.category.lower(),
                    version=manifest.version,
                    method=manifest.method.upper(),
                    endpoint=manifest.endpoint,
                    status=manifest.status,
                    authentication_required=manifest.authentication_required,
                    rate_limit=manifest.rate_limit,
                    documentation=manifest.documentation or {},
                )
                await repo.create(model)
                logger.info(f"Synchronized new module to DB: {manifest.slug}")
            else:
                # Update metadata if needed
                existing.description = manifest.description
                existing.endpoint = manifest.endpoint
                existing.method = manifest.method.upper()
                existing.documentation = manifest.documentation or {}
                await db.flush()


module_registry = ModuleRegistry()
