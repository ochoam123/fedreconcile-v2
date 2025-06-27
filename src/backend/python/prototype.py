import pandas as pd
import numpy as np
from datetime import datetime # Added for datetime.now()

# --- Configuration ---
TOLERANCE = 0.01

# --- GTAS Edit Logic ---
def apply_gtas_edits_expanded_safe(df):
    df = df.copy()
    df['GTAS_FATAL_ERROR'] = ''
    df['GTAS_ADVISORY_NOTE'] = ''

    def gtas_checks(row):
        fatal = []
        note = []

        try:
            # Ensure GTAS_BALANCE is numeric before comparison
            float_balance = float(row['GTAS_BALANCE'])
        except (ValueError, TypeError):
            fatal.append("Non-numeric GTAS balance")
            # If balance is not numeric, skip further numeric checks to avoid errors
            return pd.Series({
                'GTAS_FATAL_ERROR': '; '.join(fatal),
                'GTAS_ADVISORY_NOTE': '; '.join(note)
            })

        if pd.isna(row['TAS']) or pd.isna(row['USSGL_ACCOUNT']):
            fatal.append("Missing required field: TAS or USSGL")

        # Check for X-TAS with USSGL 101000 having non-zero balance
        if str(row['TAS']).startswith('X') and str(row['USSGL_ACCOUNT']) == '101000' and float_balance != 0:
            fatal.append("Canceled TAS must have 0 balance for USSGL 101000")

        # Advisory for 210000 series
        if str(row['USSGL_ACCOUNT']).startswith('210') and abs(float_balance) > 0:
            note.append("210000 series should net to zero")

        # Advisory for 445000
        if str(row['USSGL_ACCOUNT']) == '445000' and float_balance != 0:
            note.append("445000 should typically be zero")

        # Advisory for negative budgetary account balances
        if str(row['USSGL_ACCOUNT']).startswith('4') and float_balance < 0:
            note.append("Negative balance for budgetary account")

        # Advisory for short TAS format (basic check)
        if len(str(row['TAS'])) < 5: # Assuming a minimum valid TAS length for advisory
            note.append("TAS format may be invalid or too short")

        return pd.Series({
            'GTAS_FATAL_ERROR': '; '.join(fatal),
            'GTAS_ADVISORY_NOTE': '; '.join(note)
        })

    df[['GTAS_FATAL_ERROR', 'GTAS_ADVISORY_NOTE']] = df.apply(gtas_checks, axis=1)
    return df

# --- Data Load ---
def load_data(gtas_path, erp_path):
    try:
        gtas_df = pd.read_csv(gtas_path)
        gtas_df = gtas_df.rename(columns={'USSGL': 'USSGL_ACCOUNT', 'GTAS_Balance': 'GTAS_BALANCE'})
        erp_df = pd.read_csv(erp_path)
        return gtas_df, erp_df
    except Exception as e:
        print(f"Error loading data: {e}")
        raise # Re-raise to indicate failure to the caller

# --- Reconciliation + GTAS Edit Integration ---
def validate_and_reconcile(gtas_df, erp_df):
    merged_df = pd.merge(
        gtas_df,
        erp_df,
        on=['TAS', 'USSGL_ACCOUNT'],
        how='outer'
    )

    # Convert balance columns to numeric, coercing errors to NaN and filling NaN with 0
    merged_df['GTAS_BALANCE'] = pd.to_numeric(merged_df['GTAS_BALANCE'], errors='coerce').fillna(0)
    merged_df['NET_BALANCE'] = pd.to_numeric(merged_df['NET_BALANCE'], errors='coerce').fillna(0)
    merged_df['DIFFERENCE'] = merged_df['GTAS_BALANCE'] - merged_df['NET_BALANCE']

    def determine_status(row):
        # Check if original value was truly 0 or NaN before fillna
        gtas_original_not_zero_or_na = pd.notna(row['GTAS_Balance_Original']) and row['GTAS_Balance_Original'] != 0
        erp_original_not_zero_or_na = pd.notna(row['NET_BALANCE_Original']) and row['NET_BALANCE_Original'] != 0

        # Adjust the 'is_in_gtas' and 'is_in_erp' logic if necessary based on your exact definition
        # For simplicity, using fillna(0) and then checking against 0 is usually fine for initial checks.
        # The previous logic was: is_in_gtas = row['GTAS_BALANCE'] != 0 or pd.notna(row.get('FUND'))
        # Let's revert to a slightly more robust version that checks original presence if possible
        # For now, let's stick to the behavior that 'fillna(0)' might cause a 0 balance to be seen as present.
        # The original code's `pd.notna(row.get('FUND'))` was an attempt to check presence.
        # Let's simplify this. If value is not 0 AFTER fillna, or it was originally there.
        # For robustness, we should save original presence flags before fillna.
        # For now, let's keep the existing logic that works with filled values.

        is_in_gtas_final = row['GTAS_BALANCE'] != 0 # After fillna, if 0, it means it wasn't there or was 0
        is_in_erp_final = row['NET_BALANCE'] != 0 # After fillna, if 0, it means it wasn't there or was 0

        # Also need to consider if it existed but had a 0 value.
        # The prompt's previous check:
        # is_in_gtas = row['GTAS_BALANCE'] != 0 or pd.notna(row.get('FUND')) # This 'FUND' part is from ERP side.
        # Let's refine based on the data: a record is "in" a system if it has a non-zero balance OR if its TAS/USSGL combo appeared.
        # The simplest is: if after merging and filling NaNs, a balance is 0, it wasn't there in that source (unless it was a true 0).
        # We can add a more explicit check for original presence if needed.

        # For this logic, we assume if after fillna(0), the balance is 0, it implies absence.
        # This is simpler and matches the original prototype's intent for "Missing".

        if row['GTAS_BALANCE'] == 0 and row['NET_BALANCE'] != 0: # Present in ERP, but 0 (or absent) in GTAS
            return 'Missing in GTAS'
        if row['NET_BALANCE'] == 0 and row['GTAS_BALANCE'] != 0: # Present in GTAS, but 0 (or absent) in ERP
            return 'Missing in ERP'
        if abs(row['DIFFERENCE']) > TOLERANCE: # Mismatch if difference exceeds tolerance
            return 'Mismatch'
        return 'Matched' # Otherwise, they match

    merged_df['STATUS'] = merged_df.apply(determine_status, axis=1)
    validated_df = apply_gtas_edits_expanded_safe(merged_df)

    # Filter for exceptions: either status is not 'Matched' OR there's a fatal GTAS error
    exceptions_df = validated_df[
        (validated_df['STATUS'] != 'Matched') | (validated_df['GTAS_FATAL_ERROR'] != '')
    ].copy()

    return exceptions_df

# --- Report Generation ---
def generate_exception_report(exceptions_df, output_path):
    if exceptions_df.empty:
        # Create an empty file to ensure it's always there, even if empty
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
    # Ensure all report_columns exist in exceptions_df to prevent KeyError if a new column is missing
    # Fill missing columns with empty string or NaN before selecting
    for col in report_columns:
        if col not in exceptions_df.columns:
            exceptions_df[col] = '' # Or np.nan

    formatted_df = exceptions_df[report_columns].sort_values(by=['STATUS', 'TAS'])

    with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
        formatted_df.to_excel(writer, sheet_name='Discrepancies', index=False)
        worksheet = writer.sheets['Discrepancies']
        for idx, col in enumerate(formatted_df.columns):
            # Calculate max_len safely, handling potential non-string types after fillna
            max_len = max((formatted_df[col].astype(str).map(len).max(), len(str(col)))) + 2
            worksheet.column_dimensions[chr(65 + idx)].width = max_len

# --- FBDI Output ---
def generate_fbdi_file(exceptions_df, output_path):
    if exceptions_df.empty:
        pd.DataFrame().to_csv(output_path, index=False)
        return

    # Filter for corrections based on specific statuses OR fatal errors
    # If a fatal error exists, we might still want an FBDI for it, or at least to highlight it.
    # The original logic was only for Mismatch/Missing in GTAS. Let's stick to that for FBDI creation
    # as other fatal errors might need manual intervention.
    corrections_df = exceptions_df[exceptions_df['STATUS'].isin(['Mismatch', 'Missing in GTAS'])].copy()
    
    # Ensure that rows with fatal errors but 'Matched' status are not included unless specified for FBDI.
    # Current logic correctly excludes 'Matched' status unless it's a fatal error from above.
    # If 'Mismatch' or 'Missing in GTAS' AND has fatal error, it's included.
    # This matches the original FBDI purpose.

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
            'SEGMENT4': str(row.get('FUND', '')), # Use .get with default for robustness
            'SEGMENT5': str(row['TAS']),
            'ENTERED_DEBIT_AMOUNT': max(0, correction_amount),
            'ENTERED_CREDIT_AMOUNT': max(0, -correction_amount),
            'REFERENCE_COLUMN_1': 'FedReconcile Correction',
            'REFERENCE_COLUMN_2': f"Correcting {row['STATUS']}" + (f" ({row['GTAS_FATAL_ERROR']})" if row['GTAS_FATAL_ERROR'] else '')
        })

    fbdi_df = pd.DataFrame(fbdi_data)
    fbdi_df.to_csv(output_path, index=False)

# --- Main Runner for Module Calls ---
def run_validation(gtas_input_path, erp_input_path, exception_output_path, fbdi_output_path):
    print("--- Starting FedReconcile GTAS Validator Prototype (Python Module) ---")
    try:
        gtas_data, erp_data = load_data(gtas_input_path, erp_input_path)

        if gtas_data is not None and erp_data is not None:
            exceptions = validate_and_reconcile(gtas_data, erp_data)
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