package main

import (
	"archive/zip"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"testing"

	"github.com/metametamoon/untitled-crud/backend/internal/transport/dto"
	"github.com/stretchr/testify/require"
)

func TestEndToEnd_RunsCrud(t *testing.T) {
	ts := newTestServer(t)
	defer ts.Close()

	body, mw, err := create(t, 5)

	if mw == nil {
		panic("mw == nil")
	}
	postURL := ts.URL + "/v1/runs"
	resp, err := http.Post(postURL, mw.FormDataContentType(), body)
	require.NoError(t, err)
	defer resp.Body.Close()
	require.Equal(t, http.StatusOK, resp.StatusCode)

	var up struct {
		Id     int    `json:"id"`
		Status string `json:"status"`
	}
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&up))
	require.Greater(t, up.Id, 0)
	runID := up.Id

	getOneURL := fmt.Sprintf("%s/v1/runs/metadata/%d", ts.URL, runID)
	resp, err = http.Get(getOneURL)
	require.NoError(t, err)
	defer resp.Body.Close()
	require.Equal(t, http.StatusOK, resp.StatusCode)

	var one struct {
		Timestamp    string   `json:"timestamp"`
		FailureCount int      `json:"failureCount"`
		Tags         []string `json:"tags"`
	}
	err = json.NewDecoder(resp.Body).Decode(&one)
	require.NoError(t, err)
	require.Equal(t, 5, one.FailureCount)

	allURL := ts.URL + "/v1/runs/metadatas"
	resp, err = http.Get(allURL)
	require.NoError(t, err)
	defer resp.Body.Close()
	require.Equal(t, http.StatusOK, resp.StatusCode)

	var all []dto.MetadataWithId
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&all))
	found := false
	for _, x := range all {
		if x.Id == runID {
			found = true
		}
	}
	require.True(t, found)

	arcURL := fmt.Sprintf("%s/v1/runs/archive/%d", ts.URL, runID)
	resp, err = http.Get(arcURL)
	require.NoError(t, err)
	defer resp.Body.Close()
	require.Equal(t, http.StatusOK, resp.StatusCode)
	require.Equal(t, "application/zip", resp.Header.Get("Content-Type"))

	data, err := io.ReadAll(resp.Body)
	require.NoError(t, err)

	zr, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	require.NoError(t, err)
	found = verifyReturnedZipContent(t, zr)
	require.True(t, found, "metadata.json not found in returned zip")
}

func TestEndToEnd_RunsDetails(t *testing.T) {
	ts := newTestServer(t)
	defer ts.Close()

	body, mw, err := create(t, 15)

	if mw == nil {
		panic("mw == nil")
	}
	postURL := ts.URL + "/v1/runs"
	resp, err := http.Post(postURL, mw.FormDataContentType(), body)
	require.NoError(t, err)
	defer resp.Body.Close()
	require.Equal(t, http.StatusOK, resp.StatusCode)

	var up struct {
		Id     int    `json:"id"`
		Status string `json:"status"`
	}
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&up))
	require.Greater(t, up.Id, 0)
	runID := up.Id

	getDetailsURL := fmt.Sprintf("%s/v1/runs/details/%d", ts.URL, runID)
	resp, err = http.Get(getDetailsURL)
	require.NoError(t, err)
	defer resp.Body.Close()
	require.Equal(t, http.StatusOK, resp.StatusCode)

	var details dto.RunDetailsWithId
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&details))
	require.Equal(t, details.Id, runID)
	validateRunDetails(t, &details)
}

func TestEndToEnd_seriousTest(t *testing.T) {
	ts := newTestServer(t)
	defer ts.Close()

	body, mw, err := readSampleData(t)

	if mw == nil {
		panic("mw == nil")
	}
	postURL := ts.URL + "/v1/runs"
	resp, err := http.Post(postURL, mw.FormDataContentType(), body)
	require.NoError(t, err)
	defer resp.Body.Close()
	require.Equal(t, http.StatusOK, resp.StatusCode)

	var up struct {
		Id     int    `json:"id"`
		Status string `json:"status"`
	}
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&up))
	require.Greater(t, up.Id, 0)
	runID := up.Id

	getDetailsURL := fmt.Sprintf("%s/v1/runs/details/%d", ts.URL, runID)
	resp, err = http.Get(getDetailsURL)
	require.NoError(t, err)
	defer resp.Body.Close()
	require.Equal(t, http.StatusOK, resp.StatusCode)

	var details dto.RunDetailsWithId
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&details))
	require.Equal(t, details.Id, runID)
	validateRunDetails(t, &details)
}

func verifyReturnedZipContent(t *testing.T, zr *zip.Reader) bool {
	found := false
	for _, f := range zr.File {
		if f.Name == "metadata.json" {
			rc, err := f.Open()
			require.NoError(t, err)
			var m map[string]any
			require.NoError(t, json.NewDecoder(rc).Decode(&m))
			require.Equal(t, float64(5), m["failureCount"])
			found = true
			rc.Close()
		}
	}
	return found
}

func create(t *testing.T, failureCount int) (*bytes.Buffer, *multipart.Writer, error) {
	zipBuf := makeTestZip(t, failureCount)

	body := &bytes.Buffer{}
	mw := multipart.NewWriter(body)
	part, err := mw.CreateFormFile("file", "run.zip")
	require.NoError(t, err)
	_, err = part.Write(zipBuf.Bytes())
	require.NoError(t, err)
	require.NoError(t, mw.Close())
	return body, mw, err
}

func readSampleData(t *testing.T) (*bytes.Buffer, *multipart.Writer, error) {
	zipBuf, err := os.ReadFile("../../data/sample-run-extracted/sample-run-extracted.zip")
	body := &bytes.Buffer{}
	mw := multipart.NewWriter(body)
	part, err := mw.CreateFormFile("file", "run.zip")
	require.NoError(t, err)
	_, err = part.Write(zipBuf)
	require.NoError(t, err)
	require.NoError(t, mw.Close())
	return body, mw, err
}
