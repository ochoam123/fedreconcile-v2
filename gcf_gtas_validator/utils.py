# utils.py

from google.cloud import storage
from google.auth import default
from datetime import timedelta

def upload_and_get_signed_url(local_path, bucket_name, blob_name, expiration_minutes=60):
    """
    Uploads a local file to a Google Cloud Storage bucket and generates a signed URL.

    Args:
        local_path (str): Absolute path to the local file.
        bucket_name (str): GCS bucket name.
        blob_name (str): Destination path for the blob in GCS.
        expiration_minutes (int): Minutes before the signed URL expires.

    Returns:
        str: Signed URL for the uploaded file.
    """
    print(f"[UPLOAD] Uploading {local_path} to gs://{bucket_name}/{blob_name}")

    # Use default credentials — picks up your deployed service account
    credentials, _ = default()

    storage_client = storage.Client(credentials=credentials)
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(blob_name)

    blob.upload_from_filename(local_path)

    url = blob.generate_signed_url(
        expiration=timedelta(minutes=expiration_minutes),
        credentials=credentials
    )

    print(f"[UPLOAD] Generated signed URL: {url}")
    return url