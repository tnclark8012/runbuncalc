# Run & Bun Battle Planning

Planning teams and battle decisions for Pokemon Run & Bun.

## Language

**Faint risk**:
The probability that at least one of the player's Pokemon faints over the entire battle.

**Risk tolerance**:
An optional maximum acceptable faint risk for a battle plan, set by the player; without one, plans are ranked by faint risk, lowest first.

**Riskless victory**:
A battle victory with zero faint risk.

**Branching battle plan**:
A plan whose prescribed player actions can differ according to observed battle outcomes.

**Player state**:
The facts about the player's owned Pokemon, resources, and progress at a particular point in the game, distinct from proposed preparation or battle actions.

**Factual correction**:
A player's correction of what is actually true in their player state, rather than a proposed change to make in the game.

**Planned preparation**:
The team selection and held-item reallocations proposed for an upcoming battle, distinct from the player's current team and item assignments.

**Live battle state**:
The participants, conditions, and relevant action history of an in-progress battle at a particular point in a turn, distinct from the facts needed to prepare for an upcoming battle.

**Player plan**:
A planned preparation plus any pinned turns, from which the engine completes a branching battle plan.
_Avoid_: Strategy, script

**Pinned turn**:
A player action fixed by the player at a specific point in a battle, which the engine must play rather than choose.
_Avoid_: Forced move, scripted turn
