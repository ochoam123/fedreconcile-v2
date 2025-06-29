import functions_framework
from flask import request, jsonify
import pandas as pd
import tempfile
import os
from validation_logic import validate_erp_vs_gtas
from utils import upload_and_get_signed_url  # ✅ import from your new utils.py

# Config
BUCKET_NAME = 'fedreconcile-reports'

@functions_framework.http
def validate_gtas(request):
    if request.method != 'POST':
        return jsonify({'error': 'Only POST method is allowed.'}), 405

    try:
        # Check for files in request
        if 'erp_file' not in request.files or 'gtas_file' not in request.files:
            return jsonify({'error': 'Both erp_file and gtas_file must be provided.'}), 400

        erp_file = request.files['erp_file']
        gtas_file = request.files['gtas_file']

        # Save to temporary files
        erp_temp = tempfile.NamedTemporaryFile(delete=False, suffix='.csv')
        gtas_temp = tempfile.NamedTemporaryFile(delete=False, suffix='.csv')
        erp_file.save(erp_temp.name)
        gtas_file.save(gtas_temp.name)

        # Load CSVs
        erp_df = pd.read_csv(erp_temp.name)
        gtas_df = pd.read_csv(gtas_temp.name)

        # Validate
        is_valid, errors, summary, fbdi_corrections = validate_erp_vs_gtas(erp_df, gtas_df)

        # Save correction files locally
        fbdi_path = '/tmp/fbdi_journal_corrections.csv'
        fbdi_corrections.to_csv(fbdi_path, index=False)

        exceptions_path = '/tmp/exception_report.csv'
        pd.DataFrame(errors).to_csv(exceptions_path, index=False)

        # Upload files & get signed URLs
        fbdi_url = upload_and_get_signed_url(fbdi_path, BUCKET_NAME, 'fbdi_journal_corrections.csv')
        exceptions_url = upload_and_get_signed_url(exceptions_path, BUCKET_NAME, 'exception_report.csv')

        return jsonify({
            'is_valid': is_valid,
            'summary': summary,
            'errors': errors,
            'fbdi_file': fbdi_url,
            'exception_file': exceptions_url,
        })

    except Exception as e:
        print(f"[ERROR] Exception during validation: {e}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

    finally:
        # Clean up
        for path in [erp_temp.name, gtas_temp.name]:
            try:
                os.remove(path)
            except Exception:
                pass