import os
from datetime import datetime
from typing import Optional
from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime, JSON
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base, Session

Base = declarative_base()

class Run(Base):
    __tablename__ = "runs"
<<<<<<< HEAD

=======
    
>>>>>>> cd880af29a59d474c32616ae99d9ef61c23e18cb
    run_id = Column(String, primary_key=True)
    problem = Column(Text, nullable=False)
    status = Column(String, nullable=False, default="queued")  # queued, running, completed, failed
    current_step_index = Column(Integer, nullable=False, default=0)
    total_steps = Column(Integer, nullable=False, default=0)
    started_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    final_output = Column(Text, nullable=True)
    error = Column(Text, nullable=True)
    state_data = Column(JSON, nullable=True)  # Store LangGraph state

class Event(Base):
    __tablename__ = "events"
<<<<<<< HEAD

=======
    
>>>>>>> cd880af29a59d474c32616ae99d9ef61c23e18cb
    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(String, nullable=False, index=True)
    ts = Column(DateTime, nullable=False, default=datetime.utcnow)
    type = Column(String, nullable=False)  # plan_created, step_started, etc.
    data = Column(JSON, nullable=False)

# Database setup
DATABASE_PATH = os.getenv("DATABASE_PATH", "data/runs.db")
os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)

DATABASE_URL = f"sqlite+aiosqlite:///{DATABASE_PATH}"

engine = create_async_engine(DATABASE_URL, echo=False)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def init_db():
    """Initialize the database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_session() -> AsyncSession:
    """Get a database session."""
    async with async_session_maker() as session:
        yield session
