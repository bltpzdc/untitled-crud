package db

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	Pool *pgxpool.Pool
}

func NewDB() (*DB, error) {
	connString := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=disable",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
	)

	config, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, fmt.Errorf("unable to parse connection string: %w", err)
	}

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, fmt.Errorf("unable to create connection pool: %w", err)
	}

	if err := pool.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("unable to ping database: %w", err)
	}

	// Run migrations
	if err := runMigrations(context.Background(), pool); err != nil {
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}

	log.Println("Successfully connected to database")
	return &DB{Pool: pool}, nil
}

func (db *DB) Close() {
	db.Pool.Close()
}

func runMigrations(ctx context.Context, pool *pgxpool.Pool) error {
	// Migration: Ensure folder_id column exists on op_crashes and has TEXT type
	_, err := pool.Exec(ctx, `
		DO $$ 
		BEGIN
			IF NOT EXISTS (
				SELECT 1 FROM information_schema.columns 
				WHERE table_name = 'op_crashes' AND column_name = 'folder_id'
			) THEN
				ALTER TABLE op_crashes ADD COLUMN folder_id TEXT;
			ELSE
				IF EXISTS (
					SELECT 1 
					FROM information_schema.columns 
					WHERE table_name = 'op_crashes' AND column_name = 'folder_id' AND data_type <> 'text'
				) THEN
					ALTER TABLE op_crashes ALTER COLUMN folder_id TYPE TEXT USING folder_id::text;
				END IF;
			END IF;
		END $$;
	`)
	if err != nil {
		return fmt.Errorf("failed to add folder_id column: %w", err)
	}
	return nil
}
