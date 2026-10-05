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
export const aiSettings=sqliteTable('ai_settings',{
 userId:text('user_id').primaryKey(),baseUrl:text('base_url').notNull(),model:text('model').notNull(),encryptedKey:text('encrypted_key').notNull(),updatedAt:integer('updated_at').notNull(),
});
export const aiNotes=sqliteTable('ai_notes',{
 userId:text('user_id').notNull(),wordKey:text('word_key').notNull(),wordId:text('word_id').notNull(),status:text('status').notNull().default('pending'),content:text('content'),model:text('model'),error:text('error'),updatedAt:integer('updated_at').notNull(),leaseUntil:integer('lease_until').notNull().default(0),leaseToken:text('lease_token'),
},t=>[primaryKey({columns:[t.userId,t.wordKey]}),index('idx_ai_notes_queue').on(t.userId,t.status,t.leaseUntil)]);
export const aiJobs=sqliteTable('ai_jobs',{
 userId:text('user_id').primaryKey(),status:text('status').notNull().default('paused'),leaseUntil:integer('lease_until').notNull().default(0),leaseToken:text('lease_token'),lastError:text('last_error'),updatedAt:integer('updated_at').notNull(),
});
