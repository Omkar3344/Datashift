import React, { useState, useRef } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useAuth } from "../lib/context/AuthContext";
import { storage } from "../lib/appwrite";
import { ID } from "appwrite";
import {
  Upload,
  FileJson,
  FileSpreadsheet,
  ArrowRight,
  Download,
  Trash2,
  RefreshCw,
} from "lucide-react";

const Feature1 = () => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  // Removed inputFormat state
  const [outputFormat, setOutputFormat] = useState("json");
  const [convertedData, setConvertedData] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setError("");
    setConvertedData(null);
  };

  const resetForm = () => {
    setFile(null);
    setFileName("");
    setConvertedData(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;

    setFile(droppedFile);
    setFileName(droppedFile.name);
    setError("");
    setConvertedData(null);
  };

  const determineFileFormat = (filename) => {
    const extension = filename.split(".").pop().toLowerCase();
    if (extension === "csv") return "csv";
    if (extension === "json") return "json";
    if (extension === "xlsx" || extension === "xls") return "xlsx";
    return null;
  };

  const convertFile = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setIsConverting(true);
    setError("");

    try {
      // Always auto-detect the input format
      const detectedFormat = determineFileFormat(file.name);

      if (!detectedFormat) {
        throw new Error(
          "Couldn't determine file format. Please try a different file."
        );
      }

      // Read file as appropriate format
      let data;
      if (detectedFormat === "csv") {
        data = await readCSV(file);
      } else if (detectedFormat === "json") {
        data = await readJSON(file);
      } else if (detectedFormat === "xlsx") {
        data = await readXLSX(file);
      }

      // Convert to output format
      let convertedResult;
      if (outputFormat === "csv") {
        convertedResult = Papa.unparse(data);
      } else if (outputFormat === "json") {
        convertedResult = JSON.stringify(data, null, 2);
      } else if (outputFormat === "xlsx") {
        // For XLSX, we'll just store the data and handle conversion at download time
        convertedResult = data;
      }

      setConvertedData({
        data: convertedResult,
        format: outputFormat,
      });
    } catch (err) {
      console.error("Conversion error:", err);
      setError(`Error converting file: ${err.message}`);
    } finally {
      setIsConverting(false);
    }
  };

  const readCSV = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length) {
            reject(new Error("Error parsing CSV"));
          } else {
            resolve(results.data);
          }
        },
        error: (error) => reject(error),
      });
    });
  };

  const readJSON = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          resolve(jsonData);
        } catch (error) {
          reject(new Error("Invalid JSON file"));
        }
      };
      reader.onerror = () => reject(new Error("Error reading file"));
      reader.readAsText(file);
    });
  };

  const readXLSX = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

          // Convert to object array with headers
          if (jsonData.length > 1) {
            const headers = jsonData[0];
            const rows = jsonData.slice(1);
            const result = rows.map((row) => {
              const obj = {};
              headers.forEach((header, index) => {
                obj[header] = row[index];
              });
              return obj;
            });
            resolve(result);
          } else {
            resolve(jsonData);
          }
        } catch (error) {
          reject(new Error("Error processing Excel file"));
        }
      };
      reader.onerror = () => reject(new Error("Error reading file"));
      reader.readAsArrayBuffer(file);
    });
  };

  const downloadFile = () => {
    if (!convertedData) return;

    let downloadData, fileType, fileExtension;

    if (convertedData.format === "csv") {
      downloadData = convertedData.data;
      fileType = "text/csv";
      fileExtension = "csv";
    } else if (convertedData.format === "json") {
      downloadData = convertedData.data;
      fileType = "application/json";
      fileExtension = "json";
    } else if (convertedData.format === "xlsx") {
      // Convert to XLSX
      const worksheet = XLSX.utils.json_to_sheet(convertedData.data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      downloadData = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      fileType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      fileExtension = "xlsx";

      // Create a blob from the array
      const blob = new Blob([downloadData], { type: fileType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `converted.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    // For CSV and JSON, create download link
    const blob = new Blob([downloadData], { type: fileType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `converted.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const saveToAppwrite = async () => {
    if (!convertedData || !user) return;

    try {
      let blob, fileType;

      if (convertedData.format === "csv") {
        blob = new Blob([convertedData.data], { type: "text/csv" });
        fileType = "text/csv";
      } else if (convertedData.format === "json") {
        blob = new Blob([convertedData.data], { type: "application/json" });
        fileType = "application/json";
      } else if (convertedData.format === "xlsx") {
        const worksheet = XLSX.utils.json_to_sheet(convertedData.data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        const excelData = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "array",
        });
        blob = new Blob([excelData], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        fileType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      }

      // Create a meaningful filename with timestamp to prevent collisions
      const displayName = `converted_${new Date().getTime()}.${
        convertedData.format
      }`;

      const file = new File([blob], displayName, {
        type: fileType,
      });

      // Generate a unique file ID
      const fileId = ID.unique();

      // Create file with permissions and metadata in one call
      const fileUploaded = await storage.createFile(
        import.meta.env.VITE_APPWRITE_BUCKET_ID,
        fileId,
        file,
        [`read("user:${user.$id}")`, `write("user:${user.$id}")`],
        // Pass metadata as the fifth parameter
        {
          userId: user.$id,
          originalName: fileName,
          conversionType: `${determineFileFormat(fileName)} to ${outputFormat}`,
          convertedAt: new Date().toISOString(),
        }
      );

      setError("File saved to your Appwrite storage!");
    } catch (err) {
      console.error("Error saving to Appwrite:", err);
      setError("Failed to save to Appwrite storage: " + err.message);
    }
  };

  const getFileIcon = (format) => {
    switch (format) {
      case "csv":
        return <FileSpreadsheet className="w-6 h-6" />;
      case "json":
        return <FileJson className="w-6 h-6" />;
      case "xlsx":
        return <FileSpreadsheet className="w-6 h-6" />;
      default:
        return <FileJson className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen w-full max-w-5xl mx-auto px-6 py-12">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">File Converter</h1>
          <p className="text-gray-600 mt-2">
            Convert between CSV, JSON, and XLSX formats
          </p>
        </div>

        {/* File Upload Area */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {!file ? (
            <div className="space-y-4">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer rounded-md bg-white font-medium text-black focus-within:outline-none"
                >
                  <span>Upload a file</span>
                  <input
                    id="file-upload"
                    ref={fileInputRef}
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept=".csv,.json,.xlsx,.xls"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                CSV, JSON, or XLSX files only
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getFileIcon(determineFileFormat(fileName))}
                <span className="text-sm font-medium truncate max-w-xs">
                  {fileName}
                </span>
              </div>
              <button
                onClick={resetForm}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Conversion Options */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Input Format
            </label>
            <div className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50">
              {file ? (
                <span className="text-sm">
                  Auto-detected:{" "}
                  {determineFileFormat(fileName)?.toUpperCase() || "Unknown"}
                </span>
              ) : (
                <span className="text-sm text-gray-500">
                  Auto-detection (Upload a file first)
                </span>
              )}
            </div>
          </div>

          <div className="self-end mb-1">
            <ArrowRight className="h-6 w-6 text-gray-400" />
          </div>

          <div className="w-full md:w-1/3">
            <label
              htmlFor="output-format"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Output Format
            </label>
            <select
              id="output-format"
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black"
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="xlsx">XLSX</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center">
          <button
            onClick={convertFile}
            disabled={!file || isConverting}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConverting ? (
              <>
                <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Converting...
              </>
            ) : (
              "Convert File"
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-sm text-red-600 text-center">{error}</div>
        )}

        {/* Converted File */}
        {convertedData && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getFileIcon(convertedData.format)}
                <h3 className="text-sm font-medium">
                  Converted to {convertedData.format.toUpperCase()}
                </h3>
              </div>
              <div className="flex space-x-2">
                {user ? (
                  <button
                    onClick={saveToAppwrite}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-black hover:bg-gray-800"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Save to Cloud
                  </button>
                ) : (
                  <button
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-gray-400 bg-gray-200 cursor-not-allowed"
                    disabled
                    title="Login to save files to cloud"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Save to Cloud
                  </button>
                )}
                <button
                  onClick={downloadFile}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-black hover:bg-gray-800"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </button>
              </div>
            </div>

            {convertedData.format !== "xlsx" && (
              <div className="overflow-auto max-h-40 bg-white p-2 rounded border border-gray-200">
                <pre className="text-xs">
                  {typeof convertedData.data === "string"
                    ? convertedData.data.length > 1000
                      ? convertedData.data.substring(0, 1000) + "..."
                      : convertedData.data
                    : JSON.stringify(convertedData.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Feature1;
