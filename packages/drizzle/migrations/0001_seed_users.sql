-- Seed test users with pre-hashed passwords (password: aaaaaaaa)
INSERT INTO users (id, name, email, email_verified, image, created_at, updated_at) VALUES
  ('qNsCKabaSy0rH16ncmCU73FxnCQR4T4z', 't1', 't1@asd.asd', 1, null, 1762768571594, 1762768571596),
  ('SCQDH9YOqtVkPZDt7q4yTJEjCkE2YhC4', 't2', 't2@asd.asd', 1, null, 1762768585352, 1762768585352);

-- Add password accounts with pre-hashed passwords
INSERT INTO accounts (id, account_id, provider_id, user_id, password, created_at, updated_at) VALUES
  ('x7tz5E5psSwqcItSh1ajgHU2b9tz0AdX', 'qNsCKabaSy0rH16ncmCU73FxnCQR4T4z', 'credential', 'qNsCKabaSy0rH16ncmCU73FxnCQR4T4z', 'f28e7368b7da338841ba16ccd7bb75e0:0af56534358ae85f36137d9a9f92f1e7e8ed8478bc04578a65eab179ca7aed42cee3cfc371ea772612569a38c1438ec5e94ace3fd0d72542d33a1161a6a30c0a', 1762768571600, 1762768571600),
  ('6tvh7z70mJNq14aoZyndj1yJmXtCDOHv', 'SCQDH9YOqtVkPZDt7q4yTJEjCkE2YhC4', 'credential', 'SCQDH9YOqtVkPZDt7q4yTJEjCkE2YhC4', '0f1bc53654ea4574c661c7a4f79f1feb:72957aa8abbc8909625b6c5a47096612eaaaa59e54803c4a957b65961964cdcd58e173e1c4a666793e7cd009e0d0bbf7607ffc5c56af1d8325fa8db3a0d638ed', 1762768585353, 1762768585353); 

  -- Seed Playwright test users (password: Test123!)
INSERT INTO users (id, name, email, email_verified, created_at, updated_at)
VALUES
    ('Ojb9Yu5WQSUwUAWPFgOeOaCyHvu6eU7o', 'Playwright User 1', 'pw1@test.test', 1, 1762768651167, 1762768651167),
    ('ObTL2d1Sy7xBIKmr5WSo5u7zcP6qk6cK', 'Playwright User 2', 'pw2@test.test', 1, 1762768686703, 1762768686703);

INSERT INTO accounts (id, user_id, account_id, provider_id, password, created_at, updated_at)
VALUES
    ('ngEGUH3YuK6dqqJ46seqmm4qZwlEy0T0', 'Ojb9Yu5WQSUwUAWPFgOeOaCyHvu6eU7o', 'Ojb9Yu5WQSUwUAWPFgOeOaCyHvu6eU7o', 'credential', '443eb652dd5ce6c2829ef82ec3ecd054:a5566cbc5216a19e204ccc69191f00807a1b2fe9310d94f61e2778ae7dc2a7f0d7648d04779db89aa50c82fca3bcc4e631398d176fa207944d419f921673d8d0', 1762768651170, 1762768651170),
    ('FgEuv9lLVjA43UEE1zE9GyRkZsC5j4YV', 'ObTL2d1Sy7xBIKmr5WSo5u7zcP6qk6cK', 'ObTL2d1Sy7xBIKmr5WSo5u7zcP6qk6cK', 'credential', 'e44d68022b74bd067e2667a2f1c8c9f1:bd5a1499d431ca7be8bec84422a452816ff8afbec702e0c290f0f0ab227eeb0b78d88a0b9db32aca667bf0937b6ae8b1a090424b6fa73ed076d717d11e211afe', 1762768686705, 1762768686705);
