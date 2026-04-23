import numpy as np


def mmr(query_vec, doc_vecs, results, lambda_param=0.7, top_k=5):
    selected = []
    selected_indices = []

    for _ in range(min(top_k, len(results))):
        best_score = -1
        best_idx = -1

        for i, vec in enumerate(doc_vecs):
            if i in selected_indices:
                continue

            relevance = np.dot(query_vec, vec)

            diversity = max(
                [np.dot(vec, doc_vecs[j]) for j in selected_indices],
                default=0
            )

            score = lambda_param * relevance - (1 - lambda_param) * diversity

            if score > best_score:
                best_score = score
                best_idx = i

        selected.append(results[best_idx])
        selected_indices.append(best_idx)

    return selected