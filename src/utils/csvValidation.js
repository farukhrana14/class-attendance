/**
 * CSV Validation and Sanitization Utilities
 * 
 * This module provides functions for validating and sanitizing CSV data
 * to ensure data integrity and security when importing student records.
 */

/**
 * Validates a CSV file's type, extension, and size
 * @param {File} file - The file object to validate
 * @returns {Object} Validation result
 */
export function validateCSVFile(file) {
  // Check MIME type
  const validMimeTypes = ['text/csv', 'application/csv', 'text/plain'];
  if (!validMimeTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type: ${file.type}. Expected CSV file.`
    };
  }
  
  // Check file extension
  const extension = file.name.split('.').pop().toLowerCase();
  if (extension !== 'csv') {
    return {
      isValid: false,
      error: `Invalid file extension: .${extension}. Expected .csv file.`
    };
  }
  
  // Check file size (limit to 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 5MB.`
    };
  }
  
  return { isValid: true };
}

/**
 * Detects and normalizes text encoding from a buffer
 * @param {ArrayBuffer} buffer - The file buffer
 * @returns {string} Decoded text content
 */
export function detectAndNormalizeEncoding(buffer) {
  // Try to detect BOM (Byte Order Mark) for UTF-8, UTF-16, etc.
  const view = new Uint8Array(buffer);
  if (view.length >= 3 && 
      view[0] === 0xEF && 
      view[1] === 0xBB && 
      view[2] === 0xBF) {
    // UTF-8 BOM detected, skip these bytes
    return new TextDecoder('utf-8').decode(buffer.slice(3));
  }
  
  // Try various encodings if needed
  try {
    return new TextDecoder('utf-8').decode(buffer);
  } catch (e) {
    // Fallback to ISO-8859-1 or other encodings if UTF-8 fails
    try {
      return new TextDecoder('iso-8859-1').decode(buffer);
    } catch (e2) {
      throw new Error('Unable to determine file encoding');
    }
  }
}

/**
 * Parses CSV text into structured rows and detects headers
 * @param {string} csvText - Raw CSV text content
 * @returns {Object} Parsed rows, header info, and any errors
 */
export function parseCSV(csvText) {
  try {
    // Normalize line endings
    const normalizedText = csvText.replace(/\r\n?/g, '\n');
    
    // Split into lines and filter out empty lines
    const lines = normalizedText.split('\n').filter(line => line.trim());
    
    // Parse each line into fields
    const rows = lines.map(line => {
      const fields = [];
      let currentField = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1] || '';
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // Escaped quote inside quotes
            currentField += '"';
            i++; // Skip the next quote
          } else {
            // Toggle quote mode
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          // End of field
          fields.push(currentField);
          currentField = '';
        } else {
          // Regular character
          currentField += char;
        }
      }
      
      // Add the last field
      fields.push(currentField);
      return fields;
    });
    
    // Check if the first row looks like a header
    const firstRow = rows[0] || [];
    const hasHeader = firstRow.some(cell => 
      typeof cell === 'string' && 
      (cell.toLowerCase().includes('id') || 
       cell.toLowerCase().includes('name') || 
       cell.toLowerCase().includes('email') || 
       cell.toLowerCase().includes('section'))
    );
    
    // Detect if we have a single column format (common for test data)
    const isSingleColumn = rows.every(row => row.length === 1);
    
    // Check field count consistency only for multi-column CSVs
    const fieldCountErrors = [];
    const expectedFieldCount = 4; // StudentID, Name, Email, Section
    
    if (!isSingleColumn) {
      rows.forEach((row, idx) => {
        if (row.length !== expectedFieldCount) {
          fieldCountErrors.push(`Row ${idx + 1}: Expected ${expectedFieldCount} fields, found ${row.length}`);
        }
      });
    }
    
    return {
      rows,
      hasHeader,
      errors: fieldCountErrors,
      dataRows: hasHeader && rows.length > 1 ? rows.slice(1) : rows,
      isSingleColumn
    };
  } catch (err) {
    return { 
      rows: [], 
      errors: [`Failed to parse CSV: ${err.message}`], 
      hasHeader: false,
      dataRows: [],
      isSingleColumn: false
    };
  }
}

/**
 * Validates and sanitizes student ID
 * @param {string} value - Raw student ID
 * @returns {Object} Validation result
 */
export function validateStudentId(value) {
  // Trim and ensure value exists
  const sanitized = (value || "").toString().trim();
  
  if (!sanitized) {
    return { isValid: false, error: "Student ID is required", value: sanitized };
  }
  
  // Check for reasonable length
  if (sanitized.length > 50) {
    return { isValid: false, error: "Student ID is too long", value: sanitized };
  }
  
  // Sanitize: Remove any potential script tags or HTML
  const noHtml = sanitized.replace(/<[^>]*>/g, '');
  
  // Check for SQL injection patterns
  if (/['";]/.test(noHtml) || /\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b/i.test(noHtml)) {
    return { isValid: false, error: "Student ID contains invalid characters", value: noHtml };
  }
  
  // Allow alphanumeric characters, hyphens, and underscores
  if (!/^[a-zA-Z0-9_\-]+$/.test(noHtml)) {
    return { isValid: false, error: "Student ID should only contain letters, numbers, hyphens and underscores", value: noHtml };
  }
  
  return { isValid: true, value: noHtml };
}

/**
 * Validates and sanitizes student name
 * @param {string} value - Raw name
 * @returns {Object} Validation result
 */
export function validateName(value) {
  // Trim and ensure value exists
  const sanitized = (value || "").toString().trim();
  
  if (!sanitized) {
    return { isValid: false, error: "Name is required", value: sanitized };
  }
  
  // Check for reasonable length
  if (sanitized.length > 100) {
    return { isValid: false, error: "Name is too long", value: sanitized };
  }
  
  // Remove any HTML tags
  const noHtml = sanitized.replace(/<[^>]*>/g, '');
  
  // Check for non-name characters that could indicate code injection
  if (/[<>{}[\]()`;]/.test(noHtml)) {
    return { isValid: false, error: "Name contains invalid characters", value: noHtml };
  }
  
  // Updated name format validation (allows letters, numbers, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z0-9\s'\-\.]+$/.test(noHtml)) {
    return { isValid: false, error: "Name should only contain letters, numbers, spaces, apostrophes, and hyphens", value: noHtml };
  }
  
  return { isValid: true, value: noHtml };
}

/**
 * Validates and sanitizes email
 * @param {string} value - Raw email
 * @returns {Object} Validation result
 */
export function validateEmail(value) {
  // Trim and ensure value exists
  const sanitized = (value || "").toString().trim().toLowerCase();
  
  if (!sanitized) {
    return { isValid: false, error: "Email is required", value: sanitized };
  }
  
  // Use a robust email validation regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(sanitized)) {
    return { isValid: false, error: "Invalid email format", value: sanitized };
  }
  
  // Check for reasonable length
  if (sanitized.length > 100) {
    return { isValid: false, error: "Email is too long", value: sanitized };
  }
  
  return { isValid: true, value: sanitized };
}

/**
 * Validates and sanitizes section
 * @param {string} value - Raw section
 * @returns {Object} Validation result
 */
export function validateSection(value) {
  // Trim and ensure value exists
  const sanitized = (value || "").toString().trim();
  
  if (!sanitized) {
    return { isValid: false, error: "Section is required", value: sanitized };
  }
  
  // Check for reasonable length
  if (sanitized.length > 20) {
    return { isValid: false, error: "Section is too long", value: sanitized };
  }
  
  // Sanitize: Remove any potential script tags or HTML
  const noHtml = sanitized.replace(/<[^>]*>/g, '');
  
  // Allow alphanumeric characters, spaces, hyphens, and basic punctuation
  if (!/^[a-zA-Z0-9\s\-_\.]+$/.test(noHtml)) {
    return { isValid: false, error: "Section should only contain letters, numbers, spaces, hyphens, and underscores", value: noHtml };
  }
  
  return { isValid: true, value: noHtml };
}

/**
 * Validates and sanitizes a complete student record
 * @param {Object} record - Raw student record
 * @returns {Object} Validation result with sanitized record
 */
export function validateStudentRecord(record) {
  // Basic field validations first
  const validations = {
    studentId: validateStudentId(record.studentId),
    name: validateName(record.name),
    email: validateEmail(record.email),
    section: validateSection(record.section)
  };
  
  // Check if any validations failed
  const invalidFields = Object.entries(validations)
    .filter(([_, result]) => !result.isValid)
    .map(([field, result]) => `${field}: ${result.error}`);
    
  if (invalidFields.length > 0) {
    return { isValid: false, errors: invalidFields };
  }
  
  // Cross-field validations could be added here
  // For example, checking if email domain matches expected university domain
  // or if student ID follows a specific pattern for the institution
  
  // Final sanitized record
  const sanitizedRecord = {
    studentId: validations.studentId.value,
    name: validations.name.value,
    email: validations.email.value,
    section: validations.section.value,
    id: validations.email.value // Using email as ID
  };
  
  return {
    isValid: true,
    record: sanitizedRecord
  };
}

/**
 * Processes and validates rows of CSV data
 * @param {Array} rows - Array of data rows from CSV
 * @param {boolean} hasHeader - Whether the first row is a header
 * @returns {Object} Processed results with valid records and errors
 */
export function processCSVRows(rows, hasHeader = false) {
  const validatedResults = [];
  const errors = [];
  
  // Process each row with enhanced validation
  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i];
      
      // Skip completely empty rows
      if (!row || row.length === 0 || row.every(cell => !cell)) continue;
      
      // Verify expected field count
      if (row.length < 4) {
        errors.push(`Row ${hasHeader ? i + 2 : i + 1}: Missing fields. Expected format: Student ID, Name, Email, Section`);
        continue;
      }
      
      // Extract fields with basic sanitization
      const rawRecord = {
        studentId: String(row[0] || "").trim(),
        name: String(row[1] || "").trim(),
        email: String(row[2] || "").trim(),
        section: String(row[3] || "").trim()
      };
      
      // Deep validation and sanitization
      const validation = validateStudentRecord(rawRecord);
      
      if (!validation.isValid) {
        const rowNum = hasHeader ? i + 2 : i + 1;
        errors.push(`Row ${rowNum}: ${validation.errors.join(", ")}`);
        continue;
      }
      
      // Store validated and sanitized record
      validatedResults.push(validation.record);
      
    } catch (err) {
      errors.push(`Row ${hasHeader ? i + 2 : i + 1}: Unexpected error - ${err.message}`);
    }
  }
  
  // Check for duplicates among valid records
  const emailSet = new Set();
  const noDuplicates = validatedResults.filter(record => {
    if (emailSet.has(record.email.toLowerCase())) {
      errors.push(`Duplicate email in CSV: ${record.email}`);
      return false;
    }
    emailSet.add(record.email.toLowerCase());
    return true;
  });
  
  return {
    validRecords: noDuplicates,
    errors
  };
}

// Memory of processed files to prevent duplicates
const processedFiles = new Set();

/**
 * Generates a unique token for a file to prevent duplicate processing
 * @param {File} file - File object
 * @returns {string} Unique token
 */
export function generateFileToken(file) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

/**
 * Checks if a file has already been processed recently
 * @param {File} file - File to check
 * @returns {boolean} True if duplicate submission detected
 */
export function checkDuplicateSubmission(file) {
  const token = generateFileToken(file);
  if (processedFiles.has(token)) {
    return true; // Duplicate detected
  }
  processedFiles.add(token);
  
  // Cleanup old tokens after 1 hour to prevent memory leaks
  setTimeout(() => {
    processedFiles.delete(token);
  }, 3600000);
  
  return false;
}