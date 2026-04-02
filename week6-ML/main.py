import sys
import os

ROOT = os.path.dirname(os.path.abspath(__file__))


sys.path.append(os.path.join(ROOT, "src"))

from utils.helpers import load_config
from pipelines.data_pipeline import run_pipeline
from training.train import main as train_main
from training.tuning import main as tuning_main
from evaluation.shap_analysis import main as shap_main


def main():
    config = load_config("src/config/config.yaml")
    run_pipeline(config)
    train_main()
    tuning_main()
    shap_main()


if __name__ == "__main__":
    main()