-- Seed Playwright test users (password: Test123!)
INSERT INTO users (id, name, email, email_verified, created_at, updated_at)
VALUES
    ('Ojb9Yu5WQSUwUAWPFgOeOaCyHvu6eU7o', 'Playwright User 1', 'pw1@test.test', 0, 1762768651167, 1762768651167),
    ('ObTL2d1Sy7xBIKmr5WSo5u7zcP6qk6cK', 'Playwright User 2', 'pw2@test.test', 0, 1762768686703, 1762768686703);

INSERT INTO accounts (id, user_id, account_id, provider_id, password, created_at, updated_at)
VALUES
    ('ngEGUH3YuK6dqqJ46seqmm4qZwlEy0T0', 'Ojb9Yu5WQSUwUAWPFgOeOaCyHvu6eU7o', 'Ojb9Yu5WQSUwUAWPFgOeOaCyHvu6eU7o', 'credential', '443eb652dd5ce6c2829ef82ec3ecd054:a5566cbc5216a19e204ccc69191f00807a1b2fe9310d94f61e2778ae7dc2a7f0d7648d04779db89aa50c82fca3bcc4e631398d176fa207944d419f921673d8d0', 1762768651170, 1762768651170),
    ('FgEuv9lLVjA43UEE1zE9GyRkZsC5j4YV', 'ObTL2d1Sy7xBIKmr5WSo5u7zcP6qk6cK', 'ObTL2d1Sy7xBIKmr5WSo5u7zcP6qk6cK', 'credential', 'e44d68022b74bd067e2667a2f1c8c9f1:bd5a1499d431ca7be8bec84422a452816ff8afbec702e0c290f0f0ab227eeb0b78d88a0b9db32aca667bf0937b6ae8b1a090424b6fa73ed076d717d11e211afe', 1762768686705, 1762768686705);
