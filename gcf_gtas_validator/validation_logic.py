import pandas as pd
import numpy as np
import json
import os
from datetime import datetime
from typing import List, Dict

# Import your specific validators module (Changed from relative to absolute)
from validators import ussgl_level # <--- FIXED IMPORT HERE

# --- Configuration ---
TOLERANCE = 0.01

# --- Data Load ---
def load_data(gtas_path, erp_path):
    try:
        gtas_df = pd.read_csv(gtas_path)
        gtas_df = gtas_df.rename(columns={'USSGL': 'USSGL_ACCOUNT', 'GTAS_Balance': 'GTAS_BALANCE'})
        erp_df = pd.read_csv(erp_path)
        return gtas_df, erp_df
    except Exception as e:
        print(f"Error loading data: {e}")
        raise

# --- Rule Application Orchestration ---
def load_validation_rules(rules_file_path):
    """Loads validation rules from a JSON file."""
    try:
        with open(rules_file_path, 'r') as f:
            rules = json.load(f)
        print(f"Successfully loaded {len(rules)} validation rules from {rules_file_path}")
        return rules
    except FileNotFoundError:
        print(f"Validation rules file not found: {rules_file_path}")
        return []
    except json.JSONDecodeError:
        print(f"Error decoding JSON from rules file: {rules_file_path}")
        return []

def apply_all_validation_rules(df: pd.DataFrame, rules: List[Dict]) -> pd.DataFrame:
    """
    Applies all defined validation rules to the DataFrame.
    """
    df_copy = df.copy()
    
    if 'GTAS_FATAL_ERROR' not in df_copy.columns:
        df_copy['GTAS_FATAL_ERROR'] = ''
    if 'GTAS_ADVISORY_NOTE' not in df_copy.columns:
        df_copy['GTAS_ADVISORY_NOTE'] = ''

    all_errors = []

    if 'row_identifier' not in df_copy.columns:
        df_copy['row_identifier'] = df_copy.index

    for rule in rules:
        validation_type = rule.get("Validation Type")
        
        if validation_type == "USSGL-Level":
            errors_for_rule = ussgl_level.validate(df_copy, rule)
            all_errors.extend(errors_for_rule)
        else:
            print(f"Unknown validation type: {validation_type} for rule: {rule.get('Validation Number')}")

    for error_detail in all_errors:
        row_idx = error_detail.get("row")
        if row_idx is not None and row_idx in df_copy.index:
            severity = error_detail.get("severity", "Fatal")
            message = error_detail.get("error_message", "Unknown error")
            validation_number = error_detail.get("validation_number", "UNKNOWN")

            full_message = f"[{validation_number}] {message}"

            if severity == "Fatal":
                df_copy.loc[row_idx, 'GTAS_FATAL_ERROR'] = \
                    (df_copy.loc[row_idx, 'GTAS_FATAL_ERROR'] + "; " + full_message).strip('; ')
            elif severity == "Advisory":
                df_copy.loc[row_idx, 'GTAS_ADVISORY_NOTE'] = \
                    (df_copy.loc[row_idx, 'GTAS_ADVISORY_NOTE'] + "; " + full_message).strip('; ')
    
    return df_copy

def validate_and_reconcile(gtas_df, erp_df, rules_file_path):
    """
    Merges GTAS and ERP data, calculates differences, and flags exceptions,
    then applies rule-driven GTAS edits.
    """
    merged_df = pd.merge(
        gtas_df,
        erp_df,
        on=['TAS', 'USSGL_ACCOUNT'],
        how='outer'
    )

    merged_df['GTAS_BALANCE'] = pd.to_numeric(merged_df['GTAS_BALANCE'], errors='coerce').fillna(0)
    merged_df['NET_BALANCE'] = pd.to_numeric(merged_df['NET_BALANCE'], errors='coerce').fillna(0)
    merged_df['DIFFERENCE'] = merged_df['GTAS_BALANCE'] - merged_df['NET_BALANCE']

    def determine_status(row):
        if row['GTAS_BALANCE'] == 0 and row['NET_BALANCE'] != 0:
            return 'Missing in GTAS'
        if row['NET_BALANCE'] == 0 and row['GTAS_BALANCE'] != 0:
            return 'Missing in ERP'
        if abs(row['DIFFERENCE']) > TOLERANCE:
            return 'Mismatch'
        return 'Matched'

    merged_df['STATUS'] = merged_df.apply(determine_status, axis=1)
    
    rules = load_validation_rules(rules_file_path)
    if not rules:
        print("No validation rules loaded. Proceeding with basic reconciliation only.")

    validated_df = apply_all_validation_rules(merged_df, rules)

    exceptions_df = validated_df[
        (validated_df['STATUS'] != 'Matched') | (validated_df['GTAS_FATAL_ERROR'] != '')
    ].copy()

    return exceptions_df

def generate_exception_report(exceptions_df, output_path):
    if exceptions_df.empty:
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            pd.DataFrame().to_excel(writer, sheet_name='Discrepancies', index=False)
        return

    report_columns = [
        'STATUS',
        'TAS',
        'USSGL_ACCOUNT',
        'GTAS_BALANCE',
        'NET_BALANCE',
        'DIFFERENCE',
        'GTAS_FATAL_ERROR',
        'GTAS_ADVISORY_NOTE'
    ]
    for col in report_columns:
        if col not in exceptions_df.columns:
            exceptions_df[col] = ''

    formatted_df = exceptions_df[report_columns].sort_values(by=['STATUS', 'TAS'])

    with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
        formatted_df.to_excel(writer, sheet_name='Discrepancies', index=False)
        worksheet = writer.sheets['Discrepancies']
        for idx, col in enumerate(formatted_df.columns):
            max_len = max((formatted_df[col].astype(str).map(len).max(), len(str(col)))) + 2
            worksheet.column_dimensions[chr(65 + idx)].width = max_len

def generate_fbdi_file(exceptions_df, output_path):
    if exceptions_df.empty:
        pd.DataFrame().to_csv(output_path, index=False)
        return

    corrections_df = exceptions_df[exceptions_df['STATUS'].isin(['Mismatch', 'Missing in GTAS'])].copy()
    
    if corrections_df.empty:
        pd.DataFrame().to_csv(output_path, index=False)
        return

    fbdi_data = []
    for index, row in corrections_df.iterrows():
        correction_amount = -row['DIFFERENCE']
        fbdi_data.append({
            'STATUS_CODE': 'NEW',
            'LEDGER_ID': 1,
            'EFFECTIVE_DATE': '2025-06-30',
            'JOURNAL_SOURCE': 'FedReconcile',
            'JOURNAL_CATEGORY': 'Reconciliation',
            'CURRENCY_CODE': 'USD',
            'JOURNAL_ENTRY_CREATION_DATE': datetime.now().strftime('%Y-%m-%d'),
            'ACTUAL_FLAG': 'A',
            'SEGMENT1': '101',
            'SEGMENT2': 'Finance',
            'SEGMENT3': str(row['USSGL_ACCOUNT']),
            'SEGMENT4': str(row.get('FUND', '')),
            'SEGMENT5': str(row['TAS']),
            'ENTERED_DEBIT_AMOUNT': max(0, correction_amount),
            'ENTERED_CREDIT_AMOUNT': max(0, -correction_amount),
            'REFERENCE_COLUMN_1': 'FedReconcile Correction',
            'REFERENCE_COLUMN_2': f"Correcting {row['STATUS']}" + (f" ({row['GTAS_FATAL_ERROR']})" if row['GTAS_FATAL_ERROR'] else '')
        })

    fbdi_df = pd.DataFrame(fbdi_data)
    fbdi_df.to_csv(output_path, index=False)

def run_validation(gtas_input_path, erp_input_path, exception_output_path, fbdi_output_path, rules_file_path):
    """Runs the GTAS Validator prototype and returns output file paths."""
    print("--- Starting FedReconcile GTAS Validator Prototype (Python Module) ---")

    try:
        gtas_data, erp_data = load_data(gtas_input_path, erp_input_path)

        if gtas_data is not None and erp_data is not None:
            exceptions = validate_and_reconcile(gtas_data, erp_data, rules_file_path) # Pass rules_file_path
            generate_exception_report(exceptions, exception_output_path)
            generate_fbdi_file(exceptions, fbdi_output_path)
            return {
                "success": True,
                "message": "Validation complete. Reports generated.",
                "exception_report_path": exception_output_path,
                "fbdi_journal_path": fbdi_output_path
            }
        else:
            return {"success": False, "message": "Failed to load input data."}
    except Exception as e:
        print(f"Error during validation process: {e}")
        return {"success": False, "message": f"Validation process failed: {e}"}
    finally:
        print("--- Python Module execution finished. ---")