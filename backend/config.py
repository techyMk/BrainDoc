from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    groq_api_key: str = ""
    voyage_api_key: str = ""

    groq_model: str = "llama-3.3-70b-versatile"
    voyage_embed_model: str = "voyage-3"
    voyage_rerank_model: str = "rerank-2-lite"

    chroma_path: str = "./data/chroma"
    docs_path: str = "./data/docs"
    graph_path: str = "./data/graph.json"

    host: str = "0.0.0.0"
    port: int = 8001
    allowed_origin: str = "http://localhost:3000"

    @property
    def chroma_dir(self) -> Path:
        p = Path(self.chroma_path).resolve()
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def docs_dir(self) -> Path:
        p = Path(self.docs_path).resolve()
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def graph_file(self) -> Path:
        return Path(self.graph_path).resolve()


settings = Settings()
