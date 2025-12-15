from pydantic import BaseModel
from typing import List

class MessagePart(BaseModel):
    text: str

class NewMessage(BaseModel):
    role: str
    parts: List[MessagePart]

class RunAgentRequest(BaseModel):
    app_name: str
    user_id: str
    session_id: str
    new_message: NewMessage
