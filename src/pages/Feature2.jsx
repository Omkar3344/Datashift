import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/context/AuthContext";
import { storage } from "../lib/appwrite";
import { Query } from "appwrite";
import {
  FileJson,
  FileSpreadsheet,
  File,
  Trash2,
  Download,
  RefreshCw,
  FolderOpen,
} from "lucide-react";

const Feature2 = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Get user from both AuthContext and localStorage for reliability
  const { user: authUser } = useAuth();
  const [localUser, setLocalUser] = useState(
    JSON.parse(localStorage.getItem("userSession"))
  );

  // Use whichever user object is available
  const user = authUser || localUser;

  useEffect(() => {
    if (user) {
      fetchUserFiles();
    }
  }, [user]);

  const fetchUserFiles = async () => {
    if (!user) {
      setError("User session not found");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Log user info for debugging
      console.log("Current user:", user);

      // Get all files from the bucket
      const response = await storage.listFiles(
        import.meta.env.VITE_APPWRITE_BUCKET_ID
      );

      console.log("All files in bucket:", response.files);

      // Less strict filtering with fallback
      const userFiles = response.files.filter((file) => {
        // Log each file's metadata for debugging
        console.log(`File ${file.name} metadata:`, file.$metadata);

        // Check if metadata exists and has userId matching current user
        // OR if the file permissions include this user (fallback)
        return (
          (file.$metadata && file.$metadata.userId === user.$id) ||
          (file.$permissions &&
            file.$permissions.includes(`read("user:${user.$id}")`))
        );
      });

      console.log("Filtered user files:", userFiles);

      setFiles(userFiles);

      if (userFiles.length === 0) {
        console.log("No files match the current user ID:", user.$id);
      }
    } catch (err) {
      console.error("Error fetching files:", err);
      setError("Failed to load your files: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (fileId) => {
    try {
      await storage.deleteFile(import.meta.env.VITE_APPWRITE_BUCKET_ID, fileId);
      // Update files list after deletion
      setFiles(files.filter((file) => file.$id !== fileId));
    } catch (err) {
      console.error("Error deleting file:", err);
      setError("Failed to delete file: " + err.message);
    }
  };

  const downloadFile = (fileId, fileName) => {
    try {
      const downloadUrl = storage.getFileDownload(
        import.meta.env.VITE_APPWRITE_BUCKET_ID,
        fileId
      );

      // Create anchor element and trigger download
      const a = document.createElement("a");
      a.href = downloadUrl.toString();
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error downloading file:", err);
      setError("Failed to download file: " + err.message);
    }
  };

  const getFileIcon = (mimeType, size = "w-6 h-6") => {
    if (mimeType.includes("spreadsheet") || mimeType.includes("csv")) {
      return <FileSpreadsheet className={size} />;
    } else if (mimeType.includes("json")) {
      return <FileJson className={size} />;
    } else {
      return <File className={size} />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen w-full max-w-5xl mx-auto px-6 py-12">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">My Files</h1>
          <p className="text-gray-600 mt-2">
            Manage your converted and stored files
          </p>
        </div>

        {/* Refresh button */}
        <div className="flex justify-end">
          <button
            onClick={fetchUserFiles}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh Files
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="text-sm text-red-600 text-center">{error}</div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="animate-spin h-8 w-8 text-gray-500" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <FolderOpen className="h-16 w-16 text-gray-300 mb-4" />
                <p>No files found. Convert some files in the File Converter.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {files.map((file) => (
                  <li key={file.$id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            {getFileIcon(file.mimeType)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <h2 className="text-sm font-medium text-gray-900">
                            {file.name}
                          </h2>
                          <div className="mt-1 flex items-center text-xs text-gray-500">
                            <span>{formatDate(file.$createdAt)}</span>
                            <span className="mx-1">•</span>
                            <span>
                              {file.$metadata?.originalName || "Converted File"}
                            </span>
                            {file.$metadata?.conversionType && (
                              <>
                                <span className="mx-1">•</span>
                                <span>{file.$metadata.conversionType}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => downloadFile(file.$id, file.name)}
                          className="inline-flex items-center px-2 py-1 border border-transparent rounded text-xs text-white bg-green-600 hover:bg-green-700"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </button>
                        <button
                          onClick={() => deleteFile(file.$id)}
                          className="inline-flex items-center px-2 py-1 border border-transparent rounded text-xs text-white bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Feature2;
