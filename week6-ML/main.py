import sys
import os

# get project root
ROOT = os.path.dirname(os.path.abspath(__file__))

# add src to python path
sys.path.append(os.path.join(ROOT, "src"))

from utils.helpers import load_config
from pipelines.data_pipeline import run_pipeline
from training.train import main as train_main
from training.tuning import main as tuning_main
from evaluation.shap_analysis import main as shap_main


def main():
    config = load_config("src/config/config.yaml")

    # Day 1 + Day 2
    run_pipeline(config)

    # Day 3
    train_main()

    # Day 4
    tuning_main()
    shap_main()


if __name__ == "__main__":
    main()