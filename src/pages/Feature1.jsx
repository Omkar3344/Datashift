import React, { useState, useRef, useMemo, useEffect } from "react";
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
  Table,
  BarChart as BarChartIcon,
  Eye,
} from "lucide-react";
// Import Recharts components
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const Feature1 = () => {
  // All state variables remain unchanged
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [outputFormat, setOutputFormat] = useState("json");
  const [convertedData, setConvertedData] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  
  const [showPreview, setShowPreview] = useState(true);
  const [showCharts, setShowCharts] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [chartType, setChartType] = useState("bar");

  // All functions remain unchanged
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
    setPreviewData(null);
    setShowCharts(false);
    setShowPreview(true);
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

      // Set the preview data
      setPreviewData(data);
      
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
      
      // Show charts after conversion
      setShowCharts(true);
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
        const fileContent = e.target.result;
        
        // First try standard parsing
        try {
          const jsonData = JSON.parse(fileContent);
          resolve(jsonData);
          return;
        } catch (initialError) {
          console.log("Initial JSON parse failed, trying recovery methods...");
          
          // Try recovery methods
          try {
            // Method 1: Look for valid JSON objects in the content
            const cleanedData = attemptJSONRecovery(fileContent);
            if (cleanedData) {
              setError("Warning: File contained trailing data that was removed.");
              resolve(cleanedData);
              return;
            }
            
            // If all recovery methods fail, throw the original error
            reject(new Error(
              "Invalid JSON format. The file contains trailing data or syntax errors that couldn't be automatically fixed. Please ensure it's a valid JSON file."
            ));
          } catch (recoveryError) {
            reject(new Error(
              "Failed to process JSON: " + (recoveryError.message || initialError.message)
            ));
          }
        }
      };
      reader.onerror = () => reject(new Error("Error reading file"));
      reader.readAsText(file);
    });
  };

  // Function to attempt recovery of valid JSON from malformed content
  const attemptJSONRecovery = (content) => {
    // Strategy 1: Find the first complete JSON object
    try {
      // Look for patterns that typically indicate a complete JSON object
      const jsonObjectRegex = /\{(?:[^{}]|(\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}/g;
      const matches = content.match(jsonObjectRegex);
      
      if (matches && matches.length > 0) {
        // If we found one valid object, return it
        if (matches.length === 1) {
          return JSON.parse(matches[0]);
        }
        
        // If we found multiple objects, try to combine them into an array
        if (matches.length > 1) {
          const parsedObjects = [];
          for (const match of matches) {
            try {
              parsedObjects.push(JSON.parse(match));
            } catch (e) {
              // Skip invalid objects
            }
          }
          
          if (parsedObjects.length > 0) {
            return parsedObjects;
          }
        }
      }
      
      // Strategy 2: Try to find valid JSON array
      const jsonArrayRegex = /\[(?:[^\[\]]|(\[(?:[^\[\]]|(?:\[[^\[\]]*\]))*\]))*\]/g;
      const arrayMatches = content.match(jsonArrayRegex);
      
      if (arrayMatches && arrayMatches.length > 0) {
        // Try to parse the first array match
        return JSON.parse(arrayMatches[0]);
      }
      
      // Strategy 3: Look for the largest subset of the file that could be valid JSON
      // This handles cases where there might be text before or after the JSON
      for (let i = 0; i < content.length; i++) {
        if (content[i] === '{' || content[i] === '[') {
          // Found a potential start of JSON
          for (let j = content.length; j > i; j--) {
            const potentialJSON = content.substring(i, j);
            try {
              const parsed = JSON.parse(potentialJSON);
              return parsed;
            } catch (e) {
              // Continue trying smaller subsets
            }
          }
        }
      }
      
      return null;
    } catch (e) {
      console.error("Recovery attempt failed:", e);
      return null;
    }
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
    <div className="min-h-screen w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold">File Converter</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Convert between CSV, JSON, and XLSX formats
          </p>
        </div>

        {/* File Upload Area - more padding on larger screens */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 text-center"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {!file ? (
            <div className="space-y-3 sm:space-y-4">
              <Upload className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
              <div className="text-xs sm:text-sm text-gray-600">
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
              <div className="flex items-center space-x-2 sm:space-x-3">
                {getFileIcon(determineFileFormat(fileName))}
                <span className="text-xs sm:text-sm font-medium truncate max-w-[150px] sm:max-w-xs">
                  {fileName}
                </span>
              </div>
              <button
                onClick={resetForm}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Conversion Options - stack on mobile, row on desktop */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <div className="w-full sm:w-1/3">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Input Format
            </label>
            <div className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50">
              {file ? (
                <span className="text-xs sm:text-sm">
                  Auto-detected:{" "}
                  {determineFileFormat(fileName)?.toUpperCase() || "Unknown"}
                </span>
              ) : (
                <span className="text-xs sm:text-sm text-gray-500">
                  Auto-detection (Upload a file first)
                </span>
              )}
            </div>
          </div>

          <div className="self-center my-2 sm:self-end sm:mb-1 sm:my-0">
            <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
          </div>

          <div className="w-full sm:w-1/3">
            <label
              htmlFor="output-format"
              className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
            >
              Output Format
            </label>
            <select
              id="output-format"
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black text-xs sm:text-sm"
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
        <div className="flex justify-center mt-4 sm:mt-6">
          <button
            onClick={convertFile}
            disabled={!file || isConverting}
            className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConverting ? (
              <>
                <RefreshCw className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Converting...
              </>
            ) : (
              "Convert File"
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-xs sm:text-sm text-red-600 text-center">{error}</div>
        )}

        {/* Converted File */}
        {convertedData && (
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2">
                {getFileIcon(convertedData.format)}
                <h3 className="text-xs sm:text-sm font-medium">
                  Converted to {convertedData.format.toUpperCase()}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {user ? (
                  <button
                    onClick={saveToAppwrite}
                    className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 border border-transparent text-xs font-medium rounded text-white bg-black hover:bg-gray-800"
                  >
                    <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Save to Cloud
                  </button>
                ) : (
                  <button
                    className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 border border-transparent text-xs font-medium rounded text-gray-400 bg-gray-200 cursor-not-allowed"
                    disabled
                    title="Login to save files to cloud"
                  >
                    <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Save to Cloud
                  </button>
                )}
                <button
                  onClick={downloadFile}
                  className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 border border-transparent text-xs font-medium rounded text-white bg-black hover:bg-gray-800"
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Download
                </button>
              </div>
            </div>

            {convertedData.format !== "xlsx" && (
              <div className="overflow-auto max-h-36 sm:max-h-40 bg-white p-2 rounded border border-gray-200">
                <pre className="text-[10px] sm:text-xs">
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

        {/* Data Preview and Charts Section */}
        {convertedData && previewData && (
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="border-b">
              <nav className="flex" aria-label="Tabs">
                <button
                  onClick={() => {
                    setShowPreview(true);
                    setShowCharts(false);
                  }}
                  className={`${
                    showPreview
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } flex-1 py-2 sm:py-4 px-1 text-center border-b-2 font-medium text-xs sm:text-sm`}
                >
                  <div className="flex items-center justify-center">
                    <Table className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Data Preview
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setShowCharts(true);
                  }}
                  className={`${
                    showCharts
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } flex-1 py-2 sm:py-4 px-1 text-center border-b-2 font-medium text-xs sm:text-sm`}
                >
                  <div className="flex items-center justify-center">
                    <BarChartIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Charts
                  </div>
                </button>
              </nav>
            </div>
            
            <div className="p-3 sm:p-4">
              {showPreview && (
                <>
                  <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-4">Data Preview</h3>
                  <DataPreview data={previewData} />
                </>
              )}
              
              {showCharts && (
                <>
                  <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-4">Data Visualization</h3>
                  <ChartVisualization data={previewData} type={chartType} />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const DataPreview = ({ data }) => {
  // If data is not an array or empty, show a message
  if (!Array.isArray(data) || data.length === 0) {
    return <p className="text-center text-gray-500 py-4">No data to preview</p>;
  }

  // Get headers - assuming first item has all fields
  const headers = Object.keys(data[0]);
  
  // Limit preview to first 10 rows
  const previewRows = data.slice(0, 10);

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header, idx) => (
              <th 
                key={idx}
                className="px-2 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {previewRows.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {headers.map((header, cellIdx) => (
                <td 
                  key={cellIdx}
                  className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-[10px] sm:text-sm text-gray-500"
                >
                  {row[header]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ChartVisualization = ({ data, type }) => {
  // Add local state for chart type that's initialized with the type prop
  const [localChartType, setLocalChartType] = useState(type);
  
  // Update local chart type when the prop changes
  useEffect(() => {
    setLocalChartType(type);
  }, [type]);
  
  // Process data for visualization
  const chartData = useMemo(() => {
    // Data processing logic remains the same
    if (!Array.isArray(data) || data.length === 0) return [];
    
    // Find numeric columns for charting
    const firstRow = data[0];
    const numericColumns = Object.keys(firstRow).filter(key => 
      typeof firstRow[key] === 'number' || !isNaN(Number(firstRow[key]))
    );
    
    // Find potential categorical columns
    const categoricalColumns = Object.keys(firstRow).filter(key => 
      typeof firstRow[key] === 'string' && !numericColumns.includes(key)
    );
    
    if (numericColumns.length === 0) {
      // No numeric data to chart
      return [];
    }
    
    if (localChartType === "pie" && categoricalColumns.length > 0) {
      // For pie chart logic
      const categoryColumn = categoricalColumns[0];
      const valueColumn = numericColumns[0];
      
      const aggregated = data.reduce((acc, row) => {
        const category = row[categoryColumn] || 'Unknown';
        const value = Number(row[valueColumn]) || 0;
        
        if (!acc[category]) acc[category] = 0;
        acc[category] += value;
        
        return acc;
      }, {});
      
      return Object.entries(aggregated).map(([name, value]) => ({
        name,
        value
      }));
    } else {
      // For bar chart or default
      if (categoricalColumns.length > 0) {
        const categoryColumn = categoricalColumns[0];
        
        return data.slice(0, 10).map(row => {
          const chartRow = { name: row[categoryColumn] || 'Unknown' };
          numericColumns.forEach(col => {
            chartRow[col] = Number(row[col]) || 0;
          });
          return chartRow;
        });
      } else {
        return data.slice(0, 10).map((row, index) => {
          const chartRow = { name: `Row ${index + 1}` };
          numericColumns.forEach(col => {
            chartRow[col] = Number(row[col]) || 0;
          });
          return chartRow;
        });
      }
    }
  }, [data, localChartType]);
  
  // Get columns for bar chart
  const barColumns = useMemo(() => {
    if (!chartData[0]) return [];
    return Object.keys(chartData[0]).filter(key => key !== 'name');
  }, [chartData]);
  
  // Colors for the charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 sm:h-64">
        <p className="text-gray-500 text-xs sm:text-sm">No suitable data for charts</p>
        <p className="text-xs text-gray-400 mt-2">Charts require numeric data</p>
      </div>
    );
  }
  
  return (
    <div className="py-2 sm:py-4">
      <div className="flex justify-end mb-2 sm:mb-4">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            onClick={() => setLocalChartType("bar")}
            className={`px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium ${
              localChartType === "bar" 
                ? "bg-black text-white" 
                : "bg-white text-gray-700 hover:bg-gray-50"
            } border border-gray-300 rounded-l-lg`}
          >
            Bar Chart
          </button>
          <button
            onClick={() => setLocalChartType("pie")}
            className={`px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium ${
              localChartType === "pie" 
                ? "bg-black text-white" 
                : "bg-white text-gray-700 hover:bg-gray-50"
            } border-t border-b border-r border-gray-300 rounded-r-lg`}
          >
            Pie Chart
          </button>
        </div>
      </div>
      
      <div className="h-60 sm:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {localChartType === "pie" ? (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={window.innerWidth < 640 ? 80 : 120}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          ) : (
            <BarChart
              data={chartData}
              margin={{
                top: 5,
                right: window.innerWidth < 640 ? 10 : 30,
                left: window.innerWidth < 640 ? 10 : 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{fontSize: window.innerWidth < 640 ? 10 : 12}} />
              <YAxis tick={{fontSize: window.innerWidth < 640 ? 10 : 12}} />
              <Tooltip />
              <Legend wrapperStyle={{fontSize: window.innerWidth < 640 ? 10 : 12}} />
              {barColumns.map((column, index) => (
                <Bar 
                  key={column} 
                  dataKey={column} 
                  fill={COLORS[index % COLORS.length]} 
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Feature1;
