### **1. Upload a New Run**

Uploads a zip archive containing run data and its metadata.

* **Endpoint:** `POST /api/v1/runs`
* **Description:** Creates a new run entry by uploading a zip archive. The
  archive *must* contain a `metadata.json` file at its root.
* `metadata.json` should be as such:

```
{
    "failureCount": 4,
    
}
```

* **Request Body:**
    * `Content-Type`: `multipart/form-data`
    * `Body`: A zip archive.
        * **Requirement:** The zip archive must contain a file named
          `metadata.json` at its root level.
* **Response (200 OK):**
  ```json
      {
          "timestamp": "2025-11-25T22:00:00Z",
          "failureCount": 5,
          "tags": ["critical", "not-a-problem"]
      }
  ```
    * `id` (integer): The unique identifier for the newly created run.
    * `status` (string): Indicates the upload status (e.g., "OK").

---

### **2. Get Run Metadata by ID**

Retrieves the metadata for a specific run.

* **Endpoint:** `GET /api/v1/runs/metadata/{id}`
* **Description:** Fetches the metadata associated with a run, identified by its
  unique ID.
* **Path Parameters:**
    * `id` (integer): The unique identifier of the run.
* **Response (200 OK):**
  ```json
  {
      "id": 1,
      "metadata": {
          "timestamp": "2025-11-25T22:00:00Z",
          "failureCount": 5,
          "tags": ["critical", "not-a-problem"]
      }
  }
  ```
    * `id` (integer): The unique identifier of the run.
    * `metadata` (object): An object containing details about the run.
        * `timestamp` (string, ISO 8601): The timestamp of the run.
        * `failureCount` (integer): The number of failures recorded for the run.
        * `tags` (array of strings): A list of descriptive tags for the run.

---

### **3. Get All Runs Metadata**

Retrieves metadata for all available runs.

* **Endpoint:** `GET /api/v1/runs/metadatas`
* **Description:** Fetches a list of metadata for all runs in the system.
* **Response (200 OK):**
  ```json
  [
      {
          "id": 1,
          "metadata": {
              "timestamp": "2025-11-25T22:00:00Z",
              "failureCount": 5,
              "tags": ["critical", "not-a-problem"]
          }
      },
      {
          "id": 2,
          "metadata": {
              "timestamp": "2025-11-25T22:00:00Z",
              "failureCount": 2,
              "tags": ["trivial", "good-first-issue"]
          }
      }
  ]
  ```
    * An array of run objects, each containing an `id` and `metadata` field,
      structured identically to the response of
      `GET /api/v1/runs/metadata/{id}`.

---

### **4. Download Run Archive by ID**

Downloads the original zip archive for a specific run.

* **Endpoint:** `GET /api/v1/runs/archive/{id}`
* **Description:** Retrieves the original zip archive that was uploaded for a
  given run ID.
* **Path Parameters:**
    * `id` (integer): The unique identifier of the run.
* **Response (200 OK):**
    * `Content-Type`: `application/zip`
    * `Body`: The binary content of the zip archive.