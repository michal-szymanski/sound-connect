-- Seed Playwright test users
INSERT INTO users (id, name, email, email_verified, created_at, updated_at)
VALUES
    ('xIaZhdYzGgdUCArgtU0QdLOBWGHB08Mz', 'Playwright User 1', 'pw1@test.test', 1, 1760907429, 1760907429),
    ('mstMlnzefkISg3BtHbz6ZmJ6HAokd6xz', 'Playwright User 2', 'pw2@test.test', 1, 1760907455, 1760907455);

INSERT INTO accounts (id, user_id, account_id, provider_id, password, created_at, updated_at)
VALUES
    ('xIaZhdYzGgdUCArgtU0QdLOBWGHB08Mz', 'xIaZhdYzGgdUCArgtU0QdLOBWGHB08Mz', 'pw1@test.test', 'credential', 'fdb8d697c2fb87d2a216d2e154dbabf9:b178a3915cf816698039418e50b47f5b12658e21b911ffb3b85a3741537b1b7e636c5dcafe89fea1f7ebf394e82ed478c5564b59880d063705d566e8fb9f3b96', 1760907429, 1760907429),
    ('mstMlnzefkISg3BtHbz6ZmJ6HAokd6xz', 'mstMlnzefkISg3BtHbz6ZmJ6HAokd6xz', 'pw2@test.test', 'credential', '1cace227241962ebf1dee5cc502969c2:3c5874aca7c852fb1de0243e96df2689f86b9ac5af59e7eaa10320b20c7f891be911dd093819ae5571b87ceb67d94297441e823b7093222e2b959d2851d1714b', 1760907455, 1760907455);
