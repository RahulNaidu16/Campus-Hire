"""
Placement-probability model.

A small logistic-regression classifier predicts the probability that a
student will ultimately be placed, based on:
  - their average ML job-match score (how well their skills fit available jobs)
  - how many jobs they have applied to
  - how many interview calls they have received
  - their CGPA

Since we don't have years of historical placement records to train on, we
generate a realistic *synthetic* training set whose labels are produced by a
known logistic relationship plus random noise, and then fit a fresh
scikit-learn LogisticRegression model on it. This mirrors how this kind of
model would be retrained once real placement outcomes are collected - only
the data source changes, the training code stays the same.
"""

from __future__ import annotations

import functools

import joblib
import numpy as np
from django.conf import settings
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

MODEL_PATH = settings.ML_MODELS_DIR / "placement_model.joblib"
FEATURE_NAMES = ["avg_match", "num_applications", "num_interviews", "cgpa_norm"]


def _generate_synthetic_dataset(n_samples: int = 6000, seed: int = 42):
    rng = np.random.default_rng(seed)

    avg_match = rng.beta(2.2, 2.2, n_samples)  # 0..1, skewed towards the middle
    num_applications = rng.poisson(6, n_samples).clip(0, 40)
    num_interviews = np.array([
        rng.binomial(apps, 0.35) for apps in num_applications
    ]).clip(0, num_applications)
    cgpa_norm = rng.uniform(0.5, 1.0, n_samples)  # cgpa/10, realistic range 5-10

    # Ground-truth generating process: a logistic function of the features + noise.
    z = (
        4.2 * avg_match
        + 0.18 * num_applications
        + 0.55 * num_interviews
        + 3.0 * cgpa_norm
        - 4.6
        + rng.normal(0, 0.6, n_samples)
    )
    prob = 1 / (1 + np.exp(-z))
    placed = rng.binomial(1, prob)

    X = np.column_stack([avg_match, num_applications, num_interviews, cgpa_norm])
    y = placed
    return X, y


def train_and_save():
    X, y = _generate_synthetic_dataset()
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(max_iter=1000)),
    ])
    pipeline.fit(X_train, y_train)

    train_acc = pipeline.score(X_train, y_train)
    test_acc = pipeline.score(X_test, y_test)

    settings.ML_MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    _load_pipeline.cache_clear()

    return {"train_accuracy": round(train_acc, 4), "test_accuracy": round(test_acc, 4), "n_samples": len(y)}


@functools.lru_cache(maxsize=1)
def _load_pipeline():
    if not MODEL_PATH.exists():
        train_and_save()
    return joblib.load(MODEL_PATH)


def predict_placement_probability(avg_match_pct: float, num_applications: int, num_interviews: int, cgpa: float) -> int:
    """avg_match_pct in 0..100, cgpa in 0..10. Returns probability as an int percentage."""

    pipeline = _load_pipeline()
    features = np.array([[
        max(0.0, min(1.0, avg_match_pct / 100)),
        num_applications,
        num_interviews,
        max(0.0, min(1.0, cgpa / 10)),
    ]])
    proba = pipeline.predict_proba(features)[0][1]
    return int(round(proba * 100))
