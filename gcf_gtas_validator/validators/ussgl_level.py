import pandas as pd
import numpy as np
from typing import List, Dict

# This mapping connects a rule's "Edit Number" to the function that implements it.
# This makes the main dispatcher clean and easy to extend.
USSGL_VALIDATORS = {
    "3": "check_for_missing_required_fields",
    "4": "check_canceled_tas_balance",
    "5": "check_advisory_for_liability_accounts",
}

def validate(df: pd.DataFrame, rule: dict) -> List[Dict]:
    """
    Sub-dispatcher for all 'USSGL-Level' validations.
    It looks up the correct validation function from the map above and executes it.
    """
    edit_number = rule.get("Edit Number")
    validator_function_name = USSGL_VALIDATORS.get(edit_number)
    
    if validator_function_name:
        validator_function = globals().get(validator_function_name)
        if validator_function:
            # We pass a copy of the dataframe to prevent unintended side effects between functions
            return validator_function(df.copy(), rule)
            
    return []

# --- Logic Functions Migrated from validation_logic.py's gtas_checks function ---

def check_for_missing_required_fields(df: pd.DataFrame, rule: dict) -> List[Dict]:
    """Implements logic for Edit #3 (VAL0030)"""
    errors = []
    # Check if the required columns exist in the DataFrame
    if 'TAS' not in df.columns or 'USSGL_ACCOUNT' not in df.columns:
        errors.append({"row": "N/A", "error": f"Required columns 'TAS' and/or 'USSGL_ACCOUNT' are missing."})
        return errors

    # Find rows where TAS or USSGL_ACCOUNT is null/empty
    invalid_rows = df[df['TAS'].isnull() | df['USSGL_ACCOUNT'].isnull()]
    for _, row in invalid_rows.iterrows():
        errors.append({"row": int(row['row_identifier']), "validation_number": rule.get("Validation Number"), "severity": rule.get("Severity"), "error_message": rule.get("Edit Message")})
    return errors

def check_canceled_tas_balance(df: pd.DataFrame, rule: dict) -> List[Dict]:
    """Implements logic for Edit #4 (VAL0100)"""
    errors = []
    if not all(col in df.columns for col in ['TAS', 'USSGL_ACCOUNT', 'GTAS_BALANCE']):
        return []

    # Prepare columns for safe checking
    df['TAS_str'] = df['TAS'].astype(str)
    df['USSGL_ACCOUNT_str'] = df['USSGL_ACCOUNT'].astype(str)
    # Coerce errors will turn non-numeric values into NaN (Not a Number)
    df['GTAS_BALANCE_float'] = pd.to_numeric(df['GTAS_BALANCE'], errors='coerce')

    invalid_rows = df[
        (df['TAS_str'].str.startswith('X', na=False)) &
        (df['USSGL_ACCOUNT_str'] == '101000') &
        # Use np.isclose for safe floating point comparison
        (np.isclose(df['GTAS_BALANCE_float'], 0) == False)
    ]
    for _, row in invalid_rows.iterrows():
        errors.append({"row": int(row['row_identifier']), "validation_number": rule.get("Validation Number"), "severity": rule.get("Severity"), "error_message": rule.get("Edit Message")})
    return errors

def check_advisory_for_liability_accounts(df: pd.DataFrame, rule: dict) -> List[Dict]:
    """Implements logic for Edit #5 (VAL0110)"""
    errors = []
    if 'USSGL_ACCOUNT' not in df.columns:
        return []
        
    df['USSGL_ACCOUNT_str'] = df['USSGL_ACCOUNT'].astype(str)
    # Find rows where the USSGL account starts with '210'
    advisory_rows = df[df['USSGL_ACCOUNT_str'].str.startswith('210', na=False)]
    
    for _, row in advisory_rows.iterrows():
        errors.append({"row": int(row['row_identifier']), "validation_number": rule.get("Validation Number"), "severity": rule.get("Severity"), "error_message": rule.get("Edit Message")})
    return errors
