# gcf_gtas_validator/main.py
from flask import Flask, request, jsonify
import base64
import os
import tempfile
import json
import logging

# Import your core validation logic module (Changed from relative to absolute)
import validation_logic # <--- FIXED IMPORT HERE

# Configure logging
logging.basicConfig(level=logging.INFO)

# Initialize Flask app
app = Flask(__name__)

@app.route('/', methods=['POST'])
def gtas_validator_endpoint():
    """
    HTTP Endpoint for GTAS validation in Cloud Run.
    """
    if request.method != 'POST':
        return jsonify({"success": False, "message": "Method Not Allowed. Use POST."}), 405

    if not request.is_json:
        return jsonify({"success": False, "message": "Content-Type must be application/json"}), 400

    request_json = request.get_json(silent=True)
    if not request_json:
        return jsonify({"success": False, "message": "Invalid JSON in request body."}), 400

    gtas_file_b64 = request_json.get('gtas_file_b64')
    erp_file_b64 = request_json.get('erp_file_b64')
    gtas_file_name = request_json.get('gtas_file_name', 'gtas_report.csv')
    erp_file_name = request_json.get('erp_file_name', 'erp_balances.csv')

    if not gtas_file_b64 or not erp_file_b64:
        return jsonify({"success": False, "message": "Both gtas_file_b64 and erp_file_b64 are required."}), 400

    with tempfile.TemporaryDirectory() as tmpdir:
        gtas_input_path = os.path.join(tmpdir, gtas_file_name)
        erp_input_path = os.path.join(tmpdir, erp_file_name)
        exception_output_path = os.path.join(tmpdir, "exception_report.xlsx")
        fbdi_output_path = os.path.join(tmpdir, "fbdi_journal_corrections.csv")
        
        # Path to rules file relative to the main.py location in the deployed container
        rules_file_path = os.path.join(os.path.dirname(__file__), "validation_rules.json")

        try:
            with open(gtas_input_path, 'wb') as f:
                f.write(base64.b64decode(gtas_file_b64))
            with open(erp_input_path, 'wb') as f:
                f.write(base64.b64decode(erp_file_b64))

            logging.info(f"Input files saved: {gtas_input_path}, {erp_input_path}")

            validation_result = validation_logic.run_validation( # Call validation_logic
                gtas_input_path,
                erp_input_path,
                exception_output_path,
                fbdi_output_path,
                rules_file_path
            )

            if validation_result["success"]:
                with open(exception_output_path, 'rb') as f:
                    exception_b64 = base64.b64encode(f.read()).decode('utf-8')
                with open(fbdi_output_path, 'rb') as f:
                    fbdi_b64 = base64.b64encode(f.read()).decode('utf-8')

                return jsonify({
                    "success": True,
                    "message": validation_result["message"],
                    "exceptionReportB64": exception_b64,
                    "fbdiJournalB64": fbdi_b64,
                    "exceptionReportFileName": "exception_report.xlsx",
                    "fbdiJournalFileName": "fbdi_journal_corrections.csv"
                }), 200
            else:
                return jsonify({"success": False, "message": validation_result["message"]}), 500

        except Exception as e:
            logging.error(f"Error during GTAS validation: {e}", exc_info=True)
            return jsonify({"success": False, "message": f"Internal server error: {e}"}), 500
    
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))