# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# tests/factories/user_factory.py
# Factory Boy factories for User and Profile test data generation.
# These factories mirror the TypeScript factory pattern from the original
# Vitest suite (tests/factories/userFactory.ts).
# =============================================================================

import factory
from factory import Faker, LazyAttribute, SubFactory

from src.models.user import User, UserRole
from src.models.profile import Profile


class UserFactory(factory.Factory):
    """
    Factory for generating realistic User instances.

    Usage:
        user = UserFactory()                      # random user
        admin = UserFactory(role=UserRole.admin)  # admin user
        users = UserFactory.build_batch(5)        # 5 random users
    """
    class Meta:
        model = User

    id = factory.Sequence(lambda n: n + 1)
    clerk_user_id = factory.LazyAttribute(lambda o: f"user_clerk_{o.id}")
    email = Faker("email")
    first_name = Faker("first_name")
    last_name = Faker("last_name")
    image_url = factory.LazyAttribute(
        lambda o: f"https://avatars.example.com/{o.clerk_user_id}"
    )
    role = UserRole.user


class AdminUserFactory(UserFactory):
    """Pre-configured factory for admin users."""
    role = UserRole.admin
    email = "admin@synaptiq.dev"


class ProfileFactory(factory.Factory):
    """Factory for generating Profile instances linked to a User."""
    class Meta:
        model = Profile

    id = factory.Sequence(lambda n: n + 1)
    user_id = factory.SelfAttribute("user.id")
    display_name = Faker("name")
    title = factory.LazyAttribute(
        lambda o: factory.Faker("job").generate()
    )
    bio = Faker("paragraph", nb_sentences=2)
    avatar_url = Faker("image_url")
    github_url = factory.LazyAttribute(
        lambda o: f"https://github.com/{factory.Faker('user_name').generate()}"
    )
    linkedin_url = factory.LazyAttribute(
        lambda o: f"https://linkedin.com/in/{factory.Faker('user_name').generate()}"
    )
    skills = '["Python", "FastAPI", "TypeScript", "React"]'
    projects = '[]'
    is_public = True
