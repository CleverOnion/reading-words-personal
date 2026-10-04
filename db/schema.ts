import {sqliteTable,text,integer,index,primaryKey} from 'drizzle-orm/sqlite-core';
export const sessions=sqliteTable('sessions',{
 id:text('id').primaryKey(),userId:text('user_id').notNull(),title:text('title').notNull(),
 mode:text('mode').notNull(),studyFormat:text('study_format').notNull().default('choice'),queue:text('queue').notNull(),startedAt:integer('started_at').notNull(),
 finishedAt:integer('finished_at'),status:text('status').notNull().default('active'),updatedAt:integer('updated_at').notNull().default(0),
},t=>[index('idx_sessions_user_started').on(t.userId,t.startedAt)]);
export const attempts=sqliteTable('attempts',{
 sessionId:text('session_id').notNull().references(()=>sessions.id),position:integer('position').notNull(),
 wordId:text('word_id').notNull(),choice:text('choice'),rating:text('rating'),correct:integer('correct').notNull(),
 answeredAt:integer('answered_at').notNull(),duration:integer('duration').notNull(),
},t=>[primaryKey({columns:[t.sessionId,t.position]})]);
export const savedWords=sqliteTable('saved_words',{
 userId:text('user_id').notNull(),wordId:text('word_id').notNull(),savedAt:integer('saved_at').notNull(),
},t=>[primaryKey({columns:[t.userId,t.wordId]})]);
