"""
RuleEngine — Deterministic fraud scoring rules.
Each rule contributes a score and a human-readable reason.
Total rule score is capped at 100.
"""
from dataclasses import dataclass
from fraud.feature_extractor import TransactionFeatures


@dataclass
class RuleResult:
    score: int
    reason: str
    signal: str  # machine-readable key


def evaluate_rules(features: TransactionFeatures) -> tuple[int, list[RuleResult]]:
    """
    Returns (total_rule_score, list_of_triggered_rules).
    Scores are additive and represent risk contribution.
    """
    triggered: list[RuleResult] = []

    # ── Amount anomaly ─────────────────────────────────────────────────────────
    if features.amount_deviation > 5:
        triggered.append(RuleResult(
            score=30,
            reason="Transaction amount is dramatically higher than the customer's normal spending pattern.",
            signal="extreme_amount_deviation",
        ))
    elif features.amount_deviation > 2:
        triggered.append(RuleResult(
            score=25,
            reason="Transaction amount is significantly above the customer's average transaction amount.",
            signal="high_amount_deviation",
        ))
    elif features.amount_deviation > 1:
        triggered.append(RuleResult(
            score=12,
            reason="Transaction amount is moderately above the customer's usual spending.",
            signal="moderate_amount_deviation",
        ))

    # ── Large absolute amount ──────────────────────────────────────────────────
    if features.large_amount_flag:
        triggered.append(RuleResult(
            score=15,
            reason="Transaction amount exceeds ₹1,00,000 — high-value transfer threshold.",
            signal="large_absolute_amount",
        ))
    elif features.amount >= 50000:
        triggered.append(RuleResult(
            score=8,
            reason="Transaction amount exceeds ₹50,000.",
            signal="medium_large_amount",
        ))

    # ── New beneficiary ────────────────────────────────────────────────────────
    if features.is_new_beneficiary:
        triggered.append(RuleResult(
            score=20,
            reason="This beneficiary was recently added or is not a saved beneficiary.",
            signal="new_beneficiary",
        ))

    # ── New device ────────────────────────────────────────────────────────────
    if features.is_new_device:
        triggered.append(RuleResult(
            score=15,
            reason="Transaction originated from an unrecognised device.",
            signal="new_device",
        ))

    # ── Unusual time ──────────────────────────────────────────────────────────
    if features.is_unusual_time:
        triggered.append(RuleResult(
            score=10,
            reason="Transaction occurred at an unusual time (between 1 AM and 5 AM).",
            signal="unusual_time",
        ))

    # ── High velocity ─────────────────────────────────────────────────────────
    if features.high_velocity_flag:
        triggered.append(RuleResult(
            score=15,
            reason=f"High transaction velocity: {features.txn_count_1h} transactions in the last hour.",
            signal="high_velocity",
        ))
    elif features.txn_count_1h >= 2:
        triggered.append(RuleResult(
            score=9,
            reason=f"Elevated transaction velocity: {features.txn_count_1h} transactions in the last hour.",
            signal="elevated_velocity",
        ))

    # ── Failed logins ─────────────────────────────────────────────────────────
    if features.failed_logins_recent >= 2:
        triggered.append(RuleResult(
            score=10,
            reason=f"{features.failed_logins_recent} failed login attempts recorded in the last 24 hours.",
            signal="recent_failed_logins",
        ))
    elif features.failed_logins_recent == 1:
        triggered.append(RuleResult(
            score=5,
            reason="1 failed login attempt recorded recently.",
            signal="single_failed_login",
        ))

    # ── Daily velocity ────────────────────────────────────────────────────────
    if features.daily_velocity > 0.8:
        triggered.append(RuleResult(
            score=12,
            reason=f"Account has already used {features.daily_velocity*100:.0f}% of the daily withdrawal limit.",
            signal="high_daily_velocity",
        ))

    # ── New account ───────────────────────────────────────────────────────────
    if features.account_age_days < 7:
        triggered.append(RuleResult(
            score=10,
            reason="Account was opened very recently (less than 7 days ago).",
            signal="new_account",
        ))

    total_score = min(sum(r.score for r in triggered), 100)
    return total_score, triggered
