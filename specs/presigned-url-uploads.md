# Feature: Presigned URL-Based Uploads (Hybrid Approach)

## Problem Statement

Currently, all file uploads (profile images, band images, post media) go through the API worker. This approach has several limitations:

**Performance Issues:**
- Large files (videos, high-res images) increase API worker execution time
- Worker CPU time counts against Cloudflare Workers limits
- Bandwidth consumed by API worker (data transferred twice: client → worker → R2)
- Slower upload experience for users on slow connections

**Scalability Concerns:**
- API worker becomes bottleneck for high-volume uploads
- Worker memory limits (128MB) constrain max file size
- Concurrent uploads can saturate worker capacity

**Cost Implications:**
- API worker CPU time is billed
- Data egress from worker to R2 is billed
- Inefficient use of worker resources

**The Solution:**
Implement presigned URL-based uploads where clients upload directly to R2, bypassing the API worker for file transfer. Maintain a hybrid approach to preserve backward compatibility and support simple use cases.

**Who has this problem?**
- All users uploading profile images
- Band admins uploading band profile images
- Users creating posts with images/videos

## Success Criteria

**For Users:**
- Faster uploads (direct to R2, no API middleman)
- Progress indicators for large file uploads
- Clear error messages on validation failures
- Seamless experience (no noticeable change from current flow)

**For System:**
- API worker CPU time reduced by 80%+ for uploads
- Support 10MB images, 100MB videos without worker constraints
- Temp files automatically cleaned up after 24 hours
- Failed uploads don't leave orphaned files in R2
- Maintain security: only authenticated users can upload, validate file types/sizes

**Metrics:**
- Upload success rate: > 95%
- P95 upload time for 5MB image: < 10 seconds (was ~15s through API)
- P95 upload time for 50MB video: < 60 seconds (was timing out)
- Orphaned files in temp/: < 1% of total uploads
- API worker CPU time for uploads: < 100ms (down from 500-2000ms)

## User Stories

### Profile Image Upload
- As a user, I want to upload my profile image quickly so that I can complete my profile
- As a user, I want to see upload progress so that I know it's working
- As a user, I want clear errors if my image is too large or wrong format so that I can fix it
- As a user, I want my uploaded image to appear immediately so that I can see the result

### Band Image Upload
- As a band admin, I want to upload my band's profile image quickly so that our page looks professional
- As a band admin, I want the same reliable upload experience as my personal profile

### Post Media Upload
- As a user, I want to attach multiple images to my post so that I can share my music
- As a user, I want to upload videos of performances without timeouts so that I can showcase my skills
- As a user, I want to see upload progress for each file so that I know which ones are done

## Scope

### In Scope (MVP)

**Presigned URL Flow:**
- Client requests presigned URL from API with metadata (file type, size, upload type)
- API validates request, generates unique R2 key, returns presigned URL
- Client uploads directly to R2 via presigned URL
- Client calls confirm endpoint to validate and move file from temp to permanent location
- API updates database with final R2 key

**Upload Types:**
- Profile image upload (single file)
- Band profile image upload (single file)
- Post media upload (multiple files, up to 5 per post)

**File Validation:**
- Client-side: File type, size, count
- Server-side: Validate metadata before presigned URL generation
- Server-side: Validate uploaded file in temp/ before confirmation

**Security:**
- Authentication required for all upload operations
- Authorization checks (user owns profile, user is band admin)
- Presigned URLs expire after 15 minutes
- Unique keys prevent collisions and overwrites
- Rate limiting on presigned URL generation

**R2 Structure:**
- `temp/` folder: Uploaded files await confirmation (24-hour lifecycle)
- `profile-images/` folder: User profile images
- `band-images/` folder: Band profile images
- `post-media/` folder: Post images and videos
- Key naming: `{folder}/{userId or bandId}/{timestamp}-{uuid}.{ext}`

**Error Handling:**
- Presigned URL expires → Client shows error, allows retry
- Upload fails → Client shows error, allows retry
- Validation fails on confirm → Client shows specific error (file too large, wrong type)
- Network timeout → Client retries

### Out of Scope (Future)

**Phase 2 - Advanced Features:**
- Resumable uploads for large videos (tus protocol)
- Image optimization (resize, compress, WebP conversion)
- AI content moderation before confirmation
- Multi-part uploads for files > 100MB

**Phase 3 - Performance:**
- Client-side image compression before upload
- Cloudflare Images integration for automatic variants
- Video transcoding (convert to web-optimized formats)

**Phase 4 - User Experience:**
- Drag-and-drop upload
- Paste from clipboard
- Crop/rotate before upload

## User Flow

### Flow 1: Profile Image Upload (Presigned URL)

1. User navigates to profile page and clicks "Edit Profile"
2. Clicks on profile image section to upload new image
3. File picker opens, user selects image (e.g., `photo.jpg`, 3MB)
4. **Client-side validation:**
   - Check file type: image/jpeg, image/png, image/webp only
   - Check file size: max 10MB
   - On failure: Show error toast, stop flow
5. **Request presigned URL:**
   - Client calls `POST /api/uploads/presigned-url`
   - Request body:
     ```json
     {
       "uploadType": "profile-image",
       "fileName": "photo.jpg",
       "fileSize": 3145728,
       "contentType": "image/jpeg"
     }
     ```
6. **Backend generates presigned URL:**
   - Validates user is authenticated
   - Validates file size (max 10MB for images)
   - Validates content type (image/* only)
   - Generates unique key: `temp/{userId}/{timestamp}-{uuid}.jpg`
   - Creates presigned URL with 15-minute expiration
   - Returns presigned URL, upload ID, and key
7. **Client uploads to R2:**
   - Uses presigned URL to PUT file directly to R2
   - Shows progress bar (0% → 100%)
   - On error: Show error toast, allow retry (regenerate presigned URL)
8. **Client confirms upload:**
   - Calls `POST /api/uploads/confirm`
   - Request body:
     ```json
     {
       "uploadId": "upload_abc123",
       "key": "temp/{userId}/{timestamp}-{uuid}.jpg"
     }
     ```
9. **Backend validates and moves file:**
   - Checks if file exists in temp/
   - Validates file size matches original metadata (prevent tampering)
   - Validates content type by reading file headers
   - Moves file from `temp/{userId}/...` to `profile-images/{userId}/{timestamp}-{uuid}.jpg`
   - Updates `users.image` column with new key
   - Deletes old profile image from R2 (if exists)
   - Returns success with new image URL
10. **Client updates UI:**
    - Shows new profile image immediately (optimistic update)
    - On error: Revert to old image, show error toast

### Flow 2: Band Image Upload (Presigned URL)

Same as Flow 1, but:
- `uploadType: "band-image"`
- Backend checks user is band admin
- Key structure: `band-images/{bandId}/{timestamp}-{uuid}.jpg`
- Updates `bands.profile_image_url` column

### Flow 3: Post Media Upload (Presigned URL, Multiple Files)

1. User creates post, clicks "Add media" button
2. File picker opens, user selects 3 files: 2 images (2MB, 4MB) and 1 video (50MB)
3. **Client-side validation (per file):**
   - Check count: max 5 files per post
   - Check file types: images (jpeg, png, webp) or videos (mp4, mov, webm)
   - Check file sizes: max 10MB per image, 100MB per video
   - On failure: Show error for specific file, allow removal
4. **Request presigned URLs (parallel):**
   - Client calls `POST /api/uploads/presigned-url` 3 times in parallel
   - Each request includes `uploadType: "post-media"`, file metadata
5. **Backend generates presigned URLs:**
   - Same validation as profile image flow
   - Generates unique keys: `temp/{userId}/{timestamp}-{uuid}-{index}.{ext}`
   - Returns presigned URLs, upload IDs, keys
6. **Client uploads to R2 (parallel):**
   - Uploads all 3 files simultaneously
   - Shows individual progress bars for each file
   - On error for one file: Show error, allow retry for that file only
7. **Client confirms uploads (after all complete):**
   - Calls `POST /api/uploads/confirm-batch`
   - Request body:
     ```json
     {
       "uploads": [
         { "uploadId": "upload_1", "key": "temp/{userId}/..." },
         { "uploadId": "upload_2", "key": "temp/{userId}/..." },
         { "uploadId": "upload_3", "key": "temp/{userId}/..." }
       ]
     }
     ```
8. **Backend validates and moves files:**
   - Validates all files exist in temp/
   - Validates file sizes and content types
   - Moves files from `temp/` to `post-media/{postId}/{timestamp}-{uuid}.{ext}`
   - Note: Post doesn't exist yet, so use temp postId or userId folder until post is created
   - Returns success with new media keys
9. **Client creates post:**
   - Includes media keys in `POST /api/posts` request
   - Backend creates post and media records in database
10. **Client updates UI:**
    - Shows new post with media immediately

### Flow 4: Upload Expiration (Presigned URL Timeout)

1. User requests presigned URL
2. User starts upload but network is slow
3. 15 minutes elapse, presigned URL expires
4. Upload fails with 403 Forbidden from R2
5. Client detects expiration error
6. Client shows error toast: "Upload took too long. Please try again."
7. Client allows retry (regenerates presigned URL, starts upload again)

### Flow 5: Confirm Validation Failure

1. User uploads file successfully to temp/
2. User calls confirm endpoint
3. Backend reads file from R2
4. Backend detects:
   - File size is larger than declared (user modified metadata)
   - File type is wrong (user renamed .exe to .jpg)
5. Backend rejects confirmation:
   - Returns 400 error: "File validation failed: File size mismatch" or "Invalid file type"
   - Leaves file in temp/ (will be cleaned up by lifecycle rule)
6. Client shows error toast with specific message
7. User must re-upload with correct file

### Flow 6: Orphaned File Cleanup

1. User requests presigned URL
2. User uploads file to temp/
3. User closes browser before calling confirm endpoint
4. File remains in temp/ folder
5. After 24 hours, R2 lifecycle rule automatically deletes file from temp/
6. No manual cleanup needed

## UI Requirements

### Components Needed

**PresignedUploadComponent** (Generic Upload Component)
- Wrapper component for presigned URL upload flow
- Props:
  - `uploadType`: 'profile-image' | 'band-image' | 'post-media'
  - `maxFiles`: number (default 1)
  - `maxFileSize`: number (bytes)
  - `acceptedFileTypes`: string[] (MIME types)
  - `onUploadComplete`: (keys: string[]) => void
  - `onUploadError`: (error: Error) => void
- Handles:
  - File selection
  - Client-side validation
  - Presigned URL request
  - R2 upload with progress
  - Confirm request
  - Error handling
- Shows:
  - File picker button
  - Upload progress bars
  - Error messages
  - Success state

**ProfileImageUpload** (Profile Image Specific)
- Uses PresignedUploadComponent
- Props:
  - `userId`: string
  - `currentImageUrl`: string | null
- Shows:
  - Current profile image preview
  - "Change Photo" button
  - Upload progress overlay
  - Image preview after upload
- On complete:
  - Updates user profile in React Query cache
  - Shows success toast

**BandImageUpload** (Band Image Specific)
- Uses PresignedUploadComponent
- Props:
  - `bandId`: number
  - `currentImageUrl`: string | null
  - `isAdmin`: boolean
- Authorization:
  - Only visible to band admins
  - Shows error if non-admin tries to upload
- On complete:
  - Updates band profile in React Query cache
  - Shows success toast

**PostMediaUpload** (Post Media Specific)
- Uses PresignedUploadComponent
- Props:
  - `onMediaKeysChange`: (keys: string[]) => void
  - `maxFiles`: 5
- Shows:
  - Grid of uploaded media with thumbnails
  - "Add Media" button (up to 5 files)
  - Individual progress bars for each file
  - Remove button per file
- On complete:
  - Passes media keys to parent PostComposer
  - Parent includes keys in post creation request

### States

**Upload Button States:**
- **Idle**: "Upload Image" / "Add Media" - clickable
- **Requesting**: "Preparing..." - disabled, spinner
- **Uploading**: Progress bar with percentage - disabled
- **Confirming**: "Processing..." - disabled, spinner
- **Success**: Checkmark icon + "Uploaded" - briefly shown, then idle
- **Error**: "Upload Failed - Retry" - clickable, red text

**File Validation States:**
- **Valid**: Green checkmark icon
- **Invalid**: Red X icon + error message below
  - "File too large (15MB). Max size: 10MB"
  - "Invalid file type. Use JPG, PNG, or WebP"
  - "Too many files (6). Max: 5"

**Upload Progress States:**
- **Queued**: File shown, no progress bar
- **Uploading**: Progress bar animating 0% → 100%
- **Confirming**: Progress bar at 100%, "Processing..."
- **Complete**: Green checkmark, brief animation
- **Failed**: Red X, error message, "Retry" button

**Image Preview States:**
- **No image**: Placeholder icon (user silhouette, band icon, etc.)
- **Current image**: Shows existing profile/band image
- **Uploading**: Existing image with loading overlay
- **New image**: Shows newly uploaded image immediately

### Interactions

**User clicks "Upload Image":**
- Opens file picker
- On file selection: Starts validation → presigned URL request → upload flow
- On cancel: No action

**User drags file onto upload area (future):**
- Highlights drop zone
- On drop: Starts validation → presigned URL request → upload flow

**Upload progress:**
- Shows percentage: "Uploading... 45%"
- Shows file size: "2.3 MB / 5.1 MB"
- Animated progress bar

**Upload error:**
- Shows error message toast
- "Retry" button appears on upload area
- On retry: Regenerates presigned URL, starts upload again

**Multiple files (post media):**
- Shows grid of files with individual progress bars
- User can remove files before upload completes
- "Add More" button disabled during upload

**Upload complete:**
- Brief success animation (checkmark)
- Image preview updates immediately
- Success toast: "Profile image updated" / "Media uploaded"

## API Requirements

### Endpoints

#### `POST /api/uploads/presigned-url`

**Purpose:** Generate presigned URL for direct R2 upload

**Auth:** Required (authenticated user)

**Request:**
```json
{
  "uploadType": "profile-image" | "band-image" | "post-media",
  "fileName": "photo.jpg",
  "fileSize": 3145728,
  "contentType": "image/jpeg",
  "bandId": 123  // Required if uploadType is "band-image"
}
```

**Validation:**
- `uploadType`: required, enum ('profile-image', 'band-image', 'post-media')
- `fileName`: required, string, max 255 chars, alphanumeric + dot + dash + underscore only
- `fileSize`: required, number, > 0
  - Max 10MB (10485760 bytes) for images
  - Max 100MB (104857600 bytes) for videos
- `contentType`: required, string, must match allowed MIME types
  - Images: image/jpeg, image/png, image/webp
  - Videos: video/mp4, video/quicktime, video/webm
- `bandId`: required if uploadType is 'band-image', must be valid band ID

**Authorization:**
- `profile-image`: User must be authenticated
- `band-image`: User must be band admin (check `bands_members.is_admin`)
- `post-media`: User must be authenticated

**Response (200 OK):**
```json
{
  "uploadId": "upload_abc123",
  "presignedUrl": "https://sound-connect-assets.r2.dev/temp/user_xyz/1705334400000-abc123.jpg?X-Amz-Signature=...",
  "key": "temp/user_xyz/1705334400000-abc123.jpg",
  "expiresAt": "2025-01-15T10:45:00Z"
}
```

**Errors:**
- `400 Bad Request`:
  - "Invalid upload type"
  - "File name is required"
  - "File size exceeds maximum (10MB for images, 100MB for videos)"
  - "Invalid content type. Images: JPG, PNG, WebP. Videos: MP4, MOV, WebM"
  - "Band ID is required for band image uploads"
  - "Invalid file name. Use only letters, numbers, dots, dashes, and underscores"
- `401 Unauthorized`: "Authentication required"
- `403 Forbidden`: "You must be a band admin to upload band images"
- `404 Not Found`: "Band not found"
- `429 Too Many Requests`: "Too many upload requests. Please try again later."
- `500 Internal Server Error`: "Failed to generate presigned URL"

**Side Effects:**
- Logs upload request (user ID, upload type, file size, timestamp) for monitoring
- Rate limiting: Max 20 presigned URL requests per user per minute

**Key Generation:**
- Format: `temp/{userId}/{timestamp}-{uuid}.{ext}`
- `userId`: Current authenticated user ID
- `timestamp`: Unix timestamp in milliseconds
- `uuid`: 8-char random alphanumeric (nanoid)
- `ext`: File extension from fileName (lowercase)
- Example: `temp/user_abc123/1705334400000-x7k2p9q4.jpg`

**Presigned URL Configuration:**
- Method: PUT
- Expiration: 15 minutes
- Headers required:
  - `Content-Type`: Must match contentType from request
  - `Content-Length`: Must match fileSize from request
- ACL: Private (not publicly readable until moved)

---

#### `POST /api/uploads/confirm`

**Purpose:** Validate uploaded file and move from temp/ to permanent location

**Auth:** Required (authenticated user)

**Request:**
```json
{
  "uploadId": "upload_abc123",
  "key": "temp/user_xyz/1705334400000-abc123.jpg",
  "uploadType": "profile-image",
  "bandId": 123  // Required if uploadType is "band-image"
}
```

**Validation:**
- `uploadId`: required, string, must match upload ID from presigned URL request
- `key`: required, string, must be valid temp/ key
- `uploadType`: required, enum ('profile-image', 'band-image', 'post-media')
- `bandId`: required if uploadType is 'band-image'

**Authorization:**
- `profile-image`: User must own profile (key contains user ID)
- `band-image`: User must be band admin
- `post-media`: User must be authenticated (key contains user ID)

**Response (200 OK):**
```json
{
  "key": "profile-images/user_xyz/1705334400000-abc123.jpg",
  "url": "https://pub-fe5ef299f3464b73b8c54144ff278eae.r2.dev/profile-images/user_xyz/1705334400000-abc123.jpg"
}
```

**Errors:**
- `400 Bad Request`:
  - "Upload ID is required"
  - "Invalid key format"
  - "File not found in temp folder"
  - "File size mismatch (expected: 3145728 bytes, actual: 4194304 bytes)"
  - "Invalid file type (expected: image/jpeg, actual: image/png)"
  - "Upload has expired (max age: 1 hour)"
  - "Upload type mismatch"
- `401 Unauthorized`: "Authentication required"
- `403 Forbidden`:
  - "You do not have permission to confirm this upload"
  - "You must be a band admin to upload band images"
- `404 Not Found`: "Upload not found or expired"
- `500 Internal Server Error`:
  - "Failed to validate file"
  - "Failed to move file"
  - "Failed to update database"

**Side Effects:**
- Validates file in temp/:
  - Reads file metadata from R2 (Content-Length, Content-Type)
  - Compares with original metadata from presigned URL request
  - Returns error if mismatch
- Moves file from temp/ to permanent location:
  - `profile-image`: `profile-images/{userId}/{timestamp}-{uuid}.{ext}`
  - `band-image`: `band-images/{bandId}/{timestamp}-{uuid}.{ext}`
  - `post-media`: `post-media/{userId}/{timestamp}-{uuid}.{ext}`
- Updates database:
  - `profile-image`: Updates `users.image` with new key
  - `band-image`: Updates `bands.profile_image_url` with new key
  - `post-media`: Returns key for post creation (not stored yet)
- Deletes old file from R2 (profile/band images only):
  - Reads old key from database
  - Deletes old file from R2
  - Ignores error if old file doesn't exist
- Deletes temp file from R2 (after successful move)
- Transaction: Database update + R2 move must both succeed or rollback

**Validation Details:**

**File Size Validation:**
- Reads `Content-Length` from R2 object metadata
- Compares with `fileSize` from original presigned URL request (stored in memory/cache with upload ID)
- If mismatch > 1% (allow small variance from compression): Reject

**Content Type Validation:**
- Reads `Content-Type` from R2 object metadata
- Compares with `contentType` from original presigned URL request
- If mismatch: Reject
- Additional check: Read first bytes of file (magic numbers) to verify true file type:
  - JPEG: FF D8 FF
  - PNG: 89 50 4E 47
  - WebP: 52 49 46 46
  - MP4: 00 00 00 xx 66 74 79 70
  - If magic number doesn't match Content-Type: Reject

**Upload Age Validation:**
- Presigned URL requests are cached with timestamp
- On confirm, check if upload request is < 1 hour old
- If older: Reject (prevents abuse of stale upload IDs)

---

#### `POST /api/uploads/confirm-batch`

**Purpose:** Validate and move multiple uploaded files (for post media)

**Auth:** Required (authenticated user)

**Request:**
```json
{
  "uploads": [
    {
      "uploadId": "upload_1",
      "key": "temp/user_xyz/1705334400000-abc123.jpg"
    },
    {
      "uploadId": "upload_2",
      "key": "temp/user_xyz/1705334400001-def456.jpg"
    },
    {
      "uploadId": "upload_3",
      "key": "temp/user_xyz/1705334400002-ghi789.mp4"
    }
  ],
  "uploadType": "post-media"
}
```

**Validation:**
- `uploads`: required, array, min 1, max 5 items
- Each upload item:
  - `uploadId`: required, string
  - `key`: required, string, must be valid temp/ key
- `uploadType`: required, currently only 'post-media' supported
- All keys must belong to current user (check user ID in key)

**Response (200 OK):**
```json
{
  "keys": [
    "post-media/user_xyz/1705334400000-abc123.jpg",
    "post-media/user_xyz/1705334400001-def456.jpg",
    "post-media/user_xyz/1705334400002-ghi789.mp4"
  ],
  "urls": [
    "https://pub-fe5ef299f3464b73b8c54144ff278eae.r2.dev/post-media/user_xyz/1705334400000-abc123.jpg",
    "https://pub-fe5ef299f3464b73b8c54144ff278eae.r2.dev/post-media/user_xyz/1705334400001-def456.jpg",
    "https://pub-fe5ef299f3464b73b8c54144ff278eae.r2.dev/post-media/user_xyz/1705334400002-ghi789.mp4"
  ]
}
```

**Errors:**
- `400 Bad Request`:
  - "Uploads array is required and must contain 1-5 items"
  - "Invalid upload ID or key in uploads[0]"
  - "File not found in temp folder: {key}"
  - "File validation failed for {key}: {reason}"
  - "Upload type must be 'post-media'"
- `401 Unauthorized`: "Authentication required"
- `403 Forbidden`: "You do not have permission to confirm these uploads"
- `500 Internal Server Error`: "Failed to confirm uploads"

**Side Effects:**
- Validates all files in parallel
- If any validation fails, entire batch fails (atomic operation)
- On success, moves all files from temp/ to `post-media/{userId}/`
- Deletes all temp files after successful move
- Returns array of permanent keys in same order as input

**Transaction Behavior:**
- All files must validate successfully
- All files must move successfully
- If any step fails, no files are moved (rollback)
- Temp files remain in temp/ for lifecycle cleanup

---

#### `DELETE /api/uploads/temp/:key` (Future)

**Purpose:** Cancel an upload and delete temp file

**Not implemented in MVP** - Rely on lifecycle rules for cleanup

## Database Changes

### New Table: `upload_sessions`

**Purpose:** Track presigned URL requests for validation on confirm

```sql
CREATE TABLE upload_sessions (
  id TEXT PRIMARY KEY,  -- upload_abc123
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  upload_type TEXT NOT NULL CHECK(upload_type IN ('profile-image', 'band-image', 'post-media')),
  band_id INTEGER REFERENCES bands(id) ON DELETE CASCADE,  -- NULL unless band-image
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  temp_key TEXT NOT NULL,  -- temp/user_xyz/1705334400000-abc123.jpg
  expires_at TEXT NOT NULL,  -- ISO 8601 timestamp
  created_at TEXT NOT NULL,
  confirmed_at TEXT,  -- NULL until confirmed

  -- Indexes
  INDEX idx_upload_sessions_user_id (user_id),
  INDEX idx_upload_sessions_expires_at (expires_at)
);
```

**Columns:**
- `id`: Upload ID (unique identifier, nanoid)
- `user_id`: User who initiated upload
- `upload_type`: Type of upload (enum)
- `band_id`: Band ID (only for band-image uploads)
- `file_name`: Original file name
- `file_size`: Expected file size in bytes
- `content_type`: Expected MIME type
- `temp_key`: Temporary R2 key
- `expires_at`: When presigned URL expires (15 minutes from creation)
- `created_at`: When upload session was created
- `confirmed_at`: When upload was confirmed (NULL until confirmed)

**Usage:**
- Created on `POST /api/uploads/presigned-url`
- Read on `POST /api/uploads/confirm` to validate file metadata
- Updated with `confirmed_at` timestamp on successful confirmation
- Deleted by periodic cleanup job (rows older than 24 hours)

**Indexes:**
- `(user_id)`: Look up user's recent uploads (for rate limiting)
- `(expires_at)`: Find expired sessions for cleanup

---

### Modified Tables

**`users` table:**
- Column `image`: Already exists, stores R2 key
- Updated on profile image upload confirmation
- Old key value used to delete old file from R2

**`bands` table:**
- Column `profile_image_url`: Already exists, stores R2 key
- Updated on band image upload confirmation
- Old key value used to delete old file from R2

**`media` table:**
- Column `key`: Already exists, stores R2 key
- Post media keys stored here on post creation (not on upload confirmation)
- No changes needed to table structure

---

### Cleanup Job

**Scheduled Worker:** `apps/uploads-cleanup-worker` (new)

**Schedule:** Runs every 6 hours via Cron Trigger

**Tasks:**
1. Delete expired upload sessions from database:
   - `DELETE FROM upload_sessions WHERE expires_at < NOW() - INTERVAL 24 hours`
2. No need to clean up R2 temp/ files (lifecycle rule handles this)

## R2 Configuration

### Bucket Structure

**Folder Organization:**
```
sound-connect-assets/
├── temp/                          # Temporary uploads (lifecycle: 24h)
│   ├── user_abc123/
│   │   ├── 1705334400000-x7k2p9q4.jpg
│   │   └── 1705334400001-y8m3r1t5.mp4
│   └── user_def456/
│       └── 1705334400002-z9n4s2u6.jpg
├── profile-images/                # User profile images
│   ├── user_abc123/
│   │   └── 1705334400000-x7k2p9q4.jpg
│   └── user_def456/
│       └── 1705334400002-z9n4s2u6.jpg
├── band-images/                   # Band profile images
│   ├── 1/
│   │   └── 1705334400000-a1b2c3d4.jpg
│   └── 2/
│       └── 1705334400001-e5f6g7h8.jpg
└── post-media/                    # Post images and videos
    ├── user_abc123/
    │   ├── 1705334400000-i9j0k1l2.jpg
    │   └── 1705334400001-m3n4o5p6.mp4
    └── user_def456/
        └── 1705334400002-q7r8s9t0.jpg
```

### Key Naming Conventions

**Temp Keys:**
- Format: `temp/{userId}/{timestamp}-{nanoid}.{ext}`
- Example: `temp/user_abc123/1705334400000-x7k2p9q4.jpg`
- User ID subfolder isolates uploads by user
- Timestamp ensures chronological ordering
- Nanoid (8 chars) prevents collisions
- Extension preserves file type

**Profile Image Keys:**
- Format: `profile-images/{userId}/{timestamp}-{nanoid}.{ext}`
- Example: `profile-images/user_abc123/1705334400000-x7k2p9q4.jpg`

**Band Image Keys:**
- Format: `band-images/{bandId}/{timestamp}-{nanoid}.{ext}`
- Example: `band-images/123/1705334400000-a1b2c3d4.jpg`

**Post Media Keys:**
- Format: `post-media/{userId}/{timestamp}-{nanoid}.{ext}`
- Example: `post-media/user_abc123/1705334400000-i9j0k1l2.jpg`
- Note: Not organized by postId because post doesn't exist at upload time

### Lifecycle Rules

**Rule 1: Clean up temp/ folder**
- **Target:** All objects in `temp/` prefix
- **Action:** Delete
- **Condition:** Object age > 24 hours (86400 seconds)
- **Purpose:** Automatically clean up orphaned uploads (user never called confirm)

**Configuration:**
```json
{
  "Rules": [
    {
      "Id": "DeleteTempUploadsAfter24Hours",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "temp/"
      },
      "Expiration": {
        "Days": 1
      }
    }
  ]
}
```

**No other lifecycle rules needed** - Permanent files stay forever (or until manually deleted)

### CORS Configuration

**Required for client-side uploads:**

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "http://localhost:3000",
        "https://sound-connect.com"
      ],
      "AllowedMethods": [
        "GET",
        "PUT"
      ],
      "AllowedHeaders": [
        "Content-Type",
        "Content-Length"
      ],
      "ExposeHeaders": [
        "ETag"
      ],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

**Notes:**
- AllowedOrigins must include all frontend domains (dev and prod)
- PUT method required for presigned URL uploads
- Content-Type and Content-Length headers required for validation
- ETag exposed for client-side verification (future)

## Edge Cases

### Upload Flow Edge Cases

1. **User requests presigned URL but never uploads**
   - Upload session created in database
   - No file in temp/ folder
   - After 15 minutes: Presigned URL expires
   - After 24 hours: Upload session deleted by cleanup job
   - No orphaned data

2. **User uploads file but never calls confirm**
   - File remains in temp/ folder
   - Upload session remains in database
   - After 24 hours: R2 lifecycle deletes temp file
   - After 24 hours: Cleanup job deletes upload session
   - No orphaned data

3. **User uploads file with wrong Content-Type header**
   - R2 stores file with provided Content-Type
   - On confirm: Backend reads Content-Type from R2
   - Backend also reads file magic numbers
   - If mismatch detected: Reject confirmation
   - Return error: "Invalid file type"
   - File remains in temp/ for lifecycle cleanup

4. **User uploads larger file than declared**
   - R2 accepts upload (presigned URL has max size limit)
   - On confirm: Backend reads Content-Length from R2
   - Compares with fileSize from upload session
   - If mismatch > 1%: Reject confirmation
   - Return error: "File size mismatch"
   - File remains in temp/ for lifecycle cleanup

5. **User uploads file, then immediately uploads another**
   - First upload: Profile image uploaded, confirmed
   - Database updated with new key
   - Old file deleted from R2
   - Second upload: Same flow
   - Previous "new" file is now "old" file, gets deleted
   - Only latest upload remains in R2 and database

6. **Network timeout during upload to R2**
   - Upload fails midway
   - Presigned URL still valid (15 minutes)
   - Client shows error: "Upload failed. Retrying..."
   - Client retries upload with same presigned URL
   - If retry fails or URL expired: Client requests new presigned URL

7. **Presigned URL expires during upload**
   - Upload starts before expiration
   - R2 returns 403 Forbidden during upload
   - Client detects 403 error
   - Client shows error: "Upload took too long. Please try again."
   - Client requests new presigned URL and retries

8. **User closes browser during upload**
   - Upload interrupted midway
   - Partial file may be in temp/ (depending on R2 behavior)
   - R2 may have partial object or no object
   - After 24 hours: Lifecycle deletes any partial file
   - No orphaned data

9. **User calls confirm before upload completes**
   - Backend checks if file exists in temp/
   - File not found: Return 404 "File not found in temp folder"
   - Client shows error, waits for upload to complete
   - Client retries confirm after upload finishes

10. **User tries to confirm someone else's upload**
    - Confirm request includes key: `temp/user_xyz/...`
    - Backend extracts user ID from key
    - Compares with authenticated user ID
    - If mismatch: Return 403 "You do not have permission"

11. **Upload session ID collision (unlikely)**
    - Two users generate same upload ID (nanoid collision)
    - Probability: ~1 in 200 trillion for 8-char nanoid
    - If collision: Database INSERT fails (primary key constraint)
    - Backend retries with new ID (exponential backoff, max 3 attempts)
    - If all retries fail: Return 500 error

12. **Band deleted while band admin is uploading image**
    - User requests presigned URL (band exists)
    - User uploads to R2
    - Band is deleted (foreign key cascade: upload session deleted)
    - User calls confirm
    - Backend looks up upload session: Not found
    - Return 404 "Upload not found or expired"
    - File remains in temp/ for lifecycle cleanup

### Database Edge Cases

13. **Confirm fails after file moved but before database update**
    - Transaction: Move file + Update database
    - If database update fails: File moved but database not updated
    - Mitigation: Use database transaction for both operations
    - If transaction fails: Rollback, file remains in temp/
    - User can retry confirm

14. **Old file deletion fails after new file uploaded**
    - New profile image uploaded and confirmed
    - Database updated with new key
    - Backend tries to delete old file from R2
    - Deletion fails (network error, R2 timeout)
    - Result: Old file remains in R2 (orphaned)
    - Acceptable for MVP: Minor cost, rare occurrence
    - Future: Periodic cleanup job to find and delete orphaned files

15. **Two admins upload band image simultaneously**
    - Admin A requests presigned URL, uploads file
    - Admin B requests presigned URL, uploads file
    - Admin A confirms upload (database updated)
    - Admin B confirms upload (database updated, overwrites A's key)
    - Admin A's file orphaned in R2
    - Acceptable for MVP: Rare, last-write-wins behavior
    - Future: Implement optimistic locking on bands table

### Security Edge Cases

16. **User tries to upload executable disguised as image**
    - User renames virus.exe to image.jpg
    - Client validates file type (checks extension): Passes (*.jpg)
    - User uploads to R2
    - Backend validates on confirm:
      - Reads Content-Type: image/jpeg
      - Reads magic numbers: 4D 5A (MZ, executable header)
      - Mismatch detected
    - Backend rejects: "Invalid file type"
    - File remains in temp/ for lifecycle cleanup

17. **User modifies file size in presigned URL request**
    - User declares fileSize: 1000 bytes
    - Backend generates presigned URL with Content-Length: 1000
    - User attempts to upload 10MB file
    - R2 rejects upload (Content-Length mismatch)
    - Upload fails with 400 error from R2

18. **User tampers with upload ID in confirm request**
    - User A uploads file, gets uploadId: upload_abc123
    - User B attempts to confirm with User A's uploadId
    - Backend looks up upload session in database
    - Checks user_id in session vs authenticated user
    - Mismatch: Return 403 "You do not have permission"

19. **User reuses expired presigned URL**
    - Presigned URL expires after 15 minutes
    - User attempts upload after expiration
    - R2 validates signature: Expired
    - R2 returns 403 Forbidden
    - Client shows error, requests new presigned URL

20. **Rate limit bypass attempt**
    - User creates multiple accounts to bypass rate limits
    - Each account limited to 20 presigned URLs per minute
    - Mitigation: Additional IP-based rate limiting via Cloudflare
    - Block IPs with > 100 presigned URL requests per minute

### Content Validation Edge Cases

21. **User uploads corrupt image**
    - File uploads successfully to temp/
    - Backend validates magic numbers: Valid JPEG header
    - Backend validates size and content type: Valid
    - File moves to permanent location
    - User tries to display image in browser: Fails to render
    - Acceptable for MVP: User's responsibility to upload valid files
    - Future: Use Cloudflare Images for validation and optimization

22. **User uploads very large video (500MB)**
    - File exceeds max size (100MB)
    - Client validates: Rejects before upload
    - If user bypasses client validation:
      - Backend rejects presigned URL request: "File size exceeds maximum"
    - If user modifies fileSize in request:
      - R2 rejects upload (Content-Length mismatch)

23. **User uploads image with EXIF data (location, etc.)**
    - Image uploads successfully
    - EXIF data preserved in file
    - Privacy concern: Location, device info exposed
    - Not handled in MVP
    - Future: Strip EXIF data during confirmation or use Cloudflare Images

## Validation Rules

### Client-Side Validation (Immediate Feedback)

**File Selection:**
- **File type:**
  - Profile/band images: image/jpeg, image/png, image/webp only
  - Post media images: image/jpeg, image/png, image/webp only
  - Post media videos: video/mp4, video/quicktime, video/webm only
  - Error: "Invalid file type. Use JPG, PNG, or WebP"
- **File size:**
  - Images: max 10MB (10485760 bytes)
  - Videos: max 100MB (104857600 bytes)
  - Error: "File too large (15MB). Max size: 10MB for images, 100MB for videos"
- **File count:**
  - Profile/band images: exactly 1
  - Post media: max 5 files
  - Error: "Too many files (6). Max: 5"

**File Name:**
- Allowed characters: a-z, A-Z, 0-9, dot, dash, underscore
- Max length: 255 chars
- Error: "Invalid file name. Use only letters, numbers, dots, dashes, and underscores"

**Real-time Validation:**
- Validate immediately on file selection
- Show error messages inline
- Disable upload button until validation passes

### Server-Side Validation (Security)

**Presigned URL Request (`POST /api/uploads/presigned-url`):**
- All client-side rules PLUS:
- Authentication: User must be logged in
- Authorization:
  - `profile-image`: Any authenticated user
  - `band-image`: User must be band admin (query `bands_members` table)
  - `post-media`: Any authenticated user
- Rate limiting: Max 20 requests per user per minute (Cloudflare rate limiting)
- Content-Type whitelist: Only allowed MIME types
- File size limits: Enforce max sizes per type

**Confirm Request (`POST /api/uploads/confirm`):**
- All presigned URL validation rules PLUS:
- File existence: File must exist in temp/ folder
- File size validation:
  - Read Content-Length from R2 object metadata
  - Compare with fileSize from upload session
  - Allow 1% variance (compression)
  - Reject if larger variance
- Content-Type validation:
  - Read Content-Type from R2 object metadata
  - Compare with contentType from upload session
  - Reject if mismatch
- Magic number validation:
  - Read first 16 bytes of file from R2
  - Check magic numbers for file type:
    - JPEG: FF D8 FF
    - PNG: 89 50 4E 47 0D 0A 1A 0A
    - WebP: 52 49 46 46 xx xx xx xx 57 45 42 50
    - MP4: 00 00 00 xx 66 74 79 70
  - Reject if magic number doesn't match Content-Type
- Upload age validation:
  - Check upload session created_at timestamp
  - Reject if > 1 hour old (prevents abuse of stale upload IDs)
- Authorization:
  - Extract user ID from temp key
  - Compare with authenticated user ID
  - For band images: Verify user is still band admin

## Error Handling

### User-Facing Errors

**Presigned URL Request Errors:**

| Scenario | Error Message | Action |
|----------|---------------|--------|
| File too large | "File too large (15MB). Max size: 10MB for images, 100MB for videos" | Reduce file size or choose different file |
| Invalid file type | "Invalid file type. Images: JPG, PNG, WebP. Videos: MP4, MOV, WebM" | Choose correct file type |
| Not band admin | "You must be a band admin to upload band images" | Contact band admin |
| Rate limited | "Too many upload requests. Please wait and try again." | Wait 1 minute |
| Network error | "Connection error. Please check your network and try again." | Retry button |
| Server error | "Something went wrong. Please try again later." | Retry button |

**R2 Upload Errors:**

| Scenario | Error Message | Action |
|----------|---------------|--------|
| Upload timeout | "Upload took too long. Please try again." | Request new presigned URL, retry upload |
| Network error | "Upload failed. Please check your connection and try again." | Retry button (reuse presigned URL if not expired) |
| Presigned URL expired | "Upload expired. Please try again." | Request new presigned URL, retry upload |
| R2 returns 403 | "Upload not authorized. Please try again." | Request new presigned URL, retry upload |
| R2 returns 500 | "Upload failed due to server error. Please try again later." | Retry after delay |

**Confirm Request Errors:**

| Scenario | Error Message | Action |
|----------|---------------|--------|
| File not found | "Upload not found. Please try uploading again." | Start upload flow from beginning |
| File size mismatch | "File validation failed. Please try uploading again." | Start upload flow from beginning |
| Invalid file type | "Invalid file type detected. Please upload JPG, PNG, or WebP images." | Choose correct file type, upload again |
| Upload expired | "Upload expired. Please try uploading again." | Start upload flow from beginning |
| Not authorized | "You do not have permission to complete this upload." | Contact support |
| Network error | "Connection error. Please try again." | Retry button |
| Server error | "Failed to process upload. Please try again later." | Retry button |

### Developer Errors (Log to Sentry, Alert)

**Critical Errors:**
- R2 presigned URL generation fails (R2 service down)
- R2 file move operation fails after database update (data inconsistency)
- Database transaction fails during confirm (file moved but DB not updated)
- Upload session ID collision after 3 retries (nanoid collision)

**Warning Errors:**
- Old file deletion fails (orphaned file in R2)
- Magic number validation fails (potential security issue)
- Cleanup job fails to delete expired sessions (database growing)

**Info Logs:**
- Presigned URL generated (user ID, upload type, file size)
- File uploaded successfully to temp/ (key, size, content type)
- File confirmed and moved to permanent location (old key, new key)
- Old file deleted from R2 (key)

## Performance Considerations

### Expected Load
- **Peak**: 5000 uploads per hour (viral growth scenario)
- **Typical**: 500-1000 uploads per hour
- **Upload types**: 70% profile/band images, 30% post media
- **Average file size**: Images 2-5MB, Videos 20-50MB

### API Performance

**Presigned URL generation:**
- Current bottleneck: Database INSERT for upload session
- Expected latency: 50-100ms
- Optimization: Use in-memory cache (Cloudflare KV) instead of database
  - Store upload session in KV with 1-hour TTL
  - Falls back to database on KV failure
  - Expected latency: 10-20ms

**Confirm validation:**
- Current bottleneck: R2 object metadata read + magic number validation
- Expected latency: 100-300ms
- Optimization: Read metadata and first 16 bytes in parallel
- Optimization: Cache file type validators (no need to fetch magic numbers every time)

**R2 Operations:**
- Presigned URL generation: ~5ms (Cloudflare Workers R2 API)
- R2 upload via presigned URL: Depends on file size and user connection
  - 5MB image on 10 Mbps upload: ~4 seconds
  - 50MB video on 10 Mbps upload: ~40 seconds
- R2 copy (move from temp/ to permanent): ~50-100ms
- R2 delete: ~20-50ms

### Upload Performance

**Direct-to-R2 upload benefits:**
- API worker CPU time: < 100ms (down from 500-2000ms)
- No worker memory constraints (upload doesn't go through worker)
- Faster uploads (no API middleman, R2 optimized for large files)

**Comparison (5MB image):**
- Through-API flow: 500ms (receive) + 1000ms (upload to R2) = 1500ms worker time
- Presigned URL flow: 50ms (generate URL) + 100ms (confirm) = 150ms worker time
- **90% reduction in worker CPU time**

**Comparison (50MB video):**
- Through-API flow: Timeout (worker max execution time: 30s on free, 60s on paid)
- Presigned URL flow: 50ms (generate URL) + 200ms (confirm) = 250ms worker time
- **Large files now possible**

### Database Performance

**Upload sessions table:**
- Expected rows: ~10,000 active sessions (most confirmed within minutes)
- Expired rows deleted every 6 hours by cleanup job
- Indexes on `user_id` and `expires_at` for fast lookups

**Query optimization:**
- Presigned URL request: INSERT (fast, indexed on primary key)
- Confirm request: SELECT + UPDATE (fast, indexed on primary key)
- Cleanup job: DELETE WHERE expires_at < X (fast, indexed on expires_at)

### R2 Performance

**Lifecycle rule execution:**
- R2 checks object age once per day (not real-time)
- Objects may remain in temp/ for 24-48 hours
- Acceptable for MVP (temp/ folder won't grow unbounded)

**CORS preflight caching:**
- MaxAgeSeconds: 3600 (1 hour)
- Reduces preflight requests by 95%+

### Caching Strategy

**Upload sessions (future optimization):**
- Store in Cloudflare KV instead of database
- TTL: 1 hour (matches presigned URL expiration)
- Benefits:
  - Faster presigned URL generation (KV read: 5ms vs DB query: 50ms)
  - Reduced database load
  - Automatic expiration (no cleanup job needed)
- Tradeoff:
  - KV eventual consistency (rare edge case: confirm before KV propagates)
  - Acceptable for MVP

**No caching needed for:**
- Presigned URLs (single-use, expire in 15 minutes)
- R2 object metadata (changes infrequently, read on-demand)

### Rate Limiting

**Presigned URL requests:**
- 20 per user per minute (prevents spam)
- Implemented via Cloudflare rate limiting (per user ID)
- Returns 429 with Retry-After header

**Confirm requests:**
- No rate limit (legitimate uploads only)
- Upload session validation prevents abuse

**Additional protection:**
- IP-based rate limiting: 100 presigned URLs per minute (prevents multi-account abuse)
- Implemented via Cloudflare rate limiting

## Testing Strategy

### Unit Tests

**Backend:**

**`presigned-url.test.ts`:**
- [ ] Generates valid presigned URL for profile image
- [ ] Generates valid presigned URL for band image
- [ ] Generates valid presigned URL for post media
- [ ] Returns 400 for invalid upload type
- [ ] Returns 400 for file size exceeding limit
- [ ] Returns 400 for invalid content type
- [ ] Returns 403 for non-admin uploading band image
- [ ] Returns 404 for non-existent band
- [ ] Creates upload session in database
- [ ] Generates unique upload ID (no collisions)
- [ ] Generates unique temp key (no collisions)
- [ ] Rate limits excessive requests (20 per minute)

**`confirm.test.ts`:**
- [ ] Confirms valid upload and moves file to permanent location
- [ ] Updates database with new image key
- [ ] Deletes old image from R2
- [ ] Returns 400 if file not found in temp/
- [ ] Returns 400 if file size mismatch
- [ ] Returns 400 if content type mismatch
- [ ] Returns 400 if magic number validation fails
- [ ] Returns 403 if user doesn't own upload
- [ ] Returns 404 if upload session not found
- [ ] Handles transaction rollback on database error
- [ ] Deletes temp file after successful confirm

**`confirm-batch.test.ts`:**
- [ ] Confirms multiple uploads atomically
- [ ] Returns array of permanent keys in correct order
- [ ] Returns 400 if any file validation fails (entire batch fails)
- [ ] Returns 403 if user doesn't own any upload in batch
- [ ] Handles partial upload (some files missing)

**Frontend:**

**`presigned-upload-component.test.tsx`:**
- [ ] Renders file picker button
- [ ] Opens file picker on button click
- [ ] Validates file type client-side
- [ ] Validates file size client-side
- [ ] Shows error for invalid file
- [ ] Requests presigned URL on valid file selection
- [ ] Uploads file to R2 using presigned URL
- [ ] Shows upload progress (0% → 100%)
- [ ] Calls confirm endpoint after upload completes
- [ ] Shows success state after confirmation
- [ ] Shows error state on upload failure
- [ ] Allows retry on error
- [ ] Handles presigned URL expiration
- [ ] Handles network timeout

### Integration Tests

**End-to-end upload flow:**
- [ ] User uploads profile image via presigned URL
  - Client validates file
  - Client requests presigned URL
  - Client uploads to R2
  - Client confirms upload
  - Database updated with new key
  - Old image deleted from R2
  - User sees new profile image
- [ ] Band admin uploads band image via presigned URL
  - Authorization check passes
  - Upload flow completes
  - Band profile shows new image
- [ ] User uploads multiple post media files
  - Client requests multiple presigned URLs
  - Client uploads all files to R2
  - Client confirms batch
  - Post creation includes media keys
  - Media appears in post

**Error scenarios:**
- [ ] Upload with invalid file type
  - Client rejects before upload
  - Error message shown
- [ ] Upload with file too large
  - Client rejects before upload
  - Error message shown
- [ ] Upload with expired presigned URL
  - R2 rejects upload
  - Client shows error, allows retry
- [ ] Confirm with tampered file size
  - Backend detects mismatch
  - Returns 400 error
  - File remains in temp/
- [ ] Confirm with wrong file type (magic number mismatch)
  - Backend detects mismatch
  - Returns 400 error
  - File remains in temp/

**Cleanup scenarios:**
- [ ] Upload without confirm
  - File remains in temp/ folder
  - After 24 hours, lifecycle rule deletes file
  - Verify file gone from R2
- [ ] Expired upload session cleanup
  - Create upload session
  - Wait 1 hour (or mock timestamp)
  - Run cleanup job
  - Verify session deleted from database

### E2E Tests (Playwright)

**Profile image upload:**
```typescript
test('user uploads profile image via presigned URL', async ({ page }) => {
  await page.goto('/profile');
  await page.click('[data-test="edit-profile-button"]');

  // Upload image
  const fileInput = page.locator('[data-test="profile-image-upload"]');
  await fileInput.setInputFiles('tests/fixtures/profile.jpg');

  // Wait for upload to complete
  await expect(page.locator('[data-test="upload-progress"]')).toBeVisible();
  await expect(page.locator('[data-test="upload-progress"]')).toContainText('100%');

  // Verify new image appears
  const profileImage = page.locator('[data-test="profile-image"]');
  await expect(profileImage).toHaveAttribute('src', /.+profile-images.+\.jpg$/);

  // Verify old image deleted from R2 (check via API)
  // Verify new image in database (check via API)
});
```

**Band image upload:**
```typescript
test('band admin uploads band image via presigned URL', async ({ page }) => {
  await page.goto('/bands/1');
  await page.click('[data-test="edit-band-button"]');

  // Upload image
  const fileInput = page.locator('[data-test="band-image-upload"]');
  await fileInput.setInputFiles('tests/fixtures/band.jpg');

  // Wait for upload to complete
  await expect(page.locator('[data-test="upload-success"]')).toBeVisible();

  // Verify new image appears on band profile
  const bandImage = page.locator('[data-test="band-profile-image"]');
  await expect(bandImage).toHaveAttribute('src', /.+band-images.+\.jpg$/);
});
```

**Post media upload:**
```typescript
test('user uploads multiple media files to post', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-test="create-post-button"]');

  // Upload 3 files
  const fileInput = page.locator('[data-test="post-media-upload"]');
  await fileInput.setInputFiles([
    'tests/fixtures/image1.jpg',
    'tests/fixtures/image2.jpg',
    'tests/fixtures/video.mp4'
  ]);

  // Wait for all uploads to complete
  await expect(page.locator('[data-test="upload-progress-0"]')).toContainText('100%');
  await expect(page.locator('[data-test="upload-progress-1"]')).toContainText('100%');
  await expect(page.locator('[data-test="upload-progress-2"]')).toContainText('100%');

  // Create post
  await page.fill('[data-test="post-content"]', 'Check out my performance!');
  await page.click('[data-test="submit-post-button"]');

  // Verify post appears with media
  await expect(page.locator('[data-test="post-media-0"]')).toBeVisible();
  await expect(page.locator('[data-test="post-media-1"]')).toBeVisible();
  await expect(page.locator('[data-test="post-media-2"]')).toBeVisible();
});
```

**Error handling:**
```typescript
test('shows error when file too large', async ({ page }) => {
  await page.goto('/profile');
  await page.click('[data-test="edit-profile-button"]');

  // Try to upload 20MB image (exceeds 10MB limit)
  const fileInput = page.locator('[data-test="profile-image-upload"]');
  await fileInput.setInputFiles('tests/fixtures/large-image.jpg');

  // Verify error message shown
  await expect(page.locator('[data-test="upload-error"]')).toContainText('File too large');

  // Verify upload button disabled
  await expect(page.locator('[data-test="upload-button"]')).toBeDisabled();
});

test('shows error when presigned URL expires', async ({ page }) => {
  // Mock presigned URL request to return URL that expires immediately
  await page.route('**/api/uploads/presigned-url', (route) => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({
        uploadId: 'upload_test',
        presignedUrl: 'https://expired-url.r2.dev/...',
        key: 'temp/user_test/...',
        expiresAt: new Date(Date.now() - 1000).toISOString() // Already expired
      })
    });
  });

  await page.goto('/profile');
  await page.click('[data-test="edit-profile-button"]');

  // Upload image
  const fileInput = page.locator('[data-test="profile-image-upload"]');
  await fileInput.setInputFiles('tests/fixtures/profile.jpg');

  // Verify error message shown
  await expect(page.locator('[data-test="upload-error"]')).toContainText('Upload expired');

  // Verify retry button appears
  await expect(page.locator('[data-test="retry-upload-button"]')).toBeVisible();
});
```

### Load Tests

**Concurrent uploads:**
- [ ] 100 users uploading profile images simultaneously
  - All uploads succeed
  - P95 latency < 500ms for presigned URL generation
  - P95 latency < 1s for confirm
- [ ] 1000 presigned URL requests per minute
  - Rate limiting triggers at 20 per user per minute
  - IP rate limiting triggers at 100 per minute
  - No 500 errors

**R2 performance:**
- [ ] 1000 files uploaded to R2 in 1 minute
  - All uploads succeed
  - No timeouts
  - No 500 errors from R2

**Lifecycle cleanup:**
- [ ] 10,000 temp files older than 24 hours
  - Lifecycle rule deletes all files
  - No orphaned files remain after 48 hours

## Security Considerations

### Authentication & Authorization

- [x] **Authentication required**: All endpoints require authenticated user (session token)
- [x] **Profile image uploads**: User can only upload to own profile (user ID from session)
- [x] **Band image uploads**: User must be band admin (check `bands_members.is_admin`)
- [x] **Post media uploads**: User can only upload to own posts (user ID from session)
- [x] **Upload session ownership**: User can only confirm own uploads (user ID in upload session)

### Input Validation & Sanitization

- [x] **File type validation**: Client validates extension, server validates MIME type + magic numbers
- [x] **File size validation**: Client validates size, server re-validates from R2 metadata
- [x] **File name sanitization**: Only alphanumeric + dot + dash + underscore allowed
- [x] **Content-Type validation**: Server validates Content-Type header matches file contents
- [x] **Presigned URL constraints**: PUT only, specific Content-Type, Content-Length enforced

### Rate Limiting

- [x] **Presigned URL generation**: 20 per user per minute (user ID-based)
- [x] **IP-based rate limiting**: 100 presigned URLs per minute (prevents multi-account abuse)
- [x] **Confirm requests**: No rate limit (upload session validation prevents abuse)

### Data Privacy

- [ ] **EXIF data**: Not stripped in MVP (future: strip location, device info)
- [x] **Temp folder isolation**: User uploads in separate subfolders (temp/{userId}/)
- [x] **Presigned URL expiration**: 15 minutes (limits exposure window)
- [x] **Upload session expiration**: 1 hour max age (prevents stale upload ID abuse)

### R2 Security

- [x] **Presigned URLs**: Time-limited (15 min), single-use, restricted to specific operations
- [x] **CORS policy**: Only allow PUT from known origins (localhost, production domain)
- [x] **Public read access**: Only permanent files, not temp/ folder
- [x] **Unique keys**: Prevent overwriting other users' files (user ID in key)

### Cloudflare Workers Security

- [x] **Environment variables**: R2 credentials in wrangler.jsonc, not in code
- [x] **Secrets management**: API keys stored in Cloudflare Secrets (not in repo)
- [x] **Error messages**: Don't leak sensitive info (R2 bucket name, internal paths)

## Rollout Plan

### Phase 1: MVP (Week 1-2)

**Build:**
- [ ] Database migration: Create `upload_sessions` table
- [ ] Shared types: Zod schemas for presigned URL request/response, confirm request/response
- [ ] Backend API: 3 endpoints (presigned-url, confirm, confirm-batch)
- [ ] Backend validation: File size, content type, magic numbers
- [ ] Backend R2 operations: Generate presigned URL, copy (move), delete
- [ ] Frontend component: PresignedUploadComponent (generic)
- [ ] Frontend components: ProfileImageUpload, BandImageUpload, PostMediaUpload
- [ ] Frontend hooks: usePresignedUpload (handles upload flow)
- [ ] R2 lifecycle rule: Delete temp/ files after 24 hours
- [ ] R2 CORS config: Allow PUT from frontend origins
- [ ] Cleanup worker: Delete expired upload sessions (cron: every 6 hours)

**Ship to:**
- [ ] 10% of users (feature flag)
- [ ] Monitor for errors, performance issues

**Monitor:**
- [ ] Upload success rate (target: > 95%)
- [ ] P95 upload time for 5MB image (target: < 10s)
- [ ] P95 upload time for 50MB video (target: < 60s)
- [ ] Orphaned files in temp/ (target: < 1%)
- [ ] API worker CPU time for uploads (target: < 100ms)
- [ ] Error rate (target: < 1%)

**Success Criteria:**
- [ ] 1000+ uploads via presigned URL in first week
- [ ] Upload success rate > 95%
- [ ] No critical bugs reported
- [ ] P95 response time < 500ms for API endpoints
- [ ] Worker CPU time reduced by 80%+

### Phase 2: Optimization (Week 3-4)

**Based on feedback, add:**
- [ ] Use Cloudflare KV for upload sessions (faster than database)
- [ ] Image optimization on confirm (resize, compress, WebP conversion)
- [ ] Client-side image compression before upload (reduce file size)
- [ ] Progress indicators with time remaining estimate
- [ ] Retry with exponential backoff on transient errors

**Ship to:**
- [ ] 100% of users

**Monitor:**
- [ ] Upload success rate (target: > 98%)
- [ ] P95 upload time improvements
- [ ] KV performance (read latency < 5ms)

### Phase 3: Advanced Features (Week 5-6)

**Improvements:**
- [ ] Resumable uploads for large videos (tus protocol)
- [ ] AI content moderation before confirmation
- [ ] Cloudflare Images integration for automatic variants
- [ ] Video transcoding (convert to web-optimized formats)
- [ ] Drag-and-drop upload
- [ ] Paste from clipboard
- [ ] Image crop/rotate before upload

**Ship to:**
- [ ] All users

## Metrics to Track

### Key Metrics

| Metric | Definition | Target | How to Measure |
|--------|------------|--------|----------------|
| Upload Success Rate | % of uploads that complete successfully | > 95% | Count confirmed uploads / presigned URL requests |
| P95 Upload Time (5MB) | 95th percentile time for 5MB image upload | < 10s | Track time from file selection to confirmation |
| P95 Upload Time (50MB) | 95th percentile time for 50MB video upload | < 60s | Track time from file selection to confirmation |
| API Worker CPU Time | CPU time per upload (presigned + confirm) | < 100ms | Cloudflare Workers Analytics |
| Orphaned File Rate | % of temp/ files that expire without confirmation | < 1% | Count lifecycle deletions / presigned URL requests |
| Presigned URL Generation Time | P95 latency for presigned URL endpoint | < 100ms | Cloudflare Workers Analytics |
| Confirm Validation Time | P95 latency for confirm endpoint | < 300ms | Cloudflare Workers Analytics |
| Error Rate | % of upload flows that fail | < 1% | Sentry error count / total uploads |

### User Behavior Metrics

| Metric | Definition | How to Measure |
|--------|------------|----------------|
| Upload Retry Rate | % of uploads retried after initial failure | Track retry button clicks / upload failures |
| Upload Abandonment Rate | % of users who select file but don't complete upload | Track file selections / confirmed uploads |
| File Type Distribution | % of uploads by type (JPEG, PNG, WebP, MP4, etc.) | Count uploads by Content-Type |
| File Size Distribution | Average file size per upload type | Calculate average fileSize from upload sessions |
| Upload Method Distribution | % of uploads via presigned URL vs through-API | Track upload flow (future A/B test) |

### System Health Metrics

| Metric | Definition | How to Measure |
|--------|------------|----------------|
| Temp Folder Size | Total size of files in temp/ | R2 Analytics (storage usage for temp/ prefix) |
| Upload Sessions Table Size | Number of rows in upload_sessions | Database query: `SELECT COUNT(*) FROM upload_sessions` |
| R2 API Error Rate | % of R2 operations that fail | Track R2 SDK errors in Sentry |
| Presigned URL Expiration Rate | % of presigned URLs that expire before use | Track 403 errors from R2 uploads |
| Cleanup Job Success Rate | % of cleanup jobs that complete successfully | Track cron job execution logs |

## Open Questions

### Product Decisions (User to Decide)

1. **Should we strip EXIF data from uploaded images?**
   - **Pros**: Privacy (removes location, device info), smaller file size
   - **Cons**: Some users want to preserve EXIF data (camera settings for photographers)
   - **Recommendation**: Strip by default, add "Preserve EXIF" checkbox (Phase 2)

2. **Should we support drag-and-drop upload?**
   - **Pros**: Better UX, faster upload flow
   - **Cons**: Requires additional frontend work
   - **Recommendation**: Yes, add in Phase 3 (after MVP proven)

3. **Should we generate thumbnails automatically?**
   - **Pros**: Faster page loads, better mobile experience
   - **Cons**: Increases processing time, storage cost
   - **Recommendation**: Yes, add in Phase 2 (use Cloudflare Images)

4. **Should we allow resumable uploads for large videos?**
   - **Pros**: Better UX for slow connections, prevents re-upload on failure
   - **Cons**: More complex implementation (tus protocol)
   - **Recommendation**: Defer to Phase 3 (validate demand first)

5. **Should we use Cloudflare Images for automatic optimization?**
   - **Pros**: Automatic resize, format conversion (WebP), variants, CDN caching
   - **Cons**: Additional cost ($5/month + $1 per 100k images)
   - **Recommendation**: Evaluate in Phase 2 based on upload volume

### Technical Decisions (Implementation to Decide)

6. **Should we use Cloudflare KV for upload sessions instead of database?**
   - **Option A**: Store in database (current design)
     - Pros: Consistent, transactional, easy to query
     - Cons: Slower (50-100ms), requires cleanup job
   - **Option B**: Store in KV with 1-hour TTL
     - Pros: Faster (5-20ms), automatic expiration
     - Cons: Eventual consistency, no transactions
   - **Recommendation**: Start with database (MVP), migrate to KV in Phase 2

7. **How to handle concurrent profile image uploads?**
   - **Scenario**: User uploads image A, then immediately uploads image B
   - **Option A**: Allow both, last-write-wins
   - **Option B**: Cancel A when B starts
   - **Option C**: Queue uploads, process sequentially
   - **Recommendation**: Option A (simplest, acceptable for MVP)

8. **Should we validate file contents beyond magic numbers?**
   - **Option A**: Magic numbers only (current design)
   - **Option B**: Full image/video validation (read entire file, check for corruption)
   - **Recommendation**: Option A for MVP (faster, catches 95% of issues). Option B in Phase 3 if needed.

9. **How to handle orphaned files from failed confirm requests?**
   - **Scenario**: File moved to permanent location, but database update fails
   - **Option A**: Rely on lifecycle cleanup (24h delay)
   - **Option B**: Retry database update with exponential backoff
   - **Option C**: Periodic reconciliation job (find files in R2 not in database, delete)
   - **Recommendation**: Option B (retry) + Option C (reconciliation job in Phase 2)

10. **Should we implement client-side image compression?**
    - **Pros**: Smaller file sizes, faster uploads, lower bandwidth costs
    - **Cons**: CPU-intensive on client, may reduce image quality
    - **Recommendation**: Yes, add in Phase 2 (optional, user can disable)

## Dependencies

**Requires:**
- [x] R2 bucket `sound-connect-assets` with public access configured
- [x] R2 CORS policy allowing PUT from frontend origins
- [x] R2 lifecycle rule for temp/ folder cleanup
- [ ] Cloudflare Workers R2 binding in wrangler.jsonc
- [ ] Database migration applied (upload_sessions table)
- [ ] Cleanup worker deployed with cron trigger

**Blocks:**
- None - This is an enhancement to existing upload flows

**Integrates with:**
- Profile management (updates users.image column)
- Band management (updates bands.profile_image_url column)
- Post creation (includes media keys in posts)
- Media table (stores keys for post media)

---

## Implementation Summary

**Estimated Effort:** 10-12 days

**Breakdown:**
- Database migration & shared types: 1 day
- Backend API (3 endpoints + validation): 3 days
- Backend R2 operations (presigned URL, copy, delete): 2 days
- Frontend upload component (generic + specific): 3 days
- R2 configuration (lifecycle, CORS): 0.5 day
- Cleanup worker: 0.5 day
- Testing & bug fixes: 2 days

**Priority:** High (enables large file uploads, improves performance)

**Owner:** To be assigned

**Dependencies:** R2 bucket configured, CORS policy applied, lifecycle rule created
