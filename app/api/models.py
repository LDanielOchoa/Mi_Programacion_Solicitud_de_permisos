from sqlalchemy import Column, Integer, String, Enum
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    password = Column(String(255), nullable=False)  # Encriptada
    role = Column(Enum("employee", "admin"), default="employee", nullable=False)
