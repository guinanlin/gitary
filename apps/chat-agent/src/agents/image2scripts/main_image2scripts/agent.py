import os
import sys
from google.adk.agents import SequentialAgent

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from utils.file_loader import load_instructions_file
from agents.image2scripts.s10_recoginze_images.agent import root_agent as s10_recoginze_images_agent

root_agent = SequentialAgent(
    name="main_image2scripts_agent",
    sub_agents=[s10_recoginze_images_agent],
    description=load_instructions_file(f"{os.path.dirname(__file__)}/description.txt")
)
