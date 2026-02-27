# Requirements Document

## Introduction

This feature implements a secure file download endpoint for assignment attachments. Currently, students cannot download assignment files because the backend lacks the `/api/assignments/download/:filename` endpoint that the frontend calls. This feature will enable authorized users to download assignment attachment files with proper permission checks and error handling.

## Glossary

- **Download_Endpoint**: The HTTP endpoint `/api/assignments/download/:filename` that serves assignment attachment files
- **Assignment**: A task or homework created by a teacher, stored in the Assignment model with attachments field
- **Attachment**: A file object in the Assignment model containing url and name properties
- **Upload_Directory**: The backend directory `backend/uploads/` where attachment files are stored
- **Authorized_User**: A user who is either enrolled in the class, or is a teacher/admin of the class containing the assignment
- **File_Service**: The backend service responsible for locating and serving files from the Upload_Directory
- **Permission_Checker**: The backend component that verifies user authorization to access assignment files
- **Response_Handler**: The component that formats HTTP responses with appropriate headers for file downloads

## Requirements

### Requirement 1: File Download Endpoint

**User Story:** As a student, I want to download assignment attachment files, so that I can access the materials provided by my teacher.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/assignments/download/:filename`, THE Download_Endpoint SHALL locate the file in the Upload_Directory
2. WHEN the file is found, THE Download_Endpoint SHALL return the file with Content-Disposition header set to attachment
3. WHEN the file is found, THE Download_Endpoint SHALL return the file with appropriate Content-Type header based on file extension
4. THE Download_Endpoint SHALL support filenames containing special characters and spaces

### Requirement 2: Permission Verification

**User Story:** As a system administrator, I want to ensure only authorized users can download assignment files, so that file access is properly controlled.

#### Acceptance Criteria

1. WHEN a download request is received, THE Permission_Checker SHALL verify the requesting user is authenticated
2. WHEN a download request is received, THE Permission_Checker SHALL identify which assignment contains the requested filename
3. WHEN the assignment is identified, THE Permission_Checker SHALL verify the user is enrolled in the class OR is a teacher of the class OR is an admin
4. IF the user is not authenticated, THEN THE Download_Endpoint SHALL return HTTP 401 Unauthorized
5. IF the user lacks permission to access the assignment, THEN THE Download_Endpoint SHALL return HTTP 403 Forbidden

### Requirement 3: File Not Found Handling

**User Story:** As a developer, I want clear error responses when files don't exist, so that I can debug issues and provide helpful feedback to users.

#### Acceptance Criteria

1. WHEN the requested filename does not exist in the Upload_Directory, THE Download_Endpoint SHALL return HTTP 404 Not Found
2. WHEN the requested filename is not associated with any assignment, THE Download_Endpoint SHALL return HTTP 404 Not Found
3. WHEN a 404 error occurs, THE Response_Handler SHALL return a JSON response with an error message describing the issue

### Requirement 4: File Path Resolution

**User Story:** As a backend developer, I want the system to correctly resolve file paths, so that files stored with different path formats can be located.

#### Acceptance Criteria

1. WHEN an attachment url contains the prefix `/uploads/files/`, THE File_Service SHALL resolve the full path by combining Upload_Directory with the filename
2. WHEN an attachment url is just a filename, THE File_Service SHALL resolve the full path by combining Upload_Directory with `files/` subdirectory and the filename
3. THE File_Service SHALL normalize file paths to prevent directory traversal attacks
4. IF a filename contains path traversal sequences like `../`, THEN THE File_Service SHALL reject the request with HTTP 400 Bad Request

### Requirement 5: Response Headers

**User Story:** As a frontend developer, I want proper HTTP headers on file responses, so that browsers correctly handle file downloads.

#### Acceptance Criteria

1. WHEN serving a file, THE Response_Handler SHALL set Content-Disposition header to `attachment; filename="[original_filename]"`
2. WHEN serving a file, THE Response_Handler SHALL set Content-Length header to the file size in bytes
3. WHEN serving a file, THE Response_Handler SHALL set Content-Type header based on the file's MIME type
4. WHEN the MIME type cannot be determined, THE Response_Handler SHALL default to `application/octet-stream`

### Requirement 6: Error Response Format

**User Story:** As a frontend developer, I want consistent error response formats, so that I can handle errors uniformly in the UI.

#### Acceptance Criteria

1. WHEN an error occurs, THE Response_Handler SHALL return a JSON object with an `error` field containing the error message
2. WHEN an error occurs, THE Response_Handler SHALL return the appropriate HTTP status code matching the error type
3. THE Response_Handler SHALL log error details for debugging while returning user-friendly messages to clients

### Requirement 7: Assignment-File Association

**User Story:** As a system administrator, I want to ensure downloaded files are actually associated with assignments, so that arbitrary file access is prevented.

#### Acceptance Criteria

1. WHEN a filename is requested, THE File_Service SHALL query the Assignment model to find assignments where attachments array contains an object with matching name field
2. IF no assignment contains the requested filename, THEN THE Download_Endpoint SHALL return HTTP 404 Not Found with message "File not associated with any assignment"
3. THE File_Service SHALL use the first matching assignment for permission checking when multiple assignments share the same filename
