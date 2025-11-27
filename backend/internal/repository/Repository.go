package repository

import (
	"context"

	"github.com/metametamoon/untitled-crud/backend/internal/model"
)

type Repository interface {
	CreateRun(ctx context.Context, run *model.FuzzerRun) error
	GetRun(ctx context.Context, id int) (*model.FuzzerRun, error)
	GetRuns(ctx context.Context) ([]model.FuzzerRun, error)
	GetAllTags(ctx context.Context) ([]model.Tag, error)
}
