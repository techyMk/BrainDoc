import re
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


_SAFE_ID = re.compile(r"[^A-Za-z0-9_-]+")


def safe_user_id(user_id: str) -> str:
    cleaned = _SAFE_ID.sub("_", user_id).strip("_") or "anonymous"
    return cleaned[:120]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    groq_api_key: str = ""
    voyage_api_key: str = ""
    app_api_key: str = ""

    groq_model: str = "llama-3.3-70b-versatile"
    voyage_embed_model: str = "voyage-3"
    voyage_rerank_model: str = "rerank-2-lite"

    seed_docs_path: str = "./data/seed_docs"
    user_data_path: str = "./data/users"

    host: str = "0.0.0.0"
    port: int = 8001
    allowed_origin: str = "http://localhost:3000"

    @property
    def seed_docs_dir(self) -> Path:
        p = Path(self.seed_docs_path).resolve()
        p.mkdir(parents=True, exist_ok=True)
        return p

    def user_dir(self, user_id: str) -> Path:
        p = Path(self.user_data_path).resolve() / safe_user_id(user_id)
        p.mkdir(parents=True, exist_ok=True)
        return p

    def user_docs_dir(self, user_id: str) -> Path:
        p = self.user_dir(user_id) / "docs"
        p.mkdir(parents=True, exist_ok=True)
        return p

    def user_index_path(self, user_id: str) -> Path:
        return self.user_dir(user_id) / "index.pkl"

    def user_graph_path(self, user_id: str) -> Path:
        return self.user_dir(user_id) / "graph.json"


settings = Settings()
