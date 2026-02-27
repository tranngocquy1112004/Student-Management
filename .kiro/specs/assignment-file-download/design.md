# Design Document: Assignment File Download

## Overview

This feature implements a secure file download endpoint for assignment attachments. The endpoint `/api/assignments/download/:filename` will serve files from the backend uploads directory with proper authentication, authorization, and error handling.

The design follows the existing Express.js architecture patterns in the codebase, reusing authentication middleware and permission checking utilities. The implementation prioritizes security by validating user permissions against assignment-class relationships and preventing directory traversal attacks.

### Key Design Decisions

1. **Reuse existing `canAccessClass` helper**: The assignment controller already has a robust permission checker that handles admin, teacher, and student access patterns. We'll reuse this to maintain consistency.

2. **File path normalization**: Use Node.js `path.normalize()` and validation to prevent directory traversal attacks before serving files.

3. **Assignment-file association validation**: Query the Assignment model to ensure the requested file is actually associated with an assignment before checking permissions.

4. **MIME type detection**: Use the `mime-types` package (already in dependencies) to set appropriate Content-Type headers based on file extensions.

## Architecture

### Component Overview

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ GET /api/assignments/download/:filename
       │ Authorization: Bearer <token>
       ▼
┌─────────────────────────────────────┐
│  Express Router                     │
│  (assignmentRoutes.js)              │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Auth Middleware (protect)          │
│  - Validates JWT token              │
│  - Attaches user to req.user        │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Download Controller                │
│  - Find assignment by filename      │
│  - Check user permissions           │
│  - Validate file path               │
│  - Serve file with headers          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  File System                        │
│  backend/uploads/files/             │
└─────────────────────────────────────┘
```

### Request Flow

1. Client sends GET request with JWT token in Authorization header
2. `protect` middleware validates authentication
3. Controller extracts filename from URL parameter
4. Controller queries Assignment model to find assignment containing the file
5. Controller validates user has access to the assignment's class
6. Controller validates and normalizes file path
7. Controller checks file exists on disk
8. Controller sends file with appropriate headers

## Components and Interfaces

### Route Definition

**Location**: `backend/src/routes/assignmentRoutes.js`

```javascript
router.get('/assignments/download/:filename', assignmentController.downloadAttachment);
```

The route is placed in the existing assignment routes file and uses the existing `protect` middleware applied to all routes via `router.use(protect)`.

### Controller Function

**Location**: `backend/src/controllers/assignmentController.js`

**Function Signature**:
```javascript
export const downloadAttachment = async (req, res) => { ... }
```

**Input**:
- `req.params.filename`: The filename to download (string)
- `req.user`: Authenticated user object (from protect middleware)

**Output**:
- Success: File stream with headers (200 OK)
- Errors: JSON response with error message and appropriate status code

**Algorithm**:
```
1. Extract and validate filename parameter
2. Check for directory traversal patterns (../, ..\)
3. Query Assignment model for assignment containing filename in attachments
4. If no assignment found, return 404
5. Extract classId from assignment
6. Call canAccessClass(req.user, classId)
7. If not authorized, return 403
8. Resolve full file path using path.join()
9. Normalize path to prevent traversal
10. Check if file exists using fs.existsSync()
11. If file doesn't exist, return 404
12. Determine MIME type from file extension
13. Set response headers (Content-Type, Content-Disposition, Content-Length)
14. Stream file to response using res.sendFile()
```

### Helper Functions

**canAccessClass** (existing):
- Already implemented in assignmentController.js
- Checks if user can access a class based on role and enrollment
- Returns boolean

**Path Resolution Logic**:
```javascript
// Handle both formats:
// 1. "/uploads/files/123456-file.pdf" -> extract "123456-file.pdf"
// 2. "123456-file.pdf" -> use as-is

const extractFilename = (url) => {
  if (url.startsWith('/uploads/files/')) {
    return url.replace('/uploads/files/', '');
  }
  return url;
};
```

## Data Models

### Assignment Model (existing)

```javascript
{
  classId: ObjectId,           // Reference to Class
  title: String,
  description: String,
  deadline: Date,
  maxScore: Number,
  type: String,                // 'individual' | 'group'
  mode: String,                // 'file' | 'quiz'
  status: String,              // 'draft' | 'published' | 'closed'
  attachments: [{              // Array of attachment objects
    url: String,               // e.g., "/uploads/files/123-file.pdf"
    name: String               // Original filename
  }],
  isDeleted: Boolean,
  // ... other fields
}
```

### Class Model (existing)

```javascript
{
  _id: ObjectId,
  name: String,
  teacherId: ObjectId,         // Reference to User
  // ... other fields
}
```

### Enrollment Model (existing)

```javascript
{
  classId: ObjectId,           // Reference to Class
  studentId: ObjectId,         // Reference to User
  // ... other fields
}
```

### User Model (existing)

```javascript
{
  _id: ObjectId,
  role: String,                // 'admin' | 'teacher' | 'student'
  // ... other fields
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: File Location

*For any* valid filename that exists in the Upload_Directory and is associated with an assignment, when a GET request is made to `/api/assignments/download/:filename`, the system should successfully locate and serve the file.

**Validates: Requirements 1.1**

### Property 2: Content-Disposition Header

*For any* file download response, the Content-Disposition header should be set to `attachment; filename="[original_filename]"` where original_filename matches the name field from the assignment's attachments array.

**Validates: Requirements 1.2, 5.1**

### Property 3: Content-Type Header

*For any* file download response, the Content-Type header should be set based on the file's extension, matching the appropriate MIME type for that extension.

**Validates: Requirements 1.3, 5.3**

### Property 4: Special Characters in Filenames

*For any* filename containing special characters (spaces, unicode, punctuation), the download endpoint should successfully serve the file without corruption or errors.

**Validates: Requirements 1.4**

### Property 5: Authentication Requirement

*For any* download request without a valid JWT token, the system should return HTTP 401 Unauthorized with a JSON error response.

**Validates: Requirements 2.1, 2.4**

### Property 6: Assignment Lookup

*For any* requested filename, the system should query the Assignment model and correctly identify the assignment whose attachments array contains an object with a matching name field.

**Validates: Requirements 2.2, 7.1**

### Property 7: Authorization Rules

*For any* authenticated user and assignment, the system should grant access if and only if the user is an admin, OR the user is the teacher of the assignment's class, OR the user is enrolled in the assignment's class.

**Validates: Requirements 2.3**

### Property 8: Unauthorized Access Rejection

*For any* authenticated user who lacks permission to access an assignment's class, the download request should return HTTP 403 Forbidden with a JSON error response.

**Validates: Requirements 2.5**

### Property 9: File Not Found Responses

*For any* filename that either does not exist in the Upload_Directory or is not associated with any assignment, the system should return HTTP 404 Not Found with a JSON response containing an error field describing the issue.

**Validates: Requirements 3.1, 3.2, 3.3, 7.2**

### Property 10: Path Resolution with Prefix

*For any* attachment URL containing the prefix `/uploads/files/`, the system should extract the filename portion and resolve the full path by combining the Upload_Directory with the extracted filename.

**Validates: Requirements 4.1**

### Property 11: Path Resolution without Prefix

*For any* attachment URL that is just a filename (no path prefix), the system should resolve the full path by combining Upload_Directory with the `files/` subdirectory and the filename.

**Validates: Requirements 4.2**

### Property 12: Path Normalization

*For any* file path constructed from user input, the normalized path should always remain within the Upload_Directory and never escape to parent directories.

**Validates: Requirements 4.3**

### Property 13: Directory Traversal Rejection

*For any* filename containing path traversal sequences (such as `../`, `..\\`, or encoded variants), the system should reject the request with HTTP 400 Bad Request before attempting file access.

**Validates: Requirements 4.4**

### Property 14: Content-Length Header

*For any* file download response, the Content-Length header should be set to the exact size of the file in bytes.

**Validates: Requirements 5.2**

### Property 15: Error Response Format

*For any* error condition (4xx or 5xx status), the response should be a JSON object with an `error` field containing a descriptive message, and the HTTP status code should match the error type (401 for auth, 403 for forbidden, 404 for not found, 400 for bad request, 500 for server errors).

**Validates: Requirements 6.1, 6.2**

## Error Handling

### Error Categories

1. **Authentication Errors (401)**
   - Missing JWT token
   - Invalid JWT token
   - Expired JWT token
   - User account deleted or locked

2. **Authorization Errors (403)**
   - User not enrolled in class
   - User not teacher of class
   - User not admin

3. **Not Found Errors (404)**
   - File does not exist on disk
   - Filename not associated with any assignment
   - Assignment deleted

4. **Bad Request Errors (400)**
   - Directory traversal attempt detected
   - Invalid filename format

5. **Server Errors (500)**
   - Database query failure
   - File system read error
   - Unexpected exceptions

### Error Response Format

All errors return JSON with consistent structure:

```javascript
{
  success: false,
  error: "Human-readable error message"
}
```

### Error Logging

- All errors are logged to console with stack traces for debugging
- User-facing error messages are sanitized to avoid exposing system internals
- File paths are never included in error responses to prevent information disclosure

### Error Recovery

- Database connection errors: Return 500, allow retry
- File system errors: Return 404 or 500 depending on cause
- No automatic retry logic (client responsibility)

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of successful downloads
- Edge cases (empty filenames, very long filenames)
- Integration with authentication middleware
- Specific error scenarios (deleted assignments, locked users)
- Example case: downloading a file when multiple assignments share the same filename (verify first match is used)

**Property-Based Tests** focus on:
- Universal properties that hold across all inputs
- Randomized testing of filenames, user roles, and permission combinations
- Comprehensive input coverage through generation

### Property-Based Testing Configuration

**Library**: Use `fast-check` for JavaScript property-based testing

**Configuration**:
- Minimum 100 iterations per property test
- Each test references its design document property
- Tag format: `Feature: assignment-file-download, Property {number}: {property_text}`

### Test Implementation Mapping

Each correctness property maps to a property-based test:

1. **Property 1 (File Location)**: Generate random valid filenames, create files and assignments, verify successful download
2. **Property 2 (Content-Disposition)**: Generate random files, verify header format and original filename preservation
3. **Property 3 (Content-Type)**: Generate files with various extensions, verify MIME type mapping
4. **Property 4 (Special Characters)**: Generate filenames with unicode, spaces, punctuation, verify successful download
5. **Property 5 (Authentication)**: Generate requests without tokens, verify 401 response
6. **Property 6 (Assignment Lookup)**: Generate assignments with attachments, verify correct assignment is found
7. **Property 7 (Authorization)**: Generate user-assignment combinations, verify access granted/denied correctly
8. **Property 8 (Unauthorized Rejection)**: Generate unauthorized user-assignment pairs, verify 403 response
9. **Property 9 (Not Found)**: Generate non-existent filenames, verify 404 with JSON error
10. **Property 10 (Path with Prefix)**: Generate URLs with `/uploads/files/` prefix, verify correct path resolution
11. **Property 11 (Path without Prefix)**: Generate plain filenames, verify correct path resolution
12. **Property 12 (Path Normalization)**: Generate various paths, verify normalized path stays in upload directory
13. **Property 13 (Traversal Rejection)**: Generate filenames with `../` sequences, verify 400 rejection
14. **Property 14 (Content-Length)**: Generate files of various sizes, verify header matches file size
15. **Property 15 (Error Format)**: Trigger various errors, verify JSON format and status codes

### Unit Test Examples

```javascript
describe('downloadAttachment', () => {
  it('should download file when user is enrolled in class', async () => {
    // Create assignment with attachment
    // Create enrolled student
    // Make download request
    // Verify file is served
  });

  it('should use first assignment when multiple assignments have same filename', async () => {
    // Create two assignments with same filename
    // Make download request
    // Verify permission check uses first assignment
  });

  it('should handle files with no extension using default MIME type', async () => {
    // Create file with no extension
    // Make download request
    // Verify Content-Type is application/octet-stream
  });
});
```

### Integration Testing

- Test with real file system operations (not mocked)
- Test with real database queries (use test database)
- Test authentication flow end-to-end
- Test with actual JWT tokens

### Security Testing

- Attempt directory traversal with various encodings (`../`, `..%2F`, `..%5C`)
- Test with very long filenames (buffer overflow attempts)
- Test with null bytes in filenames
- Test with symbolic links (if applicable)
- Verify no information leakage in error messages

### Performance Considerations

- File streaming should handle large files efficiently (no loading entire file into memory)
- Database queries should use indexes on classId and attachments fields
- Response time should be acceptable for files up to 20MB (current upload limit)

## Implementation Notes

### Dependencies

- `express`: Web framework (already installed)
- `mongoose`: MongoDB ODM (already installed)
- `mime-types`: MIME type detection (already installed)
- `path`: Node.js path utilities (built-in)
- `fs`: Node.js file system (built-in)

### File Streaming

Use `res.sendFile()` instead of `res.download()` to have more control over headers:

```javascript
res.sendFile(fullPath, {
  headers: {
    'Content-Type': mimeType,
    'Content-Disposition': `attachment; filename="${originalName}"`,
  }
}, (err) => {
  if (err) {
    // Handle streaming errors
  }
});
```

### Security Considerations

1. **Path Traversal Prevention**:
   - Validate filename doesn't contain `..`
   - Use `path.normalize()` and verify result stays in upload directory
   - Use `path.basename()` to extract just the filename

2. **Information Disclosure Prevention**:
   - Don't reveal file system paths in errors
   - Don't reveal whether file exists vs. no permission
   - Use generic error messages for security-related failures

3. **Access Control**:
   - Always check authentication first
   - Then check assignment association
   - Finally check class access permissions
   - Fail closed (deny by default)

### Monitoring and Logging

- Log all download attempts with user ID and filename
- Log all permission denials for security auditing
- Log file not found errors for debugging
- Use structured logging for easy parsing

### Future Enhancements

- Add download rate limiting per user
- Add download analytics (track popular files)
- Add support for range requests (partial downloads)
- Add file preview capability for certain types
- Add virus scanning for uploaded files
- Add download expiration for sensitive files
