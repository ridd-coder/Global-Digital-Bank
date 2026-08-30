"""
RiskScorer — Combines rule engine + ML model into a final 0-100 risk score.
Generates human-readable reasons and recommended action.
"""
import numpy as np
from dataclasses import dataclass

from fraud.feature_extractor import TransactionFeatures
from fraud.rule_engine import evaluate_rules, RuleResult
from fraud.ml_model import predict_anomaly_score


@dataclass
class RiskAssessment:
    score: int                    # 0-100
    level: str                    # low | medium | high | critical
    reasons: list[str]            # human-readable explanations
    signals: list[str]            # machine-readable signal keys
    ml_score: float               # raw ML anomaly score
    rule_score: int               # rule engine contribution
    action: str                   # allow | warn | step_up | block
    recommended_action: str       # human-readable


RISK_WEIGHTS = {"rules": 0.65, "ml": 0.35}  # Rule engine weighted higher for explainability


def score_transaction(features: TransactionFeatures) -> RiskAssessment:
    """
    Combine deterministic rules + ML anomaly detection into a final score.

    Formula:
        final_score = (rule_score * 0.65) + (ml_score_0_100 * 0.35)
        capped at 100
    """
    # 1. Rule engine
    rule_score, triggered_rules = evaluate_rules(features)

    # 2. ML model
    feature_vector = np.array([
        features.amount,
        features.avg_amount,
        features.amount_deviation,
        features.txn_count_1h,
        features.txn_count_24h,
        float(features.is_new_beneficiary),
        float(features.is_unusual_time),
        float(features.is_new_device),
        features.failed_logins_recent,
        features.daily_velocity,
        features.account_age_days,
    ])
    ml_anomaly = predict_anomaly_score(feature_vector)
    ml_score_100 = int(ml_anomaly * 100)

    # 3. Combined score
    combined = (rule_score * RISK_WEIGHTS["rules"]) + (ml_score_100 * RISK_WEIGHTS["ml"])
    final_score = min(int(round(combined)), 100)

    # 4. Classify
    if final_score < 30:
        level = "low"
        action = "allow"
        recommended_action = "Transaction processed normally."
    elif final_score < 60:
        level = "medium"
        action = "warn"
        recommended_action = "Transaction allowed with additional monitoring. Customer has been notified."
    elif final_score < 80:
        level = "high"
        action = "step_up"
        recommended_action = "Step-up verification required. Customer must confirm with OTP before proceeding."
    else:
        level = "critical"
        action = "block"
        recommended_action = "Transaction blocked. Fraud alert created and sent to the compliance team for review."

    reasons = [r.reason for r in triggered_rules]
    signals = [r.signal for r in triggered_rules]

    return RiskAssessment(
        score=final_score,
        level=level,
        reasons=reasons,
        signals=signals,
        ml_score=ml_anomaly,
        rule_score=rule_score,
        action=action,
        recommended_action=recommended_action,
    )
