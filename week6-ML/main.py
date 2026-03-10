import sys
import os

# get project root
ROOT = os.path.dirname(os.path.abspath(__file__))

# add src to python path
sys.path.append(os.path.join(ROOT, "src"))

from utils.helpers import load_config
from pipelines.data_pipeline import run_pipeline


def main():

    config = load_config("src/config/config.yaml")

    run_pipeline(config)


if __name__ == "__main__":
    main()