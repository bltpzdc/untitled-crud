CREATE TABLE fuzzer_runs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    failure_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE run_tags (
    id SERIAL PRIMARY KEY,
    run_id INTEGER NOT NULL REFERENCES fuzzer_runs(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE(run_id, tag_id)
);

CREATE TABLE op_crashes (
    id SERIAL PRIMARY KEY,
    run_id INTEGER NOT NULL REFERENCES fuzzer_runs(id) ON DELETE CASCADE,
    operation VARCHAR(20) NOT NULL
);

CREATE TABLE test_cases (
    id SERIAL PRIMARY KEY,
    crash_id INTEGER NOT NULL REFERENCES op_crashes(id) ON DELETE CASCADE,
    total_operations INTEGER NOT NULL DEFAULT 0,
    test_seq JSONB,
    diff JSONB
);

CREATE TABLE fs_test_summaries (
    id SERIAL PRIMARY KEY,
    test_case_id INTEGER NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    fs_name VARCHAR(10) NOT NULL,
    fs_success_count INTEGER NOT NULL DEFAULT 0,
    fs_failure_count INTEGER NOT NULL DEFAULT 0,
    fs_execution_time INTERVAL
);

CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_run_tags_run_id ON run_tags(run_id);
CREATE INDEX idx_run_tags_tag_id ON run_tags(tag_id);
CREATE INDEX idx_op_crashes_run_id ON op_crashes(run_id);
CREATE INDEX idx_op_crashes_operation ON op_crashes(operation);
CREATE INDEX idx_test_cases_crash_id ON test_cases(crash_id);
CREATE INDEX idx_fs_summaries_test_case ON fs_test_summaries(test_case_id);
CREATE INDEX idx_test_artifacts_test_case ON test_artifacts(test_case_id);
CREATE INDEX idx_fs_artifacts_test_artifacts ON fs_artifacts(test_artifacts_id);



INSERT INTO tags (name) VALUES 
('ext4'), ('xfs')
ON CONFLICT (name) DO NOTHING;