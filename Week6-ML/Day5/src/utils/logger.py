import logging
import os


def get_logger(log_file):

    os.makedirs(os.path.dirname(log_file), exist_ok=True)

    logger = logging.getLogger("MLPipeline")
    logger.setLevel(logging.INFO)

    file_handler = logging.FileHandler(log_file)

    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(message)s"
    )

    file_handler.setFormatter(formatter)

    logger.addHandler(file_handler)

    return logger