"""
ML Fraud Model — Isolation Forest trained on synthetic data.

IMPORTANT NOTE:
This model is trained on SYNTHETIC data generated for demonstration purposes.
It is NOT a production-grade model and should not be used for real fraud decisions.
In production, this would be replaced with a model trained on real, labelled fraud data.

The model outputs an anomaly score which is combined with the deterministic rule engine
to produce the final risk score.
"""
import os
import numpy as np
import joblib
from sklearn.ensemble import IsolationForest

MODEL_PATH = os.path.join(os.path.dirname(__file__), "isolation_forest.pkl")


def _generate_synthetic_data() -> np.ndarray:
    """
    Generate synthetic transaction data for training.
    Normal transactions: low amounts, low velocity, known beneficiaries.
    Anomalies (injected): high amounts, high velocity, new beneficiaries.
    """
    np.random.seed(42)
    n_normal = 2000

    # Normal transactions
    normal = np.column_stack([
        np.random.lognormal(mean=8, sigma=1.2, size=n_normal),    # amount (₹3k avg)
        np.random.lognormal(mean=7.5, sigma=1.0, size=n_normal),  # avg_amount
        np.random.normal(0.1, 0.3, size=n_normal),                # amount_deviation
        np.random.poisson(0.5, size=n_normal),                     # txn_count_1h
        np.random.poisson(2, size=n_normal),                       # txn_count_24h
        np.random.binomial(1, 0.1, size=n_normal),                 # is_new_beneficiary
        np.random.binomial(1, 0.05, size=n_normal),                # is_unusual_time
        np.random.binomial(1, 0.05, size=n_normal),                # is_new_device
        np.random.poisson(0.1, size=n_normal),                     # failed_logins
        np.random.beta(1, 5, size=n_normal),                       # daily_velocity
        np.random.randint(30, 1000, size=n_normal),                # account_age_days
    ])

    # Inject anomalies (suspicious patterns)
    n_anomaly = 200
    anomalies = np.column_stack([
        np.random.uniform(70000, 200000, size=n_anomaly),  # very high amounts
        np.random.lognormal(7, 1, size=n_anomaly),         # normal avg (deviation will be high)
        np.random.uniform(3, 10, size=n_anomaly),          # high deviation
        np.random.randint(3, 8, size=n_anomaly),           # high velocity
        np.random.randint(5, 15, size=n_anomaly),
        np.ones(n_anomaly),                                 # always new beneficiary
        np.ones(n_anomaly),                                 # always unusual time
        np.ones(n_anomaly),                                 # always new device
        np.random.randint(1, 4, size=n_anomaly),           # failed logins
        np.random.uniform(0.7, 1.0, size=n_anomaly),      # high velocity
        np.random.randint(1, 30, size=n_anomaly),          # new accounts
    ])

    return np.vstack([normal, anomalies])


def train_model() -> IsolationForest:
    """Train Isolation Forest on synthetic data and save to disk."""
    X = _generate_synthetic_data()
    model = IsolationForest(
        n_estimators=200,
        contamination=0.08,  # ~8% anomaly rate in synthetic data
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X)
    joblib.dump(model, MODEL_PATH)
    print(f"[FraudML] Isolation Forest trained on {len(X)} synthetic samples and saved.")
    return model


def load_model() -> IsolationForest:
    """Load model from disk, training if not present."""
    if not os.path.exists(MODEL_PATH):
        return train_model()
    return joblib.load(MODEL_PATH)


# Module-level singleton
_model: IsolationForest | None = None


def get_model() -> IsolationForest:
    global _model
    if _model is None:
        _model = load_model()
    return _model


def predict_anomaly_score(features_array: np.ndarray) -> float:
    """
    Returns a normalized anomaly score in [0.0, 1.0].
    Higher = more anomalous.
    Isolation Forest returns negative scores for anomalies; we invert and normalize.
    """
    model = get_model()
    raw_score = model.score_samples(features_array.reshape(1, -1))[0]
    # raw_score is in roughly [-0.8, 0.2]. More negative = more anomalous.
    # Map to [0, 1]: anomaly_score = clip((-raw_score - 0.1) / 0.7, 0, 1)
    anomaly_score = float(np.clip((-raw_score - 0.1) / 0.7, 0.0, 1.0))
    return round(anomaly_score, 4)
