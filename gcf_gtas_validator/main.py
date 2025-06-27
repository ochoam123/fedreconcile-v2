import base64
import os
import json
import tempfile
import functions_framework # Required for Google Cloud Functions entry point
from validation_logic import run_validation # Import your core logic from the copied file

# Define the HTTP entry point for Google Cloud Functions
# The function name (e.g., gtas_validator_http) will be your entry point in Google Cloud settings
@functions_framework.http
def gtas_validator_http(request):
    """
    HTTP Cloud Function that processes GTAS and ERP files for reconciliation.
    Expects a POST request with a JSON body containing base64 encoded files:
    {
      "gtas_file_b64": "base64_string_of_gtas_csv",
      "erp_file_b64": "base64_string_of_erp_csv"
    }
    """
    if request.method != 'POST':
        return ('Method Not Allowed', 405, {'Content-Type': 'application/json'})

    request_json = request.get_json(silent=True)
    if not request_json:
        return ('Missing JSON body or invalid JSON.', 400, {'Content-Type': 'application/json'})

    gtas_file_b64 = request_json.get('gtas_file_b64')
    erp_file_b64 = request_json.get('erp_file_b64')

    if not gtas_file_b64 or not erp_file_b64:
        return ('Both gtas_file_b64 and erp_file_b64 are required.', 400, {'Content-Type': 'application/json'})

    temp_dir = tempfile.gettempdir() # /tmp directory in Cloud Functions environment
    gtas_temp_path = os.path.join(temp_dir, f"gtas_input_{os.urandom(8).hex()}.csv")
    erp_temp_path = os.path.join(temp_dir, f"erp_input_{os.urandom(8).hex()}.csv")
    
    # Define output paths for the reports
    exception_output_temp_path = os.path.join(temp_dir, f"exception_report_{os.urandom(8).hex()}.xlsx")
    fbdi_output_temp_path = os.path.join(temp_dir, f"fbdi_journal_{os.urandom(8).hex()}.csv")

    try:
        # Decode base64 and save input files to /tmp
        with open(gtas_temp_path, 'wb') as f:
            f.write(base64.b64decode(gtas_file_b64))
        with open(erp_temp_path, 'wb') as f:
            f.write(base64.b64decode(erp_file_b64))

        # Run the validation logic from validation_logic.py
        validation_result = run_validation(
            gtas_temp_path,
            erp_temp_path,
            exception_output_temp_path,
            fbdi_output_temp_path
        )

        if not validation_result["success"]:
            return (json.dumps(validation_result), 500, {'Content-Type': 'application/json'})

        # Read generated output files and encode them to base64
        exception_report_b64 = None
        fbdi_journal_b64 = None

        if os.path.exists(exception_output_temp_path):
            with open(exception_output_temp_path, 'rb') as f:
                exception_report_b64 = base64.b64encode(f.read()).decode('utf-8')
        
        if os.path.exists(fbdi_output_temp_path):
            with open(fbdi_output_temp_path, 'rb') as f:
                fbdi_journal_b64 = base64.b64encode(f.read()).decode('utf-8')

        response_payload = {
            "success": True,
            "message": validation_result["message"],
            "exception_report_b64": exception_report_b64,
            "fbdi_journal_b64": fbdi_journal_b64,
            "exception_report_filename": os.path.basename(exception_output_temp_path),
            "fbdi_journal_filename": os.path.basename(fbdi_output_temp_path)
        }
        return (json.dumps(response_payload), 200, {'Content-Type': 'application/json'})

    except Exception as e:
        print(f"Error in Cloud Function: {e}")
        return (json.dumps({"success": False, "message": f"Server error: {e}"}), 500, {'Content-Type': 'application/json'})
    finally:
        # Clean up temporary files
        if os.path.exists(gtas_temp_path):
            os.remove(gtas_temp_path)
        if os.path.exists(erp_temp_path):
            os.remove(erp_temp_path)
        if os.path.exists(exception_output_temp_path):
            os.remove(exception_output_temp_path)
        if os.path.exists(fbdi_output_temp_path):
            os.remove(fbdi_output_temp_path)