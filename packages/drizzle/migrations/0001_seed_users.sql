-- Seed test users with pre-hashed passwords (password: aaaaaaaa)
INSERT INTO users (id, name, email, email_verified, image, created_at, updated_at) VALUES
  ('qNsCKabaSy0rH16ncmCU73FxnCQR4T4z', 't1', 't1@asd.asd', 0, null, 1762768571594, 1762768571596),
  ('SCQDH9YOqtVkPZDt7q4yTJEjCkE2YhC4', 't2', 't2@asd.asd', 0, null, 1762768585352, 1762768585352);

-- Add password accounts with pre-hashed passwords
INSERT INTO accounts (id, account_id, provider_id, user_id, password, created_at, updated_at) VALUES
  ('x7tz5E5psSwqcItSh1ajgHU2b9tz0AdX', 'qNsCKabaSy0rH16ncmCU73FxnCQR4T4z', 'credential', 'qNsCKabaSy0rH16ncmCU73FxnCQR4T4z', 'f28e7368b7da338841ba16ccd7bb75e0:0af56534358ae85f36137d9a9f92f1e7e8ed8478bc04578a65eab179ca7aed42cee3cfc371ea772612569a38c1438ec5e94ace3fd0d72542d33a1161a6a30c0a', 1762768571600, 1762768571600),
  ('6tvh7z70mJNq14aoZyndj1yJmXtCDOHv', 'SCQDH9YOqtVkPZDt7q4yTJEjCkE2YhC4', 'credential', 'SCQDH9YOqtVkPZDt7q4yTJEjCkE2YhC4', '0f1bc53654ea4574c661c7a4f79f1feb:72957aa8abbc8909625b6c5a47096612eaaaa59e54803c4a957b65961964cdcd58e173e1c4a666793e7cd009e0d0bbf7607ffc5c56af1d8325fa8db3a0d638ed', 1762768585353, 1762768585353); 