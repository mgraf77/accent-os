# Overengineering Check
Run at the end of Phase 4 (Ralph Loop) before proceeding to Phase 5 (MVP Reduction).
Overengineering = complexity that wasn't asked for and won't be needed at MVP scale.

---

## Infrastructure Complexity

- [ ] No external APIs introduced that weren't in the original input
- [ ] No database schema designed for a system that can use flat files
- [ ] No message queue or event bus for a system with <3 producers and <3 consumers
- [ ] No microservice boundary drawn for a system a single process can handle
- [ ] No authentication system designed for a single-user internal tool

## Abstraction Complexity

- [ ] No interface or base class for a system with only one implementation
- [ ] No plugin architecture for a system with fewer than 3 extension points
- [ ] No configuration hierarchy deeper than 2 levels (config → override)
- [ ] No factory or registry pattern for a system with fewer than 3 registered types

## Premature Optimization

- [ ] No caching layer for a system that hasn't proven it needs caching
- [ ] No pagination for a dataset that fits in memory
- [ ] No async/queue for a workflow that runs in <1 second
- [ ] No distributed locking for a single-machine system

## Speculative Systems

- [ ] No "future-proofing" code that has no current use case
- [ ] No "extension hooks" that no planned feature uses
- [ ] No versioning scheme for a system on v1 with no migration history
- [ ] Every schema field is used in at least one workflow

## Documentation Complexity

- [ ] No README longer than the system it documents
- [ ] No architecture diagram with more than 8 nodes
- [ ] No separate ARCHITECTURE.md + PROCESS.md + DESIGN.md for a single skill
- [ ] No changelog for a system not yet shipped

---

## Verdict

Any checked box = overengineering detected.

For each checked box:
1. Identify the feature
2. Ask: "What breaks without this in MVP?" If nothing breaks → remove it
3. If it enables a defined deferred item → move to mvp-reduction deferred table with an explicit trigger
4. Document the removal in the Ralph loop delta
