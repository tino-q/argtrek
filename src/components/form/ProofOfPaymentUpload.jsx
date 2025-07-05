import { useState, useRef } from "react";
import { APPS_SCRIPT_URL } from "../../utils/config";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE_MB = 10;

const ProofOfPaymentUpload = ({ name, surname, orderNumber, installments }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    setMessage("");
    setError("");
    const f = e.target.files[0];
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError("Only PDF, JPG, and PNG files are allowed.");
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File must be less than ${MAX_SIZE_MB}MB.`);
      return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setMessage("");
    setError("");
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target.result.split(",")[1];
        const timestamp = Date.now();
        const formData = new FormData();
        formData.append("action", "upload_proof_of_payment");
        formData.append("fileData", base64);
        formData.append("fileName", file.name);
        formData.append("fileType", file.type);
        formData.append("name", name);
        formData.append("surname", surname);
        formData.append("orderNumber", orderNumber);
        formData.append("timestamp", timestamp);
        formData.append("installments_0", installments[0]);
        formData.append("installments_1", installments[1]);
        const res = await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          body: formData,
        });
        const result = await res.json();
        if (result.success) {
          setMessage("Upload successful!");
          setFile(null);
          fileInputRef.current.value = "";
        } else {
          setError(result.error || "Upload failed.");
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setError("Upload failed.");
      setUploading(false);
    }
  };

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
