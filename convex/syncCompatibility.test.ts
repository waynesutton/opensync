/// <reference types="vite/client" />
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import { internal } from "./_generated/api";
import schema from "./schema";
const modules = import.meta.glob("./**/*.ts");
const createTest = () => convexTest(schema, modules);
type Backend = ReturnType<typeof createTest>;
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(Date.UTC(2026, 9, 4)); });
afterEach(() => vi.useRealTimers());
async function setup(t: Backend, name = "one") {
 const userId = await t.run(ctx => ctx.db.insert("users", {workosId:name, createdAt:1, updatedAt:1}));
 const sessionId = await t.mutation(internal.sessions.upsert, {userId, externalId:"session", promptTokens:100, completionTokens:20});
 return {userId, sessionId};
}
const base = {sessionExternalId:"session", externalId:"message", role:"user" as const};
const parts = [{type:"text",content:"Original"}];
describe("sync compatibility", () => {
 it("accepts immediate content growth without changing session token totals", async () => {
  const t=createTest(); const {userId, sessionId}=await setup(t);
  const id=await t.mutation(internal.messages.upsert,{userId,...base,textContent:""});
  await t.mutation(internal.messages.upsert,{userId,...base,textContent:"Full first message",parts,promptTokens:999});
  expect(await t.run(ctx=>ctx.db.get(id))).toMatchObject({textContent:"Full first message"});
  expect(await t.run(ctx=>ctx.db.get(sessionId))).toMatchObject({messageCount:1,totalTokens:120});
 });
 it.each([false,true])("preserves omitted parts and replaces explicit parts, batch=%s", async batch => {
  const t=createTest(); const {userId}=await setup(t);
  const id=await t.mutation(internal.messages.upsert,{userId,...base,parts});
  vi.advanceTimersByTime(6000);
  const send=async (change: {textContent?:string;parts?:typeof parts}) => batch
   ? t.mutation(internal.messages.batchUpsert,{userId,messages:[{...base,...change}]})
   : t.mutation(internal.messages.upsert,{userId,...base,...change});
  const read=()=>t.run(ctx=>ctx.db.query("parts").withIndex("by_message",q=>q.eq("messageId",id)).collect());
  await send({textContent:"Update"});expect((await read()).map(p=>p.content)).toEqual(["Original"]);
  await send({parts:[{type:"text",content:"Replacement"}]});expect((await read()).map(p=>p.content)).toEqual(["Replacement"]);
  await send({parts:[]});expect(await read()).toEqual([]);
 });
 it.each([false,true])("isolates identical external IDs across owners, batch=%s", async batch => {
  const t=createTest(); const a=await setup(t,"a");const b=await setup(t,"b");
  const id=await t.mutation(internal.messages.upsert,{userId:a.userId,...base,textContent:"Owner A",parts});
  vi.advanceTimersByTime(6000);
  if(batch) await t.mutation(internal.messages.batchUpsert,{userId:b.userId,messages:[{...base,textContent:"Owner B"}]});
  else await t.mutation(internal.messages.upsert,{userId:b.userId,...base,textContent:"Owner B"});
  expect(await t.run(ctx=>ctx.db.get(id))).toMatchObject({sessionId:a.sessionId,textContent:"Owner A"});
  const rows=await t.run(ctx=>ctx.db.query("messages").withIndex("by_session",q=>q.eq("sessionId",b.sessionId)).collect());
  expect(rows).toHaveLength(1);expect(rows[0].textContent).toBe("Owner B");
 });
 it("deduplicates repeated message IDs inside a batch and accepts the latest snapshot", async () => {
  const t=createTest();const {userId,sessionId}=await setup(t);
  await t.mutation(internal.messages.batchUpsert,{userId,messages:[{...base,textContent:"first"},{...base,textContent:"latest",parts}]});
  const rows=await t.run(ctx=>ctx.db.query("messages").withIndex("by_session",q=>q.eq("sessionId",sessionId)).collect());
  expect(rows).toHaveLength(1);expect(rows[0].textContent).toBe("latest");
  expect(await t.run(ctx=>ctx.db.get(sessionId))).toMatchObject({messageCount:1,totalTokens:120});
 });
 it("leaves identical snapshots unchanged on retry", async () => {
  const t=createTest();const {userId,sessionId}=await setup(t);
  await t.mutation(internal.messages.upsert,{userId,...base,parts});
  const before=await t.run(ctx=>ctx.db.get(sessionId));
  vi.advanceTimersByTime(6000);
  const result=await t.mutation(internal.messages.batchUpsert,{userId,messages:[{...base,parts}]});
  expect(result).toMatchObject({inserted:0,updated:0,skipped:1});
  expect(await t.run(ctx=>ctx.db.get(sessionId))).toEqual(before);
 });

 it.each([false,true])("keeps rapid provider, cost and completion updates, batch=%s", async batch => {
  const t=createTest();const {userId,sessionId}=await setup(t);
  const update={externalId:"session",provider:"updated-provider",projectName:"project",cost:2,completionTokens:30};
  if(batch) await t.mutation(internal.sessions.batchUpsert,{userId,sessions:[update]});
  else await t.mutation(internal.sessions.upsert,{userId,...update});
  expect(await t.run(ctx=>ctx.db.get(sessionId))).toMatchObject({provider:"updated-provider",projectName:"project",cost:2,completionTokens:30,totalTokens:130});
 });

 it.each([false,true])("keeps provider-only repairs inside the dedup window, batch=%s", async batch => {
  const t=createTest();const {userId,sessionId}=await setup(t);
  const update={externalId:"session",provider:"repaired"};
  if(batch) await t.mutation(internal.sessions.batchUpsert,{userId,sessions:[update]});
  else await t.mutation(internal.sessions.upsert,{userId,...update});
  expect(await t.run(ctx=>ctx.db.get(sessionId))).toMatchObject({provider:"repaired",totalTokens:120});
 });

});
