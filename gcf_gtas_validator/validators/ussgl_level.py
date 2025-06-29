import pandas as pd
import numpy as np
from typing import List, Dict

# Mapping of edit numbers to their corresponding functions
USSGL_VALIDATORS = {
    "3": "check_for_missing_required_fields",
    "4": "check_canceled_tas_balance",
    "5": "check_advisory_for_liability_accounts",
}

def validate(df: pd.DataFrame, rule: dict) -> List[Dict]:
    """
    USSGL-level validation dispatcher.
    Ensures DataFrame has row identifiers, then runs the requested rule.
    """
    # Add row_identifier if not present
    if 'row_identifier' not in df.columns:
        df = df.reset_index().rename(columns={"index": "row_identifier"})

    edit_number = rule.get("Edit Number")
    validator_function_name = USSGL_VALIDATORS.get(edit_number)

    if validator_function_name:
        validator_function = globals().get(validator_function_name)
        if validator_function:
            return validator_function(df.copy(), rule)

    return []

# --------------------
# Validation Functions
# --------------------

def check_for_missing_required_fields(df: pd.DataFrame, rule: dict) -> List[Dict]:
    """Implements Edit #3: missing required TAS or USSGL_ACCOUNT."""
    errors = []
    if 'TAS' not in df.columns or 'USSGL_ACCOUNT' not in df.columns:
        errors.append({"row": "N/A", "error": "Required columns 'TAS' or 'USSGL_ACCOUNT' missing."})
        return errors

    invalid_rows = df[df['TAS'].isnull() | df['USSGL_ACCOUNT'].isnull()]
    for _, row in invalid_rows.iterrows():
        errors.append({
            "row": int(row['row_identifier']),
            "validation_number": rule.get("Validation Number"),
            "severity": rule.get("Severity"),
            "error_message": rule.get("Edit Message")
        })
    return errors

def check_canceled_tas_balance(df: pd.DataFrame, rule: dict) -> List[Dict]:
    """Implements Edit #4: canceled TAS should have zero balance in USSGL 101000."""
    errors = []
    required_cols = ['TAS', 'USSGL_ACCOUNT', 'GTAS_BALANCE']
    if not all(col in df.columns for col in required_cols):
        errors.append({"row": "N/A", "error": f"Required columns {required_cols} missing."})
        return errors

    df['TAS_str'] = df['TAS'].astype(str)
    df['USSGL_ACCOUNT_str'] = df['USSGL_ACCOUNT'].astype(str)
    df['GTAS_BALANCE_float'] = pd.to_numeric(df['GTAS_BALANCE'], errors='coerce')

    invalid_rows = df[
        df['TAS_str'].str.startswith('X', na=False) &
        (df['USSGL_ACCOUNT_str'] == '101000') &
        (~np.isclose(df['GTAS_BALANCE_float'], 0))
    ]

    for _, row in invalid_rows.iterrows():
        errors.append({
            "row": int(row['row_identifier']),
            "validation_number": rule.get("Validation Number"),
            "severity": rule.get("Severity"),
            "error_message": rule.get("Edit Message")
        })
    return errors

def check_advisory_for_liability_accounts(df: pd.DataFrame, rule: dict) -> List[Dict]:
    """Implements Edit #5: advisory checks for USSGL accounts starting with '210'."""
    errors = []
    if 'USSGL_ACCOUNT' not in df.columns:
        errors.append({"row": "N/A", "error": "Column 'USSGL_ACCOUNT' missing."})
        return errors

    df['USSGL_ACCOUNT_str'] = df['USSGL_ACCOUNT'].astype(str)
    advisory_rows = df[df['USSGL_ACCOUNT_str'].str.startswith('210', na=False)]

    for _, row in advisory_rows.iterrows():
        errors.append({
            "row": int(row['row_identifier']),
            "validation_number": rule.get("Validation Number"),
            "severity": rule.get("Severity"),
            "error_message": rule.get("Edit Message")
        })
    return errors