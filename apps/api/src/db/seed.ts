// import { db } from '@/db';
// import {
//     postsTable,
//     postsReactionsTable,
//     mediaTable,
//     commentsTable,
//     commentsReactionsTable,
//     musicGroupsTable,
//     musicGroupMembersTable,
//     usersFollowersTable,
//     musicGroupsFollowersTable
// } from '@/db/schema';
// import { seed } from 'drizzle-seed';

// const usersIds = ['user_2t2ucZ6jIgK4vZ1c3LfTmgL6gjo'];

// export const main = async () => {
//     await seed(db, {
//         postsTable,
//         postsReactionsTable,
//         mediaTable,
//         commentsTable,
//         commentsReactionsTable,
//         musicGroupsTable,
//         musicGroupMembersTable,
//         usersFollowersTable,
//         musicGroupsFollowersTable
//     }).refine((f) => ({
//         postsTable: {
//             columns: {
//                 userId: f.valuesFromArray({ values: usersIds }),
//                 content: f.loremIpsum({ sentencesCount: 3 }),
//                 createdAt: f.date({ maxDate: new Date() })
//             }
//         },
//         postsReactionsTable: {
//             columns: {
//                 userId: f.valuesFromArray({ values: usersIds })
//             }
//         },
//         commentsTable: {
//             columns: {
//                 userId: f.valuesFromArray({ values: usersIds }),
//                 content: f.loremIpsum({ sentencesCount: 1 }),
//                 createdAt: f.date({ maxDate: new Date() })
//             }
//         },
//         commentsReactionsTable: {
//             columns: {
//                 userId: f.valuesFromArray({ values: usersIds })
//             }
//         },
//         musicGroupMembersTable: {
//             columns: {
//                 userId: f.valuesFromArray({ values: usersIds })
//             }
//         },
//         usersFollowersTable: {
//             columns: {
//                 userId: f.valuesFromArray({ values: usersIds })
//             }
//         },
//         musicGroupsFollowersTable: {
//             columns: {
//                 followerId: f.valuesFromArray({ values: usersIds })
//             }
//         }
//     }));
// };

// export default main().catch(console.error);
