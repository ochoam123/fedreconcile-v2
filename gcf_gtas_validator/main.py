import base64
import os
import json
import tempfile
import pandas as pd
from datetime import datetime
import functions_framework

# --- Import the NEW validator modules ---
from validators import ussgl_level 
# --- We will keep the old import for now to handle logic we haven't migrated yet ---
from validation_logic import validate_and_reconcile, generate_exception_report, generate_fbdi_file, load_data

# --- Load the NEW validation rules at startup ---
try:
    with open('validation_rules.json', 'r') as f:
        validation_rules = json.load(f)
    print(f"Successfully loaded {len(validation_rules)} validation rules.")
except Exception as e:
    validation_rules = []
    print(f"CRITICAL: Could not load or parse validation_rules.json: {e}")

@functions_framework.http
def gtas_validator_http(request):
    """
    HTTP Cloud Function that processes GTAS files.
    This function has been refactored to use a data-driven validation engine.
    """
    if request.method != 'POST':
        return ('Method Not Allowed', 405)

    request_json = request.get_json(silent=True)
    if not request_json or 'gtas_file_b64' not in request_json:
        return (json.dumps({"success": False, "message": '"gtas_file_b64" is required.'}), 400)

    # Setup temporary file paths
    gtas_temp_path = tempfile.mkstemp(suffix=".csv")[1]
    exception_output_temp_path = tempfile.mkstemp(suffix=".csv")[1]
    fbdi_output_temp_path = tempfile.mkstemp(suffix=".csv")[1]
    
    try:
        # Decode the base64 string and write to a temporary file
        with open(gtas_temp_path, "wb") as f:
            f.write(base64.b64decode(request_json.get('gtas_file_b64')))

        gtas_df = pd.read_csv(gtas_temp_path)
        gtas_df['row_identifier'] = gtas_df.index + 2  # Add row numbers for error reporting

        # =================================================================
        # === NEW DATA-DRIVEN VALIDATION ENGINE ===
        # =================================================================
        all_errors = []
        print(f"Applying {len(validation_rules)} rules to {len(gtas_df)} GTAS rows...")
        
        for rule in validation_rules:
            new_errors = []
            validation_type = rule.get('Validation Type')
            try:
                if validation_type == 'USSGL-Level':
                    new_errors = ussgl_level.validate(gtas_df, rule)
                # You can add 'elif' blocks for other categories (e.g., 'TAS-Level') here
                
                if new_errors:
                    all_errors.extend(new_errors)
            except Exception as e:
                print(f"ENGINE ERROR executing rule '{rule.get('Validation Number')}': {e}")
        
        print(f"Data-driven validation found {len(all_errors)} issues.")
        # (Note: The original reconciliation logic in validation_logic.py can be called here if needed)
        # For now, we will generate the report based on the new engine's findings.
        
        # --- Generate Exception Report from errors found ---
        if all_errors:
            exception_df = pd.DataFrame(all_errors)
            exception_df.to_csv(exception_output_temp_path, index=False)
        else:
            pd.DataFrame([{"status": "No exceptions found."}]).to_csv(exception_output_temp_path, index=False)
        
        # --- Prepare Response ---
        exception_report_b64 = None
        if os.path.exists(exception_output_temp_path):
            with open(exception_output_temp_path, 'rb') as f:
                exception_report_b64 = base64.b64encode(f.read()).decode('utf-8')
        
        # For now, we will return an empty FBDI file as we phase out the old logic
        fbdi_journal_b64 = base64.b64encode(b"").decode('utf-8')

        response_payload = {
            "success": True,
            "message": f"Validation complete. Found {len(all_errors)} potential issues.",
            "exception_report_b64": exception_report_b64,
            "fbdi_journal_b64": fbdi_journal_b64, # Placeholder
            "exception_report_filename": f"exception_report_{datetime.now().strftime('%Y%m%d%H%M%S')}.csv",
            "fbdi_journal_filename": "" # Placeholder
        }
        return (json.dumps(response_payload), 200, {'Content-Type': 'application/json'})

    except Exception as e:
        print(f"Error in Cloud Function: {e}")
        return (json.dumps({"success": False, "message": f"Server error: {e}"}), 500)
    finally:
        # Clean up temporary files
        for path in [gtas_temp_path, exception_output_temp_path, fbdi_output_temp_path]:
            if os.path.exists(path):
                os.remove(path)

