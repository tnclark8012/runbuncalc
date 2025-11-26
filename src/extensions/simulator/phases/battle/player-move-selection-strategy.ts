import { MoveScore } from "../../moveScore";
import { PlayerMoveConsideration } from "../../moveScoring.contracts";

export interface IMoveScoringStrategy {
    scoreMoves(consideredMoves: PlayerMoveConsideration[]): MoveScore[];
}

export const BasicScoring: IMoveScoringStrategy = {
    scoreMoves(consideredMoves: PlayerMoveConsideration[]): MoveScore[] {
        return consideredMoves.map(cm => {
            let score = new MoveScore(cm.result);
            if(cm.attackerDiesToRecoil || cm.guaranteedToFail)
                score.setScore(-1);
            else
                score.setScore(1);
            return score;
        });
    }
}

export const IntuitionScoring: IMoveScoringStrategy = {
    scoreMoves(consideredMoves: PlayerMoveConsideration[]): MoveScore[] {
        let scores: MoveScore[] = [];
        consideredMoves.reduce((playerChosenMove: PlayerMoveConsideration | undefined, potentialMove: PlayerMoveConsideration) => {
            let score = new MoveScore(potentialMove.result);
            scores.push(score);

            if (!playerChosenMove)
                return potentialMove;

            const moreDamage = potentialMove.lowestRollHpPercentage > playerChosenMove.lowestRollHpPercentage;
            const kosWithHigherPriority = potentialMove.kos && playerChosenMove.kos && potentialMove.result.move.priority > playerChosenMove.result.move.priority;
            if ((potentialMove.kos && !playerChosenMove.kos) || kosWithHigherPriority) {
                score.addScore(10);
            }
            
            if (!playerChosenMove.kos && moreDamage)
                score.addScore(1);

            if (potentialMove.attackerDiesToRecoil || potentialMove.guaranteedToFail)
                score.setScore(-Infinity);

            return potentialMove;
        }, undefined);

        return scores;
    }
}

