CREATE TABLE IF NOT EXISTS fuzzer_runs (
    id SERIAL PRIMARY KEY,
    timestamp VARCHAR(30),
    failure_count INTEGER NOT NULL DEFAULT 0,
    comment TEXT
);

CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS run_tags (
    id SERIAL PRIMARY KEY,
    run_id INTEGER NOT NULL REFERENCES fuzzer_runs(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE(run_id, tag_id)
);

CREATE TABLE IF NOT EXISTS op_crashes (
    id SERIAL PRIMARY KEY,
    run_id INTEGER NOT NULL REFERENCES fuzzer_runs(id) ON DELETE CASCADE,
    operation VARCHAR(20) NOT NULL,
    folder_id TEXT
);

CREATE TABLE IF NOT EXISTS test_cases (
    id SERIAL PRIMARY KEY,
    crash_id INTEGER NOT NULL REFERENCES op_crashes(id) ON DELETE CASCADE,
    hash VARCHAR(40) NOT NULL,
    total_operations INTEGER NOT NULL DEFAULT 0,
    test JSONB
);

CREATE TABLE IF NOT EXISTS test_reasons (
    id SERIAL PRIMARY KEY,
    test_case_id INTEGER NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    op_number INTEGER NOT NULL DEFAULT 0,
    diff JSONB
)

CREATE TABLE IF NOT EXISTS fs_test_summaries (
    id SERIAL PRIMARY KEY,
    test_case_id INTEGER NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    fs_name VARCHAR(10) NOT NULL,
    fs_success_count INTEGER NOT NULL DEFAULT 0,
    fs_failure_count INTEGER NOT NULL DEFAULT 0,
    fs_execution_time INTERVAL,
    fs_trace JSONB,
    fs_stdout TEXT,
    fs_stderr TEXT
);


INSERT INTO tags (name) VALUES 
('ext4'), ('xfs')
ON CONFLICT (name) DO NOTHING;

-- Migration: Ensure folder_id column exists on op_crashes and has TEXT type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'op_crashes' AND column_name = 'folder_id'
    ) THEN
        ALTER TABLE op_crashes ADD COLUMN folder_id TEXT;
    ELSE
        -- Если колонка уже есть, но имеет другой тип, приводим к TEXT
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'op_crashes' AND column_name = 'folder_id' AND data_type <> 'text'
        ) THEN
            ALTER TABLE op_crashes ALTER COLUMN folder_id TYPE TEXT USING folder_id::text;
        END IF;
    END IF;
END $$;
