from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    MONGODB_URI: str
    DATABASE_NAME: str
    COLLECTION_NAME: str

    GEMINI_API_KEY: str

    UPLOAD_DIR: str
    EXTRACTED_DIR: str

    class Config:
        env_file = ".env"


settings = Settings()