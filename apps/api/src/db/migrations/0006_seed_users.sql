-- Seed test users with pre-hashed passwords
INSERT INTO users (id, name, email, email_verified, image, created_at, updated_at) VALUES
  ('xGvICj1532ArhGacyObqzE1bkEounP0y', 't1', 't1@asd.asd', 0, null, unixepoch(), unixepoch()),
  ('keUzTIdaFlWWWgiG61OC5nLza3cbIyWN', 't2', 't2@asd.asd', 0, null, unixepoch(), unixepoch());

-- Add password accounts with pre-hashed passwords
INSERT INTO accounts (id, account_id, provider_id, user_id, password, created_at, updated_at) VALUES
  ('acc_xGvICj1532ArhGacyObqzE1bkEounP0y', 't1@asd.asd', 'credential', 'xGvICj1532ArhGacyObqzE1bkEounP0y', '2e703795fc0e074563dd2f603edca5ea:0283e1707e5c76b6837d69e5ef9a9bbd7497dd6e7edda9890f3a11a0f02c86842222d5cd47d953b8300039f966ef7d3065b15b952c13dd3d474ac8773f0b8e61', unixepoch(), unixepoch()),
  ('acc_keUzTIdaFlWWWgiG61OC5nLza3cbIyWN', 't2@asd.asd', 'credential', 'keUzTIdaFlWWWgiG61OC5nLza3cbIyWN', 'c75f6710bcddb9b4445d5e882b536488:daee13d5e13b1e6dc80c7c331a3821f5798a0e13227e90b64122e365f85b306995763e13ee1b2a1793d94dd9eb797c56640f36a5b9ce021696b583ece79278af', unixepoch(), unixepoch()); 