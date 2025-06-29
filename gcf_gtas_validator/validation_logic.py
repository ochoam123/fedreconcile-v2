import pandas as pd
import numpy as np

def validate_erp_vs_gtas(erp_df: pd.DataFrame, gtas_df: pd.DataFrame):
    errors = []

    # --- Normalize column names ---
    erp_df.columns = [col.strip().upper() for col in erp_df.columns]
    gtas_df.columns = [col.strip().upper() for col in gtas_df.columns]

    print("ERP columns after uppercasing:", list(erp_df.columns))
    print("GTAS columns after uppercasing:", list(gtas_df.columns))

    # --- Check required columns ---
    required_erp_cols = {"USSGL_ACCOUNT", "FUND", "TAS", "NET_BALANCE"}
    required_gtas_cols = {"USSGL_ACCOUNT", "TAS", "GTAS_BALANCE"}

    if not required_erp_cols.issubset(erp_df.columns):
        missing = required_erp_cols - set(erp_df.columns)
        errors.append({"row": None, "message": f"Missing ERP columns: {', '.join(missing)}"})
        return False, errors, {"total_rows": 0, "errors": len(errors)}, pd.DataFrame()

    if not required_gtas_cols.issubset(gtas_df.columns):
        missing = required_gtas_cols - set(gtas_df.columns)
        errors.append({"row": None, "message": f"Missing GTAS columns: {', '.join(missing)}"})
        return False, errors, {"total_rows": 0, "errors": len(errors)}, pd.DataFrame()

    # --- Merge DataFrames on USSGL_ACCOUNT & TAS ---
    merged_df = pd.merge(
        erp_df,
        gtas_df,
        on=["USSGL_ACCOUNT", "TAS"],
        how="outer",
        indicator=True,
        suffixes=('_ERP', '_GTAS'),
    )

    print("Merged DataFrame dtypes:\n", merged_df.dtypes)
    print("First few rows of merged DataFrame:\n", merged_df.head())

    # --- Check for unmatched rows ---
    unmatched_rows = merged_df[merged_df["_merge"] != "both"]
    for idx, row in unmatched_rows.iterrows():
        errors.append({
            "row": int(idx),
            "message": f"Row mismatch: exists only in {'ERP' if row['_merge'] == 'left_only' else 'GTAS'} data."
        })

    # --- Compare balances with zero tolerance ---
    matched_rows = merged_df[merged_df["_merge"] == "both"]
    for idx, row in matched_rows.iterrows():
        net_bal = row["NET_BALANCE"]
        gtas_bal = row["GTAS_BALANCE"]

        try:
            if not np.isclose(float(net_bal), float(gtas_bal), atol=0.0):
                errors.append({
                    "row": int(idx),
                    "message": (
                        f"Balance mismatch at USSGL {row['USSGL_ACCOUNT']}, TAS {row['TAS']}: "
                        f"ERP NET_BALANCE={net_bal}, GTAS_BALANCE={gtas_bal}"
                    )
                })
        except Exception as e:
            errors.append({
                "row": int(idx),
                "message": f"Error comparing balances at row {idx}: {str(e)}"
            })

    # --- Build corrected FBDI DataFrame ---
    fbdi_corrections = matched_rows.copy()
    fbdi_corrections["CORRECTED_AMOUNT"] = matched_rows["GTAS_BALANCE"]

    is_valid = len(errors) == 0
    summary = {"total_rows": len(merged_df), "errors": len(errors)}

    return is_valid, errors, summary, fbdi_corrections