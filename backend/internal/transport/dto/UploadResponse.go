package dto

type UploadResponse struct {
	Status string `json:"status" example:"success"`
	Id     int    `json:"id" example:"42"`
}
