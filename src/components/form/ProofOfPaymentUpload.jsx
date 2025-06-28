import { useState, useRef, useCallback } from "react";

import { uploadProofOfPayment } from "../../utils/api";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE_MB = 10;

const ProofOfPaymentUpload = ({ name, surname, orderNumber, installments }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef();

  const handleFileChange = useCallback((e) => {
    setMessage("");
    setError("");
    const [f] = e.target.files;
    if (!f) {
      return;
    }
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError("Only PDF, JPG, and PNG files are allowed.");
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File must be less than ${MAX_SIZE_MB}MB.`);
      return;
    }
    setFile(f);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) {
      return;
    }
    setUploading(true);
    setMessage("");
    setError("");
    try {
      await uploadProofOfPayment({
        file,
        name,
        surname,
        orderNumber,
        installments,
      });
      
      setMessage("Upload successful!");
      setFile(null);
      fileInputRef.current.value = "";
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }, [file, name, surname, orderNumber, installments]);

  return (
    <div className="proof-upload">
      <label htmlFor="proof-upload-input">
        <strong>Upload proof of payment</strong>
      </label>
      <input
        id="proof-upload-input"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
        ref={fileInputRef}
        disabled={uploading}
      />
      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || uploading}
        className="btn-primary"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
      {message && <div className="upload-success">{message}</div>}
      {error && <div className="upload-error">{error}</div>}
    </div>
  );
};

export default ProofOfPaymentUpload;
