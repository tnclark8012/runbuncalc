# Run & Bun Battle Planning

Planning teams and battle decisions for Pokemon Run & Bun.

## Language

**Faint risk**:
The probability that at least one of the player's Pokemon faints over the entire battle.

**Risk tolerance**:
The maximum acceptable faint risk for a battle plan, chosen by the player and defaulting to 0%.

**Riskless victory**:
A battle victory with zero faint risk.

**Branching battle plan**:
A plan whose prescribed player actions can differ according to observed battle outcomes.

**Qualifying battle plan**:
A battle plan for which every feasible modeled execution eventually ends in player victory and exact or certified evidence establishes that whole-battle faint risk does not exceed the player's risk tolerance.

**Player state**:
The facts about the player's owned Pokemon, resources, and progress at a particular point in the game, distinct from proposed preparation or battle actions.

**Factual correction**:
A player's correction of what is actually true in their player state, rather than a proposed change to make in the game.

**Planned preparation**:
The team selection and held-item reallocations proposed for an upcoming battle, distinct from the player's current team and item assignments.

**Live battle state**:
The participants, conditions, and relevant action history of an in-progress battle at a particular point in a turn, distinct from the facts needed to prepare for an upcoming battle.
